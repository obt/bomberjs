/* The Request object is a wrapper around the node.js
 * http.ServerRequest object. it will basically adds some niceties
 * like, easily waiting for and parsing of POST data (not implemented yet)
 */

var Request = function(req, route) {
  this._req = req;
  this._action = route.action;

  // wrap the main ServerRequest properties
  this.method = req.method;
  this.uri = req.uri;
  this.headers = req.headers;

  this.params = process.mixin({}, route.params, this.uri.params);
};

exports.Request = Request;
