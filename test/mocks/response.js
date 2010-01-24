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
  this.finished = false;
};
MockResponse.prototype.sendHeader = function(status, headers) {
  if( this.finished ) {
    throw "Already finished";
  }
  this.status = status;
  this.headers = headers;
};
MockResponse.prototype.sendBody = function(chunk, encoding) {
  if( this.finished ) {
    throw "Already finished";
  }
  this.body.push([chunk, encoding]);
  this.bodyText += chunk;
};
MockResponse.prototype.finish = function() {
  if( this.finished ) {
    throw "Already finished";
  }
  this.finished = true;
};

exports.MockResponse = MockResponse;
