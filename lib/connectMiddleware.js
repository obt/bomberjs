var Buffer = require('buffer').Buffer
  , url = require('url')
  ;

var routing = require('./routing');

module.exports = function(app, routes) {
  // TODO take another argument, response properties to copy, and maybe on for request properties
  var parsedRoutes = routing.load(routes);

  return function(req, res, next) {
    var requestContext =
      { req: req
      , res: res
      , url: url.parse(req.url)
      , method: req.method
      , headers: {}
      };

    var route = routing.findRoute(parsedRoutes, req.method, requestContext.url.pathname);
    if (!route) {
      return next();
    }

    console.log(req.url);

    var ctx = { request: requestContext };

    if (typeof route.params === 'object') {
      for (var key in route.params) {
        ctx[key] = route.params[key];
      }
    }

    app.performAction(route.action, ctx, respond);

    function respond(err, response) {
      // TODO allow people to return certain kinds of errors that have special meaning

      if (err) {
        return next(err);
      }
      
      var status = 200
        , headers = {}
        ;
      
      if (response instanceof Buffer) {
        headers['content-type'] = "text/plain; charset=utf8";
        headers['content-length'] = response.length;
      }
      else if (typeof response === 'string') {
        headers['content-type'] = "text/html; charset=utf8";
        headers['content-length'] = Buffer.byteLength(response);
      }
      else if (typeof response === 'undefined') {
        headers['content-type'] = "text/plain; charset=utf8";
        headers['content-length'] = 0;
        response = '';
      }
      else {
        response = JSON.stringify(response);
        headers['content-type'] = "application/json; charset=utf8";
        headers['content-length'] = Buffer.byteLength(response);
      }

      for (var key in requestContext.headers) {
        headers[key] = requestContext.headers[key];
      }

      res.writeHead(status, headers);
      res.end(response);
    }
  }
}
