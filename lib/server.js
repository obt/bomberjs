var sys = require('sys');
var http = require('http');
var url = require('url');

var Response = require('./response').Response;
var Request = require('./request').Request;
var processAction = require('./action').processAction;
var Cookie = require('./cookie').Cookie;

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
var Server = exports.Server = function(app) {
  this.base = app;

  // Make sure we have a signing secret
  this.base.config = this.base.config || {};

  // Warn if no signing secret is set -- and create a temporary one
  if (!this.base.config.signing_secret) {
    sys.error(
              "\nWARNING: No signing secret is set in your configuration file.\n" +
              "The secret is used to signed secure cookies, validate session and encrypt user passwords, " +
              "so it's extremely important for you to set a unique and secure secret.\n" +
              "A temporary secret will be used for now, but all cookies, session and user accounts will be invalidated when the server is restarted!\n"
              );
    this.base.config.signing_secret = require('./sha1').hex_hmac_sha1(Math.random(), Math.random());
  }

  this.options = {
    port: this.base.config.port || 8400,
    signing_secret: this.base.config.signing_secret,
    persistent_storage_method: this.base.config.persistent_storage_method || 'disk',
    persistent_storage_location: this.base.config.persistent_storage_location || '/tmp/'
  };
};

/* Server.prototype.start()
 *
 * Start listening.
 */
Server.prototype.start = function() {
  var server = this;
  var base = server.base;

  http.createServer(function (req, res) {
      try {
        sys.puts("\nReceived " + req.method + " request for " + req.url);

        // Routers only get a path, we parse the url now so it only happens once
        var parsedURL = url.parse(req.url, true);

        var route = base.getRoute(req.method, parsedURL.pathname);
        if(!route) { return server.send404(res, parsedURL.pathname); }

        // wrap the request and the response
        var request = new Request(req, parsedURL, route);
        var response = new Response(res);
        // Append cookies objects to request and response
        request.cookies = response.cookies = new Cookie(request, response, server);

        // get the action designated by the route, and run it
        var action = base.getAction(route.action);
        processAction(request, response, action);
      }
      catch(err) {
        res.sendHeader(500, {'Content-Type': 'text/plain'});
        res.sendBody('500 error!\n\n' + (err.stack || err));
        res.finish();
      }
      }).listen(server.options.port);

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
    this.base.router.routes.forEach(function(route) {
        body += '\n  ' + route.regex;
      });
  }
  res.sendBody(body);
  res.finish();
}
