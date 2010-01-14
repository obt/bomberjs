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

var MockRequest = function(method, url) {
  this.method = method;
  this.url = url;
  this.headers = null;
  this.body = [];
  this.finished = false;
  this.httpVersion = "1.1";
};
//TODO add mock listeners for 'body' and 'complete' events

exports.MockRequest = MockRequest;
