exports.QuickResponse = function(body) {
  this.body = body;
  this.status = null;
  this.mimeType = 'text/html';
};
exports.QuickResponse.prototype.respond = function(response) {
  if( this.status === null ) {
    this.status = this.name.substr(4,3);
  }
  response.status = this.status;
  response.mimeType = this.mimeType;
  response.send(this.body || this.name || '');
  if( !response.finishOnSend ) {
    response.finish();
  }
};

var responses = {};

responses['200OK'] = null;
responses['201Created'] = null;
responses['202Accepted'] = null;
responses['203NonAuthoritativeInformation'] = null;
responses['204NoContent'] = null;
responses['205ResetContent'] = null;
responses['206PartialContent'] = null;

responses['300MultipleChoices'] = null;
responses['304NotModified'] = null;

responses['__redirect'] = function(url, status) {
  this.url = url;
  if( typeof status == 'undefined' ) {
    this.status = 301;
  }
  else {
    this.status = status;
  }
};
responses['__redirect'].prototype.respond = function(response) {
  response.status = this.status;
  response.headers['Location'] = this.url;
  response.finish();
};
['301MovedPermanently', '302Found', '303SeeOther', '307TemporaryRedirect'].forEach(function(name) {
    responses[name] = function(url) {
      this.url = url;
      this.status = name.substr(0,3);
    };
    responses[name].prototype.respond = responses.__redirect.prototype.respond;
  });

responses['400BadRequest'] = null;
responses['401Unauthorized'] = null;
responses['402PaymentRequired'] = null;
responses['403Forbidden'] = null;
responses['404NotFound'] = null;
responses['405MethodNotAllowed'] = null;
responses['406NotAcceptable'] = null;
responses['407ProxyAuthenticationRequired'] = null;
responses['408RequestTimeout'] = null;
responses['409Conflict'] = null;
responses['410Gone'] = null;
responses['411LengthRequired'] = null;
responses['412PreconditionFailed'] = null;
responses['413RequestEntityTooLarge'] = null;
responses['414RequestURITooLong'] = null;
responses['415UnsupportedMediaType'] = null;
responses['416RequestedRangeNotSatisfiable'] = null;
responses['417ExpectationFailed'] = null;
responses['418ImATeapot'] = null;

responses['500InternalServerError'] = null;
responses['501NotImplemented'] = null;
responses['502BadGateway'] = null;
responses['503ServiceUnavailable'] = null;
responses['504GatewayTimeout'] = null;
responses['509BandwidthLimitExceeded'] = null;

for( var err_name in responses ) {
  if( responses[err_name] ) {
    var func = responses[err_name];
  }
  else {
    var func = function() {
      exports.QuickResponse.apply(this, arguments);
    };
  }
  func.prototype.__proto__ = exports.QuickResponse.prototype;
  func.prototype.name = 'HTTP'+err_name;
  exports['HTTP'+err_name] = func;
};

exports.forbidden = exports.HTTP403Forbidden;
exports.notFound = exports.HTTP404NotFound;

// we declared this above because we wanted it to properly
// "extend" QuickResponse.  But the above adds the 'HTTP' prefix
// so, get rid of it.
exports.redirect = exports.HTTP__redirect;
delete exports.HTTP__redirect;
