var Cookies = require('bomberjs/lib/cookies').Cookies;

var Session = require('../session').Session;

exports.start = function(project, callback) {
  project.sessionManager = new SessionManager(project);

  project.server.listen('request', function(request, response, next) {
      response.listen('head', function(head, headNext) {
          project.sessionManager.save(head.headers, request.session);
          headNext(head);
        });

      project.sessionManager.load(request, function(session) {
          request.session = response.session = session;
          next(request, response);
        });
    });

  callback();
}

var SessionManager = function(project) {
  this.options = project.config.sessions;
  this.secret = project.config.security.signing_secret;
};

SessionManager.prototype.load = function(request, next) {  
  var data = JSON.parse(request.cookies.getSecure(this.options.cookie.name,'null'));
  var session = new Session(data, this.options);

  next(session);
};

SessionManager.prototype.save = function(headers, session) {
  if( session._modified || !session._data.__r || session._data.__r < +(new Date()) ) {
    session._data.__r = +(new Date()) + this.options.renew_minutes*60000;

    // no more edits
    session.freeze();

    var name = this.options.cookie.name;
    var options = {
          expires: new Date((+new Date( +new Date + (this.options.expire_minutes*60*1000) ))),
          domain: this.options.cookie.domain,
          path: this.options.cookie.path,
          secure: this.options.cookie.secure
        };
    var value = Cookies.makeSignedValue(name, JSON.stringify(session._data), options, this.secret);

    if( !('Set-Cookie' in headers) ) {
      headers['Set-Cookie'] = [];
    }
    headers['Set-Cookie'].push(Cookies.toString(name, value, options));
  }
};
