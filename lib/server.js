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
  this.options = {
    port: (this.base.config && this.base.config.port ? this.base.config.port : 8400)
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
        request.cookies = response.cookies = new Cookie(request, response);

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
