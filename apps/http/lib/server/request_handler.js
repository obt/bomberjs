var sys = require('sys'),
    url = require('url');

var Response = require('../response').Response,
    Request = require('../request').Request,
    processAction = require('../action').processAction,
    QuickResponse = require('../quick_responses').QuickResponse;

// this will be called when the server gets an HTTP request
exports.requestHandler = function(req, res) {
  sys.puts("\nReceived " + req.method + " request for " + req.url);

  var request = new Request(req);
  var response = new Response(res);

  this.project.emit('request', {request: request, response: response}, step)
    .then(success)
    .then(null, failure);

  // bind all the callbacks to the server
  var server = this;
  function step() {
    return requestEventStep.apply(server, arguments);
  }

  function success(returned) {
    return routeAndFinishRequest.apply(server, arguments);
  }

  function failure(err) {
    // if a error is thrown at some point along the way we want to be able to
    // send/finish the response so we pass the response to the error handler
    // as well as the error.
    return requestError.call(server, response, err);
  }
};

function requestEventStep(error, returned, previous) {
  if( error ) {
    throw error;
  }
  else if( returned instanceof QuickResponse ) {
    returned.respond(previous.response);
  }
  else if( typeof returned !== 'undefined' && returned !== null ) {
    return returned;
  }
}

function routeAndFinishRequest(rr) {
  var request = rr.request,
      response = rr.response,
      server = this;

  var parsedURL = url.parse(request.raw_url, true);
  var route = getRoute.call(this, request.method, parsedURL.pathname);
  if(!route) { return send404.call(this, response, parsedURL.pathname); }
  request.addDetails(parsedURL, route);

  // get the action designated by the route, and run it
  var action = getAction.call(this, request._action);
  return processAction(request, response, action)
    .then(null, function(err) {
        requestError.call(server, response, err);
      });
}

function requestError(response, error) {
  this.project.emit('error', error, step)
    .then(finished, finished); // call finished no matter what

  function step(returned, previous, next) {
    if( returned instanceof QuickResponse ) {
      returned.respond(response);
    }
    else {
      // pass the error on to the next listener
      next(returned);
    }
  }

  function finished(err) {
    if( response._sentHeaders ) {
      // A response has already been started so we can't change the status code
      // or headers.  Just finish the response.
      if( !response._finished ) {
        response.finish();
      }
    }
    else {
      var res = response._response;

      response.status = 500;
      response.mimeType = 'text/plain';
      response.send('500 error!\n\n' + (err.stack || err));

      if(!response._finished) {
        response.finish();
      }
    }
  }
}

function send404(response, path) {
  var body = 'Not found: ' + path;
  if( this.project.baseApp.router ) {
    body += '\n\nRoutes tried:';
    this.project.baseApp.router._routes.forEach(function(route) {
        body += '\n  ' + route.regex;
      });
  }
  
  response.status = 404;
  response.mimeType = 'text/plain';
  response.send(body);
}

function getRoute(method, url_path) {
  var path = '/'+this.project.baseApp.key,
      app = null;

  while (app = this.project.findApp(path)) {
    if( !app.router ) {
      throw "App has no Router";
    }
    
    var route = app.router.findRoute(method, url_path);

    if( route ) {
      if( route.path ) {
        path = path.join(path, route.path);
      }
      else {
        if( !route.action.app ) {
          route.action.app = path;
        }
        else if( route.action.app.charAt(0) !== '/' ) {
          route.action.app = path+route.action.app;
        }
        return route;
      }
    }
    else {
      return null;
    }
  }

  return null;
}

function getAction(routeAction) {
  if( routeAction.action instanceof Function ) {
    // If the routeAction's action is a function, just return that
    return routeAction.action;
  }

  var app = this.project.findApp(routeAction.app);

  if( !app.views ) {
    app.views = {};
  }

  if( !app.views[routeAction.view] ) {
    app.views[routeAction.view] = app.load(app.modulePath+'/views/'+routeAction.view);
  }

  return app.views[routeAction.view][routeAction.action];
}
