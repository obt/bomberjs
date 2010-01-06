var sys = require('sys');

// Node modules
var http = require('http');
var url = require('url');

// Bomber modules
var App = require('./base_app').App;
var Response = require('./response').Response;
var Request = require('./request').Request;
var Action = require('./action').Action;

var Server = function(base_app_path, options) {
  this.options = options;
  this.options.port = this.options.port || 8400;

  this.base = new App(base_app_path);
};

Server.prototype.start = function() {
  var server = this;
  var base = server.base;

  http.createServer(function (req, res) {
      try {
        sys.puts("\nReceived " + req.method + " request for " + req.url);

        var parsedURL = url.parse(req.url, true);

        var route = base.router.findRoute(base, req.method, parsedURL.pathname);
        if(!route) {
          res.sendHeader(404, {'Content-Type': 'text/plain'});
          res.sendBody('Not found');
          res.finish();
          return;
        }
        //sys.p(route);

        var view = base.getView(route.action.app, route.action.view);
        var request = new Request(req, parsedURL, route);
        var response = new Response(res);

        (new Action(request, response, view[route.action.action])).start();
      }
      catch(err) {
        res.sendHeader(500, {'Content-Type': 'text/plain'});
        res.sendBody('500 error!\n\n' + err.stack);
        res.finish();
      }
      }).listen(server.options.port);

  sys.puts('Bomber Server running at http://localhost:'+this.options.port);
};

exports.Server = Server;
