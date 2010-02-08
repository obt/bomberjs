// node modules
var sys = require('sys'),
    http = require('http'),
    url = require('url');

// dependency modules
var sha1 = require('../dependencies/sha1');

// bomber modules
var Response = require('./response').Response,
    Request = require('./request').Request,
    processAction = require('./action').processAction,
    Cookies = require('./cookies').Cookies,
    SessionManager = require('./session').SessionManager;

/* Server(app)
 *
 * A Server uses Nodes `http` module to listen for HTTP requests on a given 
 * port, and then parses those requests and uses the passed in app to find an
 * action for the request, and then processes that aciton.
 *
 * Parameters:
 *
 * + `app`: Bomberjs `App` object. The app to hand the incoming HTTP
 *   requests to.
 */
var Server = exports.Server = function(app, config) {
  this.base = app;

  // grab the server settings from the base app
  process.mixin(this.options, this.base.server_config, config);

  // the base app doesn't need this anymore, let's not make it available in two
  // different places.
  delete this.base.server_config;

  // Warn if no signing secret is set -- and create a temporary one
  if (!this.options.security || !this.options.security.signing_secret) {
    sys.error( "\nWARNING: No signing secret is set in your configuration file.\n" +
               " The secret is used to sign secure cookies, validate session and encrypt user\n"+
               " passwords, so it's extremely important for you to set a unique and secure secret.\n" +
               " A temporary secret will be used for now, but all cookies, session and user\n" +
               " accounts will be invalidated when the server is restarted!\n" );

    // set the random signing secret
    this.options.security = this.options.security || {};
    this.options.security.signing_secret = sha1.hex_hmac_sha1(Math.random(), Math.random());
  }

  this.session_manager = new SessionManager(this.options.sessions);
};

/* Server.prototype.options
 *
 * The default options for the server.
 *
 * This gets merged with the options specified for the server in the base app.
 */
Server.prototype.options = {
  port: 8400,
  security: {
    signing_secret: ""
  },
  sessions: {
    storage_method: 'disk',
    disk_storage_location: '/tmp/',
    expire_minutes: 600,
    renew_minutes: 10,
    cookie: {
      name: 'session_key',
      domain: '',
      path: '/',
      secure: false
    }
  }
};

/* Server.prototype.stop()
 *
 * Stop listening.
 */
Server.prototype.stop = function() {
  this.httpServer.close();
};

/* Server.prototype.start()
 *
 * Start listening.
 */
Server.prototype.start = function() {
  var server = this;
  var base = server.base;

  this.httpServer = http.createServer(function (req, res) {
      try {
        sys.puts("\nReceived " + req.method + " request for " + req.url);

        // Routers only get a path, we parse the url now so it only happens once
        var parsedURL = url.parse(req.url, true);

        var route = base.getRoute(req.method, parsedURL.pathname);
        if(!route) { return server.send404(res, parsedURL.pathname); }

        // wrap the request and the response
        var request = new Request(req, parsedURL, route);
        var response = new Response(res);
        // Append cookies and sessions objects to request and response
        request.cookies = response.cookies = new Cookies(request, response, server);
        request.session = response.session = server.session_manager.getSession(request);

        // get the action designated by the route, and run it
        var action = base.getAction(route.action);
        processAction(request, response, action);

        // Finish the session (this is unlikely to be the perfect place for it, at last if we're running stuff async)
        // There's probably a need for a way to specify tasks/callbacks after the action has run anyway.
        request.session.finish();
      }
      catch(err) {
        res.sendHeader(500, {'Content-Type': 'text/plain'});
        res.sendBody('500 error!\n\n' + (err.stack || err));
        res.finish();
      }
    });
  this.httpServer.listen(server.options.port);

  sys.puts('Bomber Server running at http://localhost:'+this.options.port);
};

/* Server.prototype.send404()
 *
 * In the event that a route can't be found for a request, this function is
 * called to send the HTTP 404 response.
 *
 * Parameters:
 *
 * `res`: A Node `http.serverResponse` object.
 * `path`: The path for which a route couldn't be found.
 */
Server.prototype.send404 = function(res, path) {
  res.sendHeader(404, {'Content-Type': 'text/plain'});
  var body = 'Not found: ' + path;
  if( this.base.router ) {
    body += '\n\nRoutes tried:';
    this.base.router._routes.forEach(function(route) {
        body += '\n  ' + route.regex;
      });
  }
  res.sendBody(body);
  res.finish();
}

