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
    SessionManager = require('./session').SessionManager
    makeChainable = require('./chainable_events').makeChainable;

/* Server(project)
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
var Server = exports.Server = function(project, config) {
  this.project = project;
  project.server = this;

  // grab the server settings from the project
  this.project.config.server = process.mixin(Server.__defaultOptions, this.project.config.server, config);
  
  // Warn if no signing secret is set -- and create a temporary one
  if (!this.project.config.security || !this.project.config.security.signing_secret) {
    sys.error( "\nWARNING: No signing secret is set in your configuration file.\n" +
               " The secret is used to sign secure cookies, validate session and encrypt user\n"+
               " passwords, so it's extremely important for you to set a unique and secure secret.\n" +
               " A temporary secret will be used for now, but all cookies, session and user\n" +
               " accounts will be invalidated when the server is restarted!\n" );

    // set the random signing secret
    this.project.security = this.project.security || {};
    this.project.security.signing_secret = sha1.hex_hmac_sha1(Math.random(), Math.random());
  }

  this.listen('start', function(cb) {
      this.session_manager = new SessionManager(this.project.config.server.sessions);
      cb();
    });

  this.listen('request_headers', function(cb, request, response) {
      request.session = response.session = this.session_manager.getSession(request);
      cb();
    });
};

// make the server handle listening for and emitting chainable events
makeChainable(Server);

/* Server.__defaultOoptions
 *
 * The default options for the server.
 *
 * This gets merged with the options specified for the server in the project config
 */
Server.__defaultOptions = {
  port: 8400,
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
  this.emit('stop', this._stopListening, this._stopListening);
};

/* Server.prototype.start()
 *
 * Start listening.
 */
Server.prototype.start = function() {
  this.emit('start', this._startListening, function(reason) { sys.error('server startup was cancelled: ' + reason); });
};

Server.prototype._startListening = function() {
  var server = this;

  this.httpServer = http.createServer(function (req, res) {
      try {
        sys.puts("\nReceived " + req.method + " request for " + req.url);
        server._startRequest(req, res);
      }
      catch(err) {
        res.sendHeader(500, {'Content-Type': 'text/plain'});
        res.sendBody('500 error!\n\n' + (err.stack || err));
        res.finish();
      }
    });
  this.httpServer.listen(this.project.config.server.port);

  sys.puts('Bomber Server running at http://localhost:'+this.project.config.server.port);
};

Server.prototype._stopListening = function() {
  this.httpServer.close();
};

Server.prototype._startRequest = function(req, res) {
  var request = new Request(req);
  var response = new Response(res);

  request.cookies = response.cookies = new Cookies(request, response, this.project);

  // we emit the request event before we have parsed the url and routed the request
  // so that the request listeners can change the url if desired.  I don't know if 
  // that is a desirable ability but it makes sense to me.
  this.emit('request_headers', this._finishRequest, null, request, response);
};

Server.prototype._finishRequest = function(request, response) {
  var parsedURL = url.parse(request.raw_url, true);
  var route = this.project.base_app.getRoute(request.method, parsedURL.pathname);
  if(!route) { return this.send404(response._response, parsedURL.pathname); }

  request.addDetails(parsedURL, route);

  // get the action designated by the route, and run it
  var action = this.project.base_app.getAction(request._action);
  processAction(request, response, action);

  // Finish the session (this is unlikely to be the perfect place for it, at last if we're running stuff async)
  // There's probably a need for a way to specify tasks/callbacks after the action has run anyway.
  request.session.finish();
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
Server.prototype.send404 = function(response, path) {
  var body = 'Not found: ' + path;
  if( this.project.base_app.router ) {
    body += '\n\nRoutes tried:';
    this.project.base_app.router._routes.forEach(function(route) {
        body += '\n  ' + route.regex;
      });
  }

  response.status = 404;
  response.mimeType = 'text/plain';
  response.send(body);
};
