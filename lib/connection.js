var sys = require('sys');

var cee = require('./chainedEventEmitter')
  , request = require('./request')
  , response = require('./response')
  ;

exports.create = function(req, res) {
  var conn = {
    request: request.wrap(req)
  , response: response.wrap(res)
  // utility functions
  , processAction: connection_processAction
  };

  cee.makeEmitter(conn);

  return conn;
}

function connection_processAction(app, action, callback) {
  if( !action ) {
    callback = action;
    action = app;
    app = undefined;
  }

  this.response.mimeType = 'text/plain';
  this.response.send(sys.inspect(action));
  this.response.finish();
}
