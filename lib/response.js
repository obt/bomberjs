var sys = require('sys');
/* The Response object is a wrapper around the node.js
 * http.ServerResponse object, that basically adds some niceties
 * like, easily cookies and session variables (not implemented yet)
 * and throws errors if you try and do things out of order. Or twice.
 */

var Response = function(response) {
  this._response = response;
  this.headers = {};
};

/* default options for a response. change this on an 
 * instance by instance basis.  Maybe in the future these
 * should be set from the Server configuration options?
 */
Response.prototype._finishOnSend = true;

/* The default state */
Response.prototype.status = 200;
Response.prototype.encoding = 'utf8';
Response.prototype.contentType = 'text/html';

Response.prototype._sentHeaders = false;
Response.prototype._finished = false;

/* wrapper around the headers object.  At some point we might 
 * want to add checks to make sure the headers haven't already 
 * been sent.  And we want this to match the API for setting 
 * cookies and session variables.  (thos functions haven't
 * been written yet).
 */
Response.prototype.setHeader = function(key, value) {
  if( this._sentHeaders ) {
    //TODO create custom errors here
    throw "Headers already sent";
  }
  this.headers[key] = value;
};

/* basically just calls http.ServerRespose.sendHeader
 * but first makes sure we haven't already send the headers before.
 */
Response.prototype.sendHeaders = function() {
  if( this._sentHeaders ) {
    throw "Headers have already been sent!";
  }

  this._sentHeaders = true;

  if( !('Content-Type' in this.headers) ) {
    this.headers['Content-Type'] = this.contentType;
    if( this.contentType.indexOf('text/') === 0 ) {
      this.headers['Content-Type'] += '; '+this.encoding;
    }
  }

  this._response.sendHeader(this.status, this.headers);
};

/* Very similar to http.ServerResponse.sendBody except it 
 * handles sending the headers first, and finishing the
 * request (which is the default)
 */
Response.prototype.send = function(str) {
  if( this._finished ) {
    //TODO create custom errors here
    throw "Response has already finished";
  }

  /* TODO: check to see if this._finishOnSend is set, and if so
   * set the content-length header */

  if( !this._sentHeaders ) {
    this.sendHeaders();
  }

  //TODO throw an error if we have already called sendBody but with
  // a different encoding?
  this._response.sendBody(str, this.encoding);

  if(this._finishOnSend) {
    this.finish();
  }
};
Response.prototype.finish = function() {
  if( !this._sentHeaders ) {
    this.sendHeaders();
  }

  if( this._finished ) {
    //TODO create custom errors here
    throw "Response has already finished";
  }

  this._finished = true;
  this._response.finish();
}

exports.Response = Response;
