var sys = require('sys');

//var utils = require('./utils');

exports.defaultMimeType = 'text/html';
exports.defaultTransferEncoding = 'utf8';

exports.wrap = function(res) {
  return {
    _res: res
  // options
  , transferEncoding: exports.defaultTransferEncoding
  // response data
  , status: 200
  , headers: {}
  , mimeType: null
  , charset: null
  // state
  , sentHead: false
  , finished: false
  // utility functions
  , finish: response_finish
  , sendHead: response_sendHead
  , send: response_send
  }
};

function response_finish() {
  if( !this.sentHead ) {
    this.sendHead();
  }

  if( this.finished ) {
    throw new Error("Response has already finished");
  }

  this.finished = true;
  this._res.end();
};

function response_sendHead() {
  if( this.sentHead ) {
    throw new Error("Headers have already been sent!");
  }

  this.sentHead = true;

  // Check to see if the Content-Type was explicitly set.  If not use
  // this.mimeType and this.charset (if applicable).  And if that isn't set
  // use the default.
  if (!this.headers['Content-Type']) {
    this.mimeType = this.mimeType || exports.defaultMimeType;
    // TODO use node-mime library
    //this.charset = this.charset || utils.charsets.lookup(this.mimeType);
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

  this._res.writeHead(this.status, this.headers);
};

function response_send(str) {
  if( this.finished ) {
    throw new Error("Response has already finished");
  }

  if( !this.sentHead ) {
    this.sendHead();
  }

  this._res.write(str, this.transferEncoding);
};
