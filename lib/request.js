/* Request(request, url, route)
 *
 * A Bomber Request is a wrapper around the node.js `http.ServerRequest` object.
 *
 * It will basically add some niceties like, waiting for and parsing of POST
 * data and  easy manipulation of cookies and session variables. But currently
 * it does nothing.
 *
 * Parameters:
 *
 * + `request`: An `http.ServerRequest` instance.
 * + `url`: `Object`: A parsed URL for this request. The server parses the url
 *   so it can send it to the app to determine the action.  We don't want to
 *   parse it again, so we pass it here.
 * + `route`: `Object`.  The route object returned from the router.  See
 *   `Router.prototype.findRoute` for details.
 */

var Request = exports.Request = function(request, url, route) {
  this._request = request;
  this._action = route.action;

  // wrap the main ServerRequest properties
  this.method = request.method;
  this.url = url;
  this.headers = request.headers;

  this.params = process.mixin({}, route.params, this.url.query);
};
