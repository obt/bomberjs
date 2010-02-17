var sys = require('sys');
var fs = require('fs');
var path = require('path');

var HTTP301MovedPermanently = require('bomberjs/lib/http_responses').HTTP301MovedPermanently;

function htmlHead () {
    return '<html><head><title>Bomber.js example app</title></head><body>';
}
function htmlFoot () {
    return '</body></html>';
}

// can be accessed at '/'
exports.index = function(request, response) {
  response.cookies.set('hello','world');

  var views = response.session.get('index_views') + 1;
  response.session.set('index_views', views);

  var html = htmlHead();
  html += "<h1>index action</h1><p>See <tt>routes.js</tt> for more.</p>";
  html += "<p>Other actions include:</p>";
  html += "<ul><li><a href='/section/1000'>section/1000</a></li>";
  html += "<li><a href='/section/2'>section/2 (special case)</a></li>";
  html += "<li><a href='/simple/lorem'>lorem ipsum from file</a></li>";
  html += "<li><a href='/env'>cookies and session variables</a></li>";
  html += "<li><a href='/resources/image.png'>bomber logo</a></li>";
  html += "</ul>";

  html += "<p>You have viewed this page " + views + (views == 1 ? " time" : " times");

  html += htmlFoot();
  return html;
};

exports.env = function(request, response) {
  var views = response.session.get('env_views') + 1;
  response.session.set('env_views', views);

  var html = htmlHead();

  html += "<h1>Env Action</h1>";

  html += "<p>Currently set cookies</p>";
  html += "<dl>";
  request.cookies.keys().forEach(function(key) {
      html += "<dt>"+key+"</dt></dd>"+response.cookies.get(key)+"</dd>";
    });
  html += "</dl>";

  html += "<p>Currently set session vars</p>";
  html += "<dl>";
  request.session.keys().forEach(function(key) {
      html += "<dt>"+key+"</dt></dd>"+response.session.get(key)+"</dd>";
    });
  html += "</dl>";

  html += "<p>You have viewed this page " + views + (views == 1 ? " time" : " times");

  html += htmlFoot();

  return html;
}

// can be accessed at '/section/<number>'
exports.show = function(request, response) {
  var views = response.session.get('show_views') + 1;
  response.session.set('show_views', views);

  if( request.params.id == 2 ) {
    return new HTTP301MovedPermanently('http://google.com');
  }
  else {
    var html = htmlHead();
    html += "<h1>Show Action</h1>";
    html += "<p>You have viewed this page " + views + (views == 1 ? " time" : " times");
    html += htmlFoot();
    return html;
  }
};

// can be accessed at /simple/lorem
exports.lorem = function(request, response) {
  // this example shows some asynchronous stuff at work!
  response.session.set('lorem_views', response.session.get('lorem_views') + 1);

  response.mimeType = 'text/plain';

  var filename = path.join(path.dirname(__filename),'../resources/text.txt');
  
  // fs.cat returns a Node promise. Which at this time isn't chainable
  // so this example is pretty simple.  But once we can chain, I'll show
  // how to manipulate the result as you move through the chain.
  return fs.readFile(filename);
};
