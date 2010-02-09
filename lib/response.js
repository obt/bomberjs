var sys = require('sys'),
    posix = require('posix');

var responses = require('./http_responses'),
    utils = require('./utils');

/* Response(response)
 *
 * The Response object is a wrapper around the Node's `http.ServerResponse`
 * object. 
 *
 * It makes manipulating a response easier.  
 *
 * Now, instead of having to worry about calling `sendHeader` or `finish`, you
 * just set properties on the response (like `status`, `mimeType`, 
 * `charset`, or `headers['X']`) and then when you call `send` it will do all
 * that for you.
 *
 * However, if you want the fine grained control, you can still do things the
 * old way (by calling `sendHeaders` or setting `response.finishOnSend` to false
 * yourself).
 *
 * Eventually we'll make it do other things as well, like making it easier to
 * set cookies and session variables.
 *
 * Parameters:
 *
 * + `response`: a `http.ServerResponse` instance.
 */
var Response = exports.Response = function(response) {
  this._response = response;
  this.headers = {};
};


//TODO Make these defaults loaded in from config.js in the app.

/* Response.__defaultMimeType
 * 
 * If `response.mimeType` isn't set, this value is used
 */
Response.__defaultMimeType = 'text/html';
/* Response.__defaultTransferEncoding
 * 
 * The default encoding used for `http.serverResponse.sendBody(chunk, encoding)`
 */
Response.__defaultTransferEncoding = 'utf8';
/* Response.__bytesToRead
 * 
 * In `Response.prototype.sendFile()` we only read the file in this many bytes at
 * a time. This way if it is a large file, we won't try to load the whole thing
 * into memory at once.  
 */
Response.__bytesToRead = 16384; // 16 * 1024

/* Response.prototype.build
 *
 * Shortcut to require('bomberjs/lib/http_responses') for making easy/quick 
 * responses.
 */
Response.prototype.build = responses;

/* Response.prototype.finishOnSend
 *
 * If when `Response.prototype.send()` is called, should
 * `Response.prototype.finish()` also be called?
 */
Response.prototype.finishOnSend = true;

/* Response.prototype.transferEncoding
 *
 * The encoding used for `http.serverResponse.sendBody(chunk, encoding)`
 */
Response.prototype.transferEncoding = Response.__defaultTransferEncoding;

/* Response.prototype.status
 *
 * The HTTP status for this response
 */
Response.prototype.status = 200;

// we set these to null so we can know if they were explicitly set.
// if they weren't we'll try and fill them in ourselves

/* Response.prototype.mimeType
 *
 * Used to fill in the Content-Type header if it isn't set.  If this is
 * `null`, `Response.__defaultMimeType` is used.
 */
Response.prototype.mimeType = null;
/* Response.prototype.charset
 *
 * Used to fill in the Content-Type header if it isn't set.  If this is
 * `null`, `utils.charsets.lookup()` is called with
 * `Response.prototype.mimeType` and that return value is used.  
 */
Response.prototype.charset = null;

/* variables for keeping track of internal state */

/* Response.prototype._sentHeaders
 *
 * Used internally to know if the headers have already been sent.
 */
Response.prototype._sentHeaders = false;
/* Response.prototype._finished
 *
 * Used internally to know if the response has been finished.
 */
Response.prototype._finished = false;

/* Response.prototype.finish()
 *
 * Finish this request, closing the connection with the client.
 * A wrapper around `http.ServerResponse.finish`
 *
 * Sends the headers if they haven't already been sent.
 *
 * Throws:
 *
 * Throws an error if the response has already been finished.
 */
Response.prototype.finish = function() {
  if( !this._sentHeaders ) {
    this.sendHeaders();
  }

  if( this._finished ) {
    //TODO throw custom error here
    throw "Response has already finished";
  }

  this._finished = true;
  this._response.finish();
};

/* Response.prototype.setHeader(key, value)
 *
 * A way to set the header of an object.  Will throw an error if the
 * headers have already been sent.
 *
 * You can also just access the headers object directly.  The 
 * following are practicially equivalent:
 *
 * response.setHeader('Content-Type', 'text');
 * response.headers['Content-Type'] = 'text';
 *
 * The only difference is that the former checks that the headers
 * haven't already been sent, and throws an error if they have.
 *
 * Parameters:
 *
 * + `key`: `String`.  The name of the header to set.
 * + `value`: `String`.  The value for the header.
 *
 * Throws:
 *
 * Throws an error if the headers have already been sent.
 */
Response.prototype.setHeader = function(key, value) {
  if( this._sentHeaders ) {
    //TODO throw custom error here
    throw "Headers already sent";
  }
  this.headers[key] = value;
};

/* Response.prototype.sendHeaders()
 *
 * Wrapper around http.ServerRespose.sendHeader
 *
 * Throws an error if the headers have already been sent. Also sets the
 * Content-Type header if it isn't set.  It uses
 * `Response.prototype.mimeType` and `Response.prototype.charset` to set the
 * Content-Type header.
 */
Response.prototype.sendHeaders = function() {
  if( this._sentHeaders ) {
    throw "Headers have already been sent!";
  }

  this._sentHeaders = true;

  // Check to see if the Content-Type was explicitly set.  If not use
  // this.mimeType and this.charset (if applicable).  And if that isn't set
  // use the default.
  if( !('Content-Type' in this.headers) ) {
    this.mimeType = this.mimeType || Response.__defaultMimeType;
    this.charset = this.charset || utils.charsets.lookup(this.mimeType);
    this.headers['Content-Type'] = this.mimeType + (this.charset ? '; charset=' + this.charset : '');
  }

  // this is a complete hack that we'll be able to remove soon. It makes it so
  // we can send headers multiple times. Node doesn't have an easy way to 
  // do this currently, but people are working on it.
  // How this works is it checks to see if the value for a header is an Array 
  // and if it is, use the hack from this thread:
  // http://groups.google.com/group/nodejs/browse_thread/thread/76ccd1714bbf54f6/56c1696da9a52061?lnk=gst&q=multiple+headers#56c1696da9a52061
  // to get it to work.
  for( var key in this.headers ) {
    if( this.headers[key].constructor == Array ) {
      var count = 1;
      this.headers[key].forEach(function(header) {
          while(this.headers[key+count]) {
            count++;
          }
          this.headers[key+count] = [key, header];
          count++;
        },this);
      delete this.headers[key];
    }
  }

  this._response.sendHeader(this.status, this.headers);
};

/* Response.prototype.send(str)
 *
 * Very similar to `http.ServerResponse.sendBody` except it handles sending the
 * headers if they haven't already been sent. 
 *
 * Will also call `Response.prototype.finish()` if
 * `Response.prototype.finishOnSend` is set.
 *
 * Parameters:
 *
 * + `str`: `String`. The string to be sent to the client.
 */
Response.prototype.send = function(str) {
  if( this._finished ) {
    //TODO throw custom error here
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

/* Response.prototype.sendFile(filename)
 *
 * Acts like `Response.prototype.send()` except it sends the contents of the 
 * file specified by `filename`.
 *
 * Makes sending files really easy.  Give it a filename, and it 
 * will read the file in chunks (if it is a big file) and 
 * send them each back to the client.
 *
 * Uses `Response.__bytesToRead` to read the file in.
 *
 * Parameters:
 *
 * + `filename`: `String`. The name of the file to load and send as part of the request.
 *
 * Returns:
 *
 * A Promise which will emitSuccess if everything goes well, or emitError if
 * there is a problem.
 *
 * Throws:
 *
 * Potentially throws the same things as `Response.prototype.send()`.  The
 * returned Promise will also emit the same errors as `posix.open` and
 * `posix.read`.
 */
Response.prototype.sendFile = function(filename) {
  // to be able to notify scripts when this is done sending
  var p = new process.Promise();

  // if we haven't sent the headers and a mimeType hasn't been specified
  // for this response, then look one up for this file
  if( !this._sentHeaders && this.mimeType === null ) {
    this.mimeType = utils.mime.lookup(filename);
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
