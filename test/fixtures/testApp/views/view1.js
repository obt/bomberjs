var sys = require('sys');

exports.index = function(request, response) {
  return "index action";
};
exports.show = function(request, response) {
  if( request.params.format == 'json' ) {
    return {a: 1, b: 'two', c: { value: 'three'}};
  }
  else {
    return "show action";
  }
};
