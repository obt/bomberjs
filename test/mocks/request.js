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
};

/* Not implemented:
 *
 * + addListener
 * + setBodyEncoding
 * + pause
 * + resume
 * + connection
 *
 * Also needed: a way to send 'body' and 'complete' events
 */
