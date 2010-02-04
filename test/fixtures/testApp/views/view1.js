var sys = require('sys');

exports.index = function(request, response) {
  response.cookies.set('name','value');
  return "index action";
};
exports.show = function(request, response) {
  if( request.params.format == 'json' ) {
    return {a: 1, b: 'two', c: { value: 'three'}};
  }
  else {
    var cookie = response.cookies.get('name', '');
    return "show action" + (cookie !== null ? (' with cookie name=' + cookie) : '');
  }
};
