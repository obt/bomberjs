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
    makeChainable = require('./chainable').makeChainable,
    responses = require('./http_responses');

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

  this.listen('start', function() {
      this.session_manager = new SessionManager(this.project.config.server.sessions);
    });

  this.listen('request', function(reqres) {
      var request = reqres.request;
      var response = reqres.response;
      request.session = response.session = this.session_manager.getSession(request);

      return reqres;
    });
};
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
  this.emit('stop', this._stopListening);
};

Server.prototype._stopListening = function() {
  this.httpServer.close();
};

/* Server.prototype.start()
 *
 * Start listening.
 */
Server.prototype.start = function() {
  this.emit('start', this._startListening, this._startStep);
};

Server.prototype._startStep = function(result) {
  if( result instanceof Error ) {
    sys.puts( result.message || result );
    // return true to stop the chain of events
    return true;
  };
};

Server.prototype._startListening = function() {
  var server = this;

  this.httpServer = http.createServer(function (req, res) {
      // we do this in a closure so we can have a reference to the "server" object
        server._startRequest(req, res);
    });
  this.httpServer.listen(this.project.config.server.port);

  sys.puts('Bomber Server running at http://localhost:'+this.project.config.server.port);
};

Server.prototype._startRequest = function(req, res) {
  // TODO: move to a logging listener?
  sys.puts("\nReceived " + req.method + " request for " + req.url);

  var request = new Request(req);
  var response = new Response(res);

  request.cookies = response.cookies = new Cookies(request, response, this.project);

  try {
    // we emit the request event before we have parsed the url and routed the request
    // so that the request listeners can change the url (and thus the eventual route)
    // if desired. 
    // TODO: Check to see if there are listeners so we don't go through the overhead of creating a closure?
    // the step needs access to the response, so "bind" it here
    var step = function(reqres) { return this._requestStep(response, reqres); };
    this.emit('request', this._finishRequest, step, {request: request, response: response});
  }
  catch(err) {
    this._sendError(response, err);
  }
};

Server.prototype._requestStep = function(response, returned) {
  if( typeof returned === 'undefined' || returned === null ) {
    // the listener on the request didn't return the request-response object, so we assume
    // it handled responding.
    // Return true to stop the chain
    return true;
  }
  else if( returned instanceof responses.HTTPResponse ) {
    returned.respond(response);
    // Return true to stop the chain
    return true;
  }
  else if( returned instanceof Error ) {
    // the listener on this request either didn't pass the request along or passed along
    // an error, so call the error event
    this._sendError(response, returned);

    // Return true to stop the chain
    return true;
  }
};

Server.prototype._finishRequest = function(reqres) {
  var request = reqres.request;
  var response = reqres.response;

  var parsedURL = url.parse(request.raw_url, true);
  var route = this.project.base_app.getRoute(request.method, parsedURL.pathname);

  if(!route) { return this.send404(response, parsedURL.pathname); }

  request.addDetails(parsedURL, route);

  // get the action designated by the route, and run it
  var action = this.project.base_app.getAction(request._action);
  processAction(request, response, action);

  // Finish the session (this is unlikely to be the perfect place for it, at last if we're running stuff async)
  // There's probably a need for a way to specify tasks/callbacks after the action has run anyway.
  request.session.finish();
};

Server.prototype._sendError = function(response, error) {
  var finished = function(err) {
    if( response._sentHeaders ) {
      // A response has already been started so we can't change the status code
      // or headers.  Just finish the response.
      if( !response._finished ) {
        response.finish();
      }
      return;
    }
    var res = response._response;

    res.sendHeader(500, {'Content-Type': 'text/plain'});
    res.sendBody('500 error!\n\n' + (err.stack || err));
    res.finish();
  };
  var step = function(returned) {
    if( returned instanceof responses.HTTPResponse ) {
      // a listener on the 'error' event returned an HTTPResponse, so send it
      if( response._sentHeaders ) {
        // A response has already been started so we can't change the status code
        // or headers.  Just finish the response.
        if( !response._finished ) {
          response.finish();
        }
      }
      else {
        returned.respond(response);
      }

      // Return true to stop the chain
      return true;
    }
  };
  this.emit('error', finished, step, error );
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
