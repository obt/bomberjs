var sys = require('sys')
  , url = require('url')
  ;

module.exports = function requestHandler(app, connection) {
  app.chain("request", connection, _route);

  function _route(err, connection) {
    if (err) {
      sendError(err);
    }

    if( !app.router ) {
      sendError(new Error("App '"+app.key+"' has no router"));
    }

    var parsedURL = url.parse(connection.request.url, true)
      , route = app.router.findRoute(connection.request.method, parsedURL.pathname)
      ;

    if (route && route.action) {
      if (route.action.app && (!route.action.controller || !route.action.method)) {
        // we have a partial route
      }
      // TODO add route.params to connection request
      connection.processAction(app, route.action);
    }
    else {
      sendError(new Error("Could not find route matching request"));
    }
  }

  function sendError(err) {
    sys.puts(err.stack);

    var r = connection.response;

    r.mimeType = 'text/plain';
    r.status = 500;
    r.send('500 error!\n\n' + (err.stack || err));
    r.finish();
  }
}
