var sys = require('sys');
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

/* default options for Responses.  I guess we should be able to specify
 * these in config.js
 */
Response.__defaultContentType = 'text/html';
Response.__defaultTransferEncoding = 'utf8';

// in sendFile, we'll only read the file in this many bytes at a time.
// this way if it is a large file, we won't try to load the whole thing into
// memory at once.  
Response.__bytesToRead = 16384; // 16 * 1024

// shortcut for making easy default responses.
Response.prototype.build = responses;

/* default options for a response. change this on an 
 * instance by instance basis.  
 */
Response.prototype.finishOnSend = true;
// how to encode the calls to sendBody
Response.prototype.transferEncoding = Response.__defaultTransferEncoding;

/* The default response */
Response.prototype.status = 200;
// we set these to null so we can know if they were explicitly set.
// if they weren't we'll try and fill them in ourselves
Response.prototype.contentType = null;
Response.prototype.charset = null;

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

  // Check to see if the Content-Type was explicitly set.  If not use
  // this.contentType and this.charset (if applicable).  And if that isn't set
  // use the default.
  if( !('Content-Type' in this.headers) ) {
    this.contentType = this.contentType || Response.__defaultContentType;
    this.charset = this.charset || utils.charsets.lookup(this.contentType);
    this.headers['Content-Type'] = this.contentType + (this.charset ? '; charset=' + this.charset : '');
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

  this._response.sendBody(str, this.transferEncoding);

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
Response.prototype.sendFile = function(filename) {
  // to be able to notify scripts when this is done sending
  var p = new process.Promise();

  // if we haven't sent the headers and a contentType hasn't been specified
  // for this response, then look one up for this file
  if( !this._sentHeaders && this.contentType === null ) {
    this.contentType = utils.mime.lookup(filename);
  }

  // We want to use the binary encoding for reading from the file and sending
  // to the server so the file is transferred exactly.  So we save the 
  // current encoding to set it back later.
  var previousEncoding = this.transferEncoding;
  this.transferEncoding = 'binary';

  // We're going to send the response in chunks, so we are going to change 
  // finishOnSend. We want to set it back to what it was before when we are done.
  var previousFinishOnSend = this.finishOnSend;
  this.finishOnSend = false;

  // bind our callbacks functions to this response
  var self = this;

  var errback = function(e) {
    // set this back to what it was before since we are about to break out of
    // what we are doing...
    self.finishOnSend = previousFinishOnSend;
    self.transferEncoding = previousEncoding;
    p.emitError(e);
  };

  posix.open(filename, process.O_RDONLY , 0666).addCallback(function(fd) {
      var pos = 0;

      var callback = function(chunk, bytesRead) {
        if( bytesRead > 0 ) {
          self.send(chunk);
          pos += bytesRead;
        }

        // if we didn't get our full amount of bytes then we have read all
        // we can.  finish.
        if( bytesRead < Response.__bytesToRead ) {
          if( previousFinishOnSend ) {
            self.finish();
          }
          self.finishOnSend = previousFinishOnSend;
          self.transferEncoding = previousEncoding;
          p.emitSuccess();
        }
        else {
          posix.read(fd, Response.__bytesToRead, pos, self.transferEncoding)
            .addCallback(callback)
            .addErrback(errback);
          }
      };

      posix.read(fd, Response.__bytesToRead, pos, self.transferEncoding)
        .addCallback(callback)
        .addErrback(errback);
    })
    .addErrback(errback);

  return p;
};

exports.Response = Response;
