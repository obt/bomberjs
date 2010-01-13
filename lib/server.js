var sys = require('sys');

// Node modules
var http = require('http');
var url = require('url');

// Bomber modules
var Response = require('./response').Response;
var Request = require('./request').Request;
var processAction = require('./action').processAction;

var Server = function(app) {
  this.base = app;
  this.options = {
    port: this.base.config || 8400
  };
};

Server.prototype.start = function() {
  var server = this;
  var base = server.base;

  http.createServer(function (req, res) {
      try {
        sys.puts("\nReceived " + req.method + " request for " + req.url);

        // routes only want the path.  so parse the url here, so it only happens
        // once.
        var parsedURL = url.parse(req.url, true);

        var route = base.getRoute(req.method, parsedURL.pathname);
        if(!route) {
          return server.send404(res, parsedURL.pathname);
        }
        //sys.p(route);

        var request = new Request(req, parsedURL, route);
        var response = new Response(res);

        var action = base.getAction(route.action);
        processAction(request, response, action);
      }
      catch(err) {
        res.sendHeader(500, {'Content-Type': 'text/plain'});

        var message = err.stack || err;
        res.sendBody('500 error!\n\n' + message);

        res.finish();
      }
      }).listen(server.options.port);

  sys.puts('Bomber Server running at http://localhost:'+this.options.port);
};

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

exports.Server = Server;
