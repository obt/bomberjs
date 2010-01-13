var sys = require('sys');
var Promise = require('./promise').Promise;

var utils = require('./utils');
var HTTPResponse = require('./http_responses').HTTPResponse;

exports.processAction = function(req, res, action) {
  var action_details = {
    request: req,
    response: res
  };

  var complete_handler = utils.bind(complete, action_details);
  var err_handler = utils.bind(err, action_details);

  //TODO before filters?
  
  try {
    var action_response = action(req, res);
  }
  catch(err) {
    err_handler(err);
  }

  if( action_response instanceof Promise ) {
    action_response.addBoth(complete_handler);
  }
  else {
    complete_handler(action_response);
  }
};

function err(err) {
  if( err instanceof HTTPResponse ) {
    err.respond(this.response);
  }
  else {
    this.response._res.sendHeader(500, {'Content-Type': 'text/plain'});
    this.response._res.sendBody('some other error');
    this.response._res.finish();
  }
}

/* can only take ONE argument
 *
 * basically, this is the result of the view, so it should return whatever
 * it 'made'
 */
function complete(something) {
  if( typeof something == "undefined" ) {
    //do nothing.
  }
  else if( something instanceof HTTPResponse ) {
    return err.call(this,something);
  }
  else {
    //otherwise send a response to the client
    if(something.constructor == String) { // return text/html response
      this.response.setHeader('Content-Type', 'text/html');
      this.response.send(something);
    }
    else { // return a json representation of the passed in object
      this.response.setHeader('Content-Type', 'text/json');
      this.response.send(sys.inspect(something));
    }
  }
};
