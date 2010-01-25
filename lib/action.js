var sys = require('sys');
var Promise = require('./promise').Promise;

var utils = require('./utils');
var HTTPResponse = require('./http_responses').HTTPResponse;

/* processAction(request, response, action)
 *
 * This handles actually running an action.  If the response from the action is a
 * Promise, `complete` or `err` are added as callbacks.  Otherwise they are called
 * directly with the response.
 *
 * Parameters:
 *
 * + `request`: a Bomberjs Request object
 * + `response`: a Bomberjs Response object
 * + `action`: a function that is to be run
 */
exports.processAction = function(request, response, action) {
  var action_details = {
    request: request,
    response: response
  };

  var complete_handler = utils.bind(complete, action_details);
  var err_handler = utils.bind(err, action_details);

  //TODO before filters?
  
  try {
    var action_response = action(request, response);
  }
  catch(err) {
    err_handler(err);
  }

  if(    action_response instanceof process.Promise
      || action_response instanceof Promise ) {
    action_response.addCallback(complete_handler);
    action_response.addErrback(err_handler);
  }
  else {
    complete_handler(action_response);
  }
};

/* err(err)
 *
 * At some point in the course of the action an object was thrown.  If it is 
 * an HTTPResponse, then call `respond()` on it, otherwise this must be an 
 * error, return a status 500 response
 *
 * Parameters:
 *
 * + `err`: The object that was thrown (presumably an error)
 */
function err(err) {
  if( err instanceof HTTPResponse ) {
    err.respond(this.response);
  }
  else {
    if( !this.response._finished ) {
      if( !this.response._sentHeaders ) {
        this.response.status = 500; 
        this.contentType = 'text/plain';
      }

      this.response.send('500 error!\n\n' + (err.stack || err));
      
      if( !this.response.finishOnSend ) {
        this.response.finish();
      }
    }
  }

  return null;
}

/* complete(action_response)
 *
 * Is called from `process_action` with the response from an action
 *
 * Can only take one argument, because functions (actions) can only return
 * one thing.
 *
 * The role of this function is to decide if the action returned something that
 * needs to be sent to the client. There are three cases:
 *
 * 1.  The action didn't return anything.  In this case we assume the action
 *     took care of sending its response itself.
 * 2.  The action returned an object that is an instance of HTTPResponse, aka it
 *     returned a prebuilt response with a `respond()` function. so just call
 *     `respond()` on that object.
 * 3.  The action returned something else.  In this case we want to send this to
 *     the client.  If it is a string, send it as it is, and if it is anything 
 *     else convert it to a JSON string and then send it.
 *
 * Parameters:
 *
 * + `action_response`: the response from the action.
 */
function complete(action_response) {
  if( typeof action_response == "undefined" ) {
    // Do nothing. The action must have taken care of sending a response.
  }
  else if( action_response instanceof HTTPResponse ) {
    err.respond(this.response);
  }
  else {
    //otherwise send a response to the client
    if(action_response.constructor == String) { // return text/html response
      this.response.send(action_response);
    }
    else { // return a json representation of the object
      this.response.contentType = 'application/json';
      this.response.send(sys.inspect(action_response));
    }
  }
};
