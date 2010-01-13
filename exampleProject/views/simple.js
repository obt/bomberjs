var sys = require('sys');

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
