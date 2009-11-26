/* The Response object is a wrapper around the node.js
 * http.ServerResponse object, that basically adds some niceties
 * like, easily cookies and session variables (not implemented yet)
 * and throws errors if you try and do things out of order. Or twice.
 */

var Response = function(res) {
  this._res = res;
  this.headers = {};
};

/* default options for a response. change this on an 
 * instance by instance basis.  Maybe in the future these
 * should be set from the Server configuration options?
 */
Response.prototype.finishOnSend = true;

/* the default state.  We add these to the
 * prototype to save memory.  If they are overwritten it will be 
 * on the instance of the object, like we would want.
 * We really don't need to be worrying about memory usage at this
 * point.  Let's just make it work first!
 */
Response.prototype.status = 200;
Response.prototype.sentHeaders = false;
Response.prototype.finished = false;

/* wrapper around the headers object.  At some point we might 
 * want to add checks to make sure the headers haven't already 
 * been sent.  And we want this to match the API for setting 
 * cookies and session variables.  (thos functions haven't
 * been written yet).
 */
Response.prototype.setHeader = function(key, value) {
  this.headers[key] = value;
};

/* basically just calls http.ServerRespose.sendHeader
 * but first makes sure we haven't already send the headers before.
 */
Response.prototype.sendHeaders = function() {
  if( this.sentHeaders ) {
    throw "Headers have already been sent!";
  }

  this.sentHeaders = true;
  this._res.sendHeader(this.status, this.headers);
};

/* Very similar to http.ServerResponse.send except it 
 * handles sending the headers first, and finishing the
 * request (which is the default)
 */
Response.prototype.send = function(str) {
  if( this.finished ) {
    throw "Response has already finished";
  }

  /* TODO: check to see if this.finishOnSend is set, and if so
   * set the content-length header */

  if( !this.sentHeaders ) {
    this.sendHeaders();
  }

  this._res.sendBody(str);

  if(this.finishOnSend) {
    this.finish();
  }
};
Response.prototype.finish = function() {
  if( this.finished ) {
    throw "Response has already finished";
  }

  this.finished = true;
  this._res.finish();
}

exports.Response = Response;
