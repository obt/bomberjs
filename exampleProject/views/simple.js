var sys = require('sys');
var posix = require('posix');
var path = require('path');

var HTTP301MovedPermanently = require('bomberjs/lib/http_responses').HTTP301MovedPermanently;

exports.index = function(request, response) {
  return "index action";
};
exports.show = function(request, response) {
  if( request.params.id == 2 ) {
    return new HTTP301MovedPermanently('http://google.com');
  }
  else {
    return "show action";
  }
};


// can be accessed at /simple/lorem
exports.lorem = function(request, response) {
  // posix.cat returns a Node promise. Which at this time isn't chainable
  // so this example is pretty simple.  But once we can chain, I'll show
  // how to manipulate the result as you move through the chain.
  
  var filename = path.join(path.dirname(__filename),'../resources/lorem-ipsum.txt');
  return posix.cat(filename);
};
