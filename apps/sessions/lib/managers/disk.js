var sha1 = require('bomberjs/bundled/sha1'),
    Cookies = require('bomberjs/lib/cookies').Cookies;

var Session = require('../session').Session,
    DirectoryStore = require("../store").DirectoryStore;

exports.start = function(project, callback) {
  project.sessionManager = new SessionManager(project);

  project.server.listen('request', function(request, response, next) {
      response.listen('head', function(head, headNext) {
          project.sessionManager.writeCookie(head.headers, request.session);
          headNext(head);
        });

      response.listen('finished', function(finishedNext) {
          project.sessionManager.writeFile(request.session);
          finishedNext();
        });

      project.sessionManager.load(request, function(session) {
          request.session = response.session = session;
          next(request, response);
        });
    });

  callback();
}

var SessionManager = exports.SessionManager = function(project) {
  this.options = project.config.sessions;
  this.secret = project.config.security.signing_secret;

  this.sessions = {};
  this.store = new DirectoryStore(this.options.disk_storage_location);
};

SessionManager.prototype._MAX_SESSION_KEY = Math.pow(2,63);

SessionManager.prototype.load = function(request, callback) {  
  var session_key = request.cookies.getSecure( this.options.cookie.name );
  if ( !session_key ) {
    session_key = this._generateNewSessionKey();
    var new_session_cookie = true;
  }
  else {
    var new_session_cookie = false;
  }

  var data = null;
  if ( !this.sessions[session_key] )  {
    // If the session object doesn't exist in memory, we'll try loading it from disk
    // and then if we still can't find it, create a new one
    try {
      // Note that we wait() for the data to return, since we need session immediately available
      data = this.store.get('bomber-sessions', session_key).wait();
    }
    catch(e) {
      if( e.message != "No such file or directory" ) {
        throw e;
      }
    }
  }
  else {
    data = this.sessions[session_key];
  }

  if ( data && (!('__expires' in data) || data['__expires']<(+new Date())) ) {
    // Session has expired; don't trust the data
    data = null;
  }

  var s = new Session(data, this.options);
  s._key = session_key;
  s._data.__expires = +(new Date()) + this.options.expire_minutes*60000;

  callback(s);
};

SessionManager.prototype.writeCookie = function(headers, session) {
    // let's reset renew now so it is a far as possible from now
  if( session._modified || !session._data.__r || session._data.__r < +(new Date()) ) {
    session._data.__r = +(new Date()) + this.options.renew_minutes*60000;

    var name = this.options.cookie.name;
    var options = {
          expires: new Date((+new Date( +new Date + (this.options.expire_minutes*60*1000) ))),
          domain: this.options.cookie.domain,
          path: this.options.cookie.path,
          secure: this.options.cookie.secure
        };
    var value = Cookies.makeSignedValue(name, session._key, options, this.secret);

    if( !('Set-Cookie' in headers) ) {
      headers['Set-Cookie'] = [];
    }
    headers['Set-Cookie'].push(Cookies.toString(name, value, options));
  }
};

SessionManager.prototype.writeFile = function(session) {
  if( session._modified ) {
    session.freeze();
    this.store.set('bomber-sessions', session._key, session._data);
    this.sessions[session._key] = session._data;
  }
};

SessionManager.prototype._generateNewSessionKey = function() {
  do {
    // Generate a strategically random string
    var rnd = [Math.random()*this._MAX_SESSION_KEY, +new Date, process.pid].join('|');
    // And create a hash from it to use for a session key
    var session_key = sha1.hex_hmac_sha1( rnd, rnd );
  } while( this.sessions[session_key] );

  return( session_key );
}
