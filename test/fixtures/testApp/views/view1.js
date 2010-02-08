var sys = require('sys');

exports.index = function(request, response) {
  response.cookies.set('name1','value1');
  response.cookies.set('name2','value2');
  return "index action";
};
exports.show = function(request, response) {
  if( request.params.format == 'json' ) {
    return {a: 1, b: 'two', c: { value: 'three'}};
  }
  else {
    var cookie = response.cookies.get('name1', '');
    return "show action" + (cookie !== null ? (' with cookie name=' + cookie) : '');
  }
};
