var sys = require('sys');
var posix = require('posix');
var path = require('path');

var HTTP301MovedPermanently = require('bomberjs/lib/http_responses').HTTP301MovedPermanently;

function htmlHead () {
    return '<html><head><title>Bomber.js example app</title></head><body>';
}
function htmlFoot () {
    return '</body></html>';
}

exports.index = function(request, response) {
  var html = htmlHead();
  html += "<h1>index action</h1><p>See <tt>routes.js</tt> for more.</p>";
  html += "<p>Other actions include:</p>";
  html += "<ul><li><a href='/section/1000'>section/1000</a></li>";
  html += "<li><a href='/section/2'>section/2 (special case)</a></li>";
  html += "<li><a href='/simple/lorem'>lorem</a></li>";
  html += "</ul>";
  html += htmlFoot();
  return html;
};
exports.show = function(request, response) {
  if( request.params.id == 2 ) {
    return new HTTP301MovedPermanently('http://google.com');
  }
  else {
    return htmlHead() + "show action" + htmlFoot();
  }
};


// can be accessed at /simple/lorem
exports.lorem = function(request, response) {
  // posix.cat returns a Node promise. Which at this time isn't chainable
  // so this example is pretty simple.  But once we can chain, I'll show
  // how to manipulate the result as you move through the chain.
  
  var filename = path.join(path.dirname(__filename),'../resources/text.txt');
  return posix.cat(filename);
};
