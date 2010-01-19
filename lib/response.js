var posix = require('posix');

var responses = require('./http_responses');
var utils = require('./utils');

/* The Response object is a wrapper around the node.js
 * http.ServerResponse object, that basically adds some niceties
 * like, easily setting cookies and session variables (not implemented yet)
 * and throws errors if you try and do things out of order. Or twice.
 */

var Response = function(response) {
  this._response = response;
  this.headers = {};
};

Response.prototype.build = responses;

/* default options for a response. change this on an 
 * instance by instance basis.  Maybe in the future these
 * should be set from the app configuration settings?
 */
Response.prototype.finishOnSend = true;

/* The default response */
Response.prototype.status = 200;
Response.prototype.encoding = 'utf8';
Response.prototype.contentType = 'text/html';

/* variables for keeping track of internal state */
Response.prototype._sentHeaders = false;
Response.prototype._finished = false;

/* wrapper around the headers object. 
 *
 * You can also just access the headers object directly.  The 
 * following are practicially equivalent:
 *
 * response.setHeader('Content-Type', 'text');
 * response.headers['Content-Type'] = 'text';
 *
 * the only difference is that the former checks that the headers
 * haven't already been sent, and throws an error if they have.
 */
Response.prototype.setHeader = function(key, value) {
  if( this._sentHeaders ) {
    //TODO create custom errors here
    throw "Headers already sent";
  }
  this.headers[key] = value;
};

/* wrapper around http.ServerRespose.sendHeader
 *
 * throws an error if the headers have already been sent
 * sets the Content-Type header if it isn't set
 * sends the headers 
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

  /* TODO: check to see if this.finishOnSend is set, and if so
   * set the content-length header */

  if( !this._sentHeaders ) {
    this.sendHeaders();
  }

  //TODO throw an error if we have already called sendBody but with
  // a different encoding?
  this._response.sendBody(str, this.encoding);

  if(this.finishOnSend) {
    this.finish();
  }
};

/* Finish this request, closing the connection with the client.
 * A wrapper around http.ServerResponse.finish
 */
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
};

/* Makes sending files really easy.  Give it a filename, and it 
 * will read the file in chunks (if it is a big file) and 
 * send them back to the client.
 */
Response.prototype.sendFile = function(filename, contentType) {
  if( !this._sentHeaders ) {
    // Possibly determine content type and prepare the response
    if( typeof contentType == 'undefined' ) {
      this.contentType = utils.mime.lookup(filename);
    }
    else {
      this.contentType = contentType;
    }
  }

  // to be able to notify scripts when it is done sending. currently
  // this always emits success, so it is only useful for know when this
  // function is done.
  var p = new process.Promise();

  // we'll only read the file in this many bytes at a time this way,
  // if it is a large file, we won't try to load the whole thing into
  // memory at once
  var bytes_to_read = 500000;

  // bind our callback functions to this response
  var self = this;

  // we're going to send the response in chunks
  var wasFinishOnSend = self.finishOnSend;
  self.finishOnSend = false;

  var errback = function(e) {
    p.emitError(e);
  };

  posix.open(filename, process.O_RDONLY , 0644).addCallback(function(fd) {

      var callback = function(chunk, bytes_read) {
        if( bytes_read > 0 ) {
          self.send(chunk);
        }
        if( bytes_read < bytes_to_read ) {
          if( wasFinishOnSend ) {
            self.finish();
          }
          p.emitSuccess();
        }
        else {
          posix.read(fd, bytes_to_read)
            .addCallback(callback)
            .addErrback(errback);
          }
      };

      posix.read(fd, bytes_to_read)
        .addCallback(callback)
        .addErrback(errback);
    })
    .addErrback(errback);

  return p;
};

exports.Response = Response;
