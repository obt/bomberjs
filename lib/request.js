/* The Request object is a wrapper around the node.js
 * http.ServerRequest object. it will basically adds some niceties
 * like, easily waiting for and parsing of POST data (not implemented yet)
 */

var Request = function(request, url, route) {
  this._request = request;
  this._action = route.action;

  // wrap the main ServerRequest properties
  this.method = request.method;
  this.url = url;
  this.headers = request.headers;

  this.params = process.mixin({}, route.params, this.url.query);
};

exports.Request = Request;
