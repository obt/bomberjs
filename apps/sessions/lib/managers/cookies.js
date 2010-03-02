var Cookies = require('bomberjs/apps/http/apps/cookies/lib/cookies').Cookies;

var Session = require('../session').Session;

exports.startup = function(project) {
  project.sessionManager = new SessionManager(project);

  project.pipe('request', {after: 'cookies'}, function(rr) {
      rr.response.listen('head', function(head) {
          project.sessionManager.save(head.headers, rr.request.session);
          return head;
        });

      rr.request.session = rr.response.session = project.sessionManager.load(rr.request);

      return rr;
    });
}

var SessionManager = function(project) {
  this.options = project.config.sessions;
  this.secret = project.config.security.signing_secret;
};

SessionManager.prototype.load = function(request) {  
  var data = JSON.parse(request.cookies.getSecure(this.options.cookie.name,'null'));
  var session = new Session(data, this.options);

  return session;
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
