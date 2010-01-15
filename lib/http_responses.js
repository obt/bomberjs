var sys = require('sys');

var utils = require('./utils');

exports.HTTPResponse = function(body) {
  this.body = body;
  this.status = null;
  this.contentType = 'text/html';
  this.encoding = 'utf8';
};
exports.HTTPResponse.prototype.respond = function(response) {
  if( this.status === null ) {
    this.status = this.name.substr(4,3);
  }
  response.status = this.status;
  response.contentType = this.contentType;
  response.encoding = this.encoding;
  response.send(this.body || this.name || '');
};

var http_responses = {};

http_responses['200OK'] = null;
http_responses['201Created'] = null;
http_responses['202Accepted'] = null;
http_responses['203NonAuthoritativeInformation'] = null;
http_responses['204NoContent'] = null;
http_responses['205ResetContent'] = null;
http_responses['206PartialContent'] = null;

http_responses['300MultipleChoices'] = null;
http_responses['304NotModified'] = null;

http_responses['__redirect'] = function(url, status) {
  this.url = url;
  if( typeof status == 'undefined' ) {
    this.status = 301;
  }
  else {
    this.status = status;
  }
};
http_responses['__redirect'].prototype.respond = function(response) {
  sys.puts(this.status + ' response. Location: '+this.url);
  response.status = this.status;
  response.headers['Location'] = this.url;
  response.finish();
};
['301MovedPermanently', '302Found', '303SeeOther', '307TemporaryRedirect'].forEach(function(name) {
    http_responses[name] = function(url) {
      this.url = url;
      this.status = name.substr(0,3);
    };
    http_responses[name].prototype.respond = http_responses.__redirect.prototype.respond;
  });

http_responses['400BadRequest'] = null;
http_responses['401Unauthorized'] = null;
http_responses['402PaymentRequired'] = null;
http_responses['403Forbidden'] = null;
http_responses['404NotFound'] = null;
http_responses['405MethodNotAllowed'] = null;
http_responses['406NotAcceptable'] = null;
http_responses['407ProxyAuthenticationRequired'] = null;
http_responses['408RequestTimeout'] = null;
http_responses['409Conflict'] = null;
http_responses['410Gone'] = null;
http_responses['411LengthRequired'] = null;
http_responses['412PreconditionFailed'] = null;
http_responses['413RequestEntityTooLarge'] = null;
http_responses['414RequestURITooLong'] = null;
http_responses['415UnsupportedMediaType'] = null;
http_responses['416RequestedRangeNotSatisfiable'] = null;
http_responses['417ExpectationFailed'] = null;
http_responses['418ImATeapot'] = null;

http_responses['500InternalServerError'] = null;
http_responses['501NotImplemented'] = null;
http_responses['502BadGateway'] = null;
http_responses['503ServiceUnavailable'] = null;
http_responses['504GatewayTimeout'] = null;
http_responses['509BandwidthLimitExceeded'] = null;

for( var err_name in http_responses ) {
  if( http_responses[err_name] ) {
    var func = http_responses[err_name];
    func.prototype.__proto__ = exports.HTTPResponse.prototype;
    func.prototype.name = 'HTTP'+err_name;
  }
  else {
    var func = utils.createCustomError('HTTP'+err_name);
    func.prototype.__proto__ = exports.HTTPResponse.prototype;
  }
  exports['HTTP'+err_name] = func;
};

exports.forbidden = exports.HTTP403Forbidden;
exports.notFound = exports.HTTP404NotFound;

// we declared this above because we wanted it to properly
// "extend" HTTPResponse.  But the above adds the 'HTTP' prefix
// so, get rid of it.
exports.redirect = exports.HTTP__redirect;
delete exports.HTTP__redirect;
