exports.index = function(request, response) {
  return "index action";
};
exports.show = function(request, response) {
  if( request.parameters.format == 'json' ) {
    return {a: 1, b: 'two', c: { name: 'three'}};
  }
  else {
    return "show action";
  }
};
