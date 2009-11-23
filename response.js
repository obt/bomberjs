var sys = require('sys');

var Response = function(res) {
  this.res = res;
  this.headers = {'Content-Type': 'text/plain'};
};

// defaults
Response.prototype.finishOnSend = true;
Response.prototype.status = 200;

Response.prototype.sentHeaders = false;
Response.prototype.finished = false;

// methods
Response.prototype.setHeader = function(key, value) {
  this.headers[key] = value;
};

Response.prototype.sendHeaders = function() {
  if( this.sentHeaders ) {
    throw "Headers have already been sent!";
  }

  this.sentHeaders = true;
  this.res.sendHeader(this.status, this.headers);
};
Response.prototype.send = function(str) {
  if( this.finished ) {
    throw "Response has already finished";
  }

  if( !this.sentHeaders ) {
    this.sendHeaders();
  }

  this.res.sendBody(str);

  if(this.finishOnSend) {
    this.finish();
  }
};
Response.prototype.finish = function() {
  if( this.finished ) {
    throw "Response has already finished";
  }

  this.finished = true;
  this.res.finish();
}


exports.Response = Response;
