var querystring = require('querystring');

var promise = require('../bundled/promise');

var makeChainable = require('./chainable').makeChainable;

/* Request(req, url, route)
 *
 * A Bomber Request is a wrapper around the node.js `http.ServerRequest` object.
 *
 * It will basically add some niceties like, waiting for and parsing of POST
 * data and  easy manipulation of cookies and session variables. But currently
 * it does nothing.
 *
 * Parameters:
 *
 * + `req`: An `http.ServerRequest` instance.
 * + `url`: `Object`: A parsed URL for this request. The server parses the url
 *   so it can send it to the app to determine the action.  We don't want to
 *   parse it again, so we pass it here.
 * + `route`: `Object`.  The route object returned from the router.  See
 *   `Router.prototype.findRoute` for details.
 */
var Request = exports.Request = function(req, url, route) {
  this._request = req;

  // wrap the main ServerRequest properties
  this.method = req.method;
  this.raw_url = req.url;
  this.headers = req.headers;

  if( route ) {
    this._action = route.action;
    this.url = url;
    this.params = process.mixin({}, route.params, this.url.query);
  }
  else {
    this.url = null;
    this.params = null;
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

Request.prototype.addDetails = function(url, route) {
  this._action = route.action;
  this.url = url;
  this.params = process.mixin({}, route.params, this.url.query);
};

/* Request.prototype.loadData(parseData)
 *
 * Returns a promise that is called with the body of this request. 
 *
 * Node doesn't wait for the entire body of a request to be received  before
 * starting the callback for a given request.  Instead we have to listen for
 * 'body' and 'complete' events on the request to receive and know when the
 * entire request has been loaded. That's what this function does.
 *
 * Additionally `Request.prototype.loadData` will parse the body of the 
 * request using `querystring.parse()`. This can be turned off with `parseData`
 * parameter.
 *
 * Parameters:
 *
 * + `parseData`: `Boolean`.  Whether or not to parse the loaded data with
 *   `querystring.parse()`.  Default is true.
 *
 * Returns:
 *
 * A Promise that will be fullfilled with the loaded (and maybe parsed data)
 * for this request.
 */
Request.prototype.loadData = function(parseData) {
  if( typeof parseData == 'undefined' ) {
    parseData = true;
  }

  var p = new promise.Promise();
  var self = this;

  if( this.data === null ) {
    var data = '';

    this.listen('body', function(str) {
        data += str;
      });

    this.listen('finished', function(str) {
        if( str ) {
          data += str;
        }

        if( parseData ) {
          self.data = querystring.parse(data);
        }
        else {
          self.data = data;
        }

        p.emitSuccess(self.data);
      });
  }
  else {
    process.nextTick(function() {
        p.emitSuccess(self.data);
      });
  }

  return p;
};
