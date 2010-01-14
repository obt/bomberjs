var sys = require('sys');

var utils = require('./utils');

exports.HTTPResponse = function() {};
exports.HTTPResponse.prototype.respond = function(response) {
  var status = this.name.substr(4,3);
  sys.puts(status + ' response');

  response.status = status;
  response.contentType = 'text/plain';
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
['301MovedPermanently', '302Found', '303SeeOther', '307TemporaryRedirect'].forEach(function(name) {
    http_responses[name] = function(url) {this.url = url;};
    http_responses[name].prototype.respond = function(response) {
      var status = this.name.substr(4,3);
      sys.puts(status + ' response. Location: '+this.url);
      response.status = status;
      response.headers['Location'] = this.url;
      response.finish();
    };
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
http_responses['418ImAteapot'] = null;

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
