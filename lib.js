var sys = require('sys');

var inherit = function(func) {
  var f = function() {};
  f.prototype = new func();
  for( name in func )
  {
    if(func.hasOwnProperty(name)) {
      f[name] = func[name];
    }
  }
  return f;
};

var Renderer = function() {};
Renderer.create = function create() {
  var rend = new this();

  rend.METHOD = 'GET'; //GET, POST, PUT, DELETE
  rend.FORMAT = 'HTML'; //HTML, JSON, XML
  rend.PARAMS = {}; //GET or POST parameters
  rend.RAW_POST_DATA = null; //POST data.  Useful, if json is submitted or something
  rend.REQUEST_HEADERS = {}; //Headers from the request.
  rend.URI = {}; //The same as node.js' http.ServerRequest.uri

  return rend;
};
Renderer.prototype.render = function() {
  sys.p('render some template or other renderrer!');
  if(arguments[0].constructor == Renderer)
  {
    sys.puts('hi');
    arguments[0][arguments[1]].call({});
  }
}

var RootRenderer = inherit(Renderer);
var rr = RootRenderer.create();

sys.p(rr);

var Archives = inherit(RootRenderer);
Archives.prototype.index = function() {
  sys.puts('hi');
};

sys.p(Archives.prototype instanceof Renderer);

rr.render(Archives,'index');
