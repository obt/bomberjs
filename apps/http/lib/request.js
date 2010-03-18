var querystring = require('querystring');
var promise = require('bomberjs/bundled/promise');
var makeChainable = require('bomberjs/lib/chainable').makeChainable;

var Request = exports.Request = function(req, url, route) {
  this._request = req;

  // wrap the main ServerRequest properties
  this.method = req.method;
  this.raw_url = req.url;
  this.headers = req.headers;

  if( route ) {
    this.setRoute(url, route);
  }
  else {
    this.url = url;
  }
  
  this.data = null;

  var self = this;
  this._request.addListener('body', function(chunk) {
      self.emit('body', null, null, chunk);
    });
  this._request.addListener('complete', function(chunk) {
      self.emit('finished', null, null, chunk);
    });
};
makeChainable(Request);

Request.prototype.setRoute = function(url, route) {
  this._action = route.action;
  this.url = url;
  this.params = process.mixin({}, route.params, this.url.query);
};
