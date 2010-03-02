/* Mock Node http.serverRequest
 *
 * Responds to all the methods that http.serverRequest does (or it will 
 * eventually).
 */

var MockRequest = exports.MockRequest = function(method, url) {
  this.method = method;
  this.url = url;
  this.headers = null;
  this.body = [];
  this.finished = false;
  this.httpVersion = "1.1";

  this._listeners = {};
};

MockRequest.prototype.addListener = function(event, callback) {
  if( !(event in this._listeners) ) {
    this._listeners[event] = [];
  }

  this._listeners[event].push(callback);
};

MockRequest.prototype.emit = function() {
  var args = Array.prototype.slice.call(arguments);
  var event = args.shift();

  this._listeners[event].forEach(function(cb) {
      cb.apply(null, args);
    });
};

/* Not implemented:
 *
 * + setBodyEncoding
 * + pause
 * + resume
 * + connection
 */
