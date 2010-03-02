/* Mock Node http.serverResponse
 *
 * Responds to all the methods that http.serverResponse does, and basically just
 * stores everything it is told.
 *
 * The idea being that you can then make assertions about what it has been told
 * to make sure your code is working properly.
 */

var MockResponse = function() {
  this.status = null;
  this.headers = null;
  this.body = [];
  this.bodyText = '';
  this.closed = false;
};
MockResponse.prototype.sendHeader = function(status, headers) {
  if( this.closed ) {
    throw "Already closed";
  }
  this.status = status;
  this.headers = headers;
};
MockResponse.prototype.write = function(chunk, encoding) {
  if( this.closed ) {
    throw "Already closed";
  }
  this.body.push([chunk, encoding]);
  this.bodyText += chunk;
};
MockResponse.prototype.close = function() {
  if( this.closed ) {
    throw "Already closed";
  }
  this.closed = true;
};

exports.MockResponse = MockResponse;
