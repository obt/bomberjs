/* The Request object is a wrapper around the node.js
 * http.ServerRequest object. it will basically adds some niceties
 * like, easily waiting for and parsing of POST data (not implemented yet)
 */

var Request = function(req, params) {
  this._req = req;

  // wrap the main ServerRequest properties
  this.method = req.method;
  this.uri = req.uri;
  this.headers = req.headers;

  this.params = process.mixin({}, params, this.uri.params);
};

exports.Request = Request;
