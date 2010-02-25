var promise = require('../bundled/promise');
var HTTPResponse = require('./http_responses').HTTPResponse;

exports.processAction = function(request, response, action) {
  var p = new promise.Promise();

  try {
    var returned = action(request, response);
    promise.when(returned, complete_handler, err_handler);
  }
  catch(err) {
    err_handler(err);
  }


  function complete_handler(value) {
    complete(request, response, p, value);
  }
  function err_handler(err) {
    p.reject(err);
  }

  return p;
};

function complete(request, response, p, action_response) {
  if( typeof action_response == "undefined" ) {
    // Do nothing. The action must have taken care of a response.
  }
  else if( action_response instanceof HTTPResponse ) {
    action_response.respond(response);
  }
  else {
    //otherwise send a response to the client
    if(action_response.constructor == String) { // return text/html response
      response.send(action_response);
    }
    else { // return a json representation of the object
      response.mimeType = 'application/json';
      response.send(JSON.stringify(action_response));
    }
  }
   p.resolve();
};
