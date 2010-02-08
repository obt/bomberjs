var sha1 = require('../dependencies/sha1');

var DirectoryStore = require("./store").DirectoryStore;

/* SessionManager(server)
 *
 * An in-memory object for storing session data. 
 * 
 * This should be initialized when the server starts up, and will
 * maintain the creation, renewal and expiration of sessions.
 *
 * Parameters:
 *
 * + `server`: A `Server` instance.
 */
var SessionManager = exports.SessionManager = function(options) {
  this.options = options;
  this._sessions = {};
  if ( this.options.storage_method === 'disk' ) {
    this.store = new DirectoryStore(this.options.disk_storage_location);
  }
};


SessionManager.prototype._MAX_SESSION_KEY = Math.pow(2,63);

/* SessionManager.prototype.getSession = function(request)
 *
 * Get a session for the current request. 
 *
 * Tries to return `Session` object from memory, otherwise a new session is created
 * and stored for returning on the next request.
 *
 * Parameters:
 *
 * + `request`: A `Request` instance.
 *
 * Returns:
 *
 * Either an existing or a new Session() object depending on the context.
 */
SessionManager.prototype.getSession = function(request) {  
  // Get the session_key from cookies or generate a new one
  var session_key = request.cookies.getSecure( this.options.cookie.name );
  if ( !session_key ) {
    session_key = this._generateNewSessionKey();
    var new_session_cookie = true;
  } else {
    var new_session_cookie = false;
  }

  // If the session object doesn't exist in memory, we'll create one.
  // This will magically be loaded from persistent storage is the session_key
  // identifies an ongoing session.
  if ( !this._sessions[session_key] )  {
    this._sessions[session_key] = new Session(session_key, this, request);
  }

  // Write the session key to a cookie
  if ( new_session_cookie ) {
    this._sessions[session_key].renewSession();
  }

  return( this._sessions[session_key] );
}

/* SessionManager.prototype._generateNewSessionKey = function()
 *
 * Create a new session_key. Basically as hash of a very random string.
 */
SessionManager.prototype._generateNewSessionKey = function() {
  do {
    // Generate a strategically random string
    var rnd = [Math.random()*this._MAX_SESSION_KEY, +new Date, process.pid].join('|');
    // And create a hash from it to use for a session key
    var session_key = sha1.hex_hmac_sha1( rnd, rnd );
  } while( this._sessions[session_key] );

  return( session_key );
}





/* Session(session_key, manager, request)
 *
 * Interact with session variables.
 *
 * Parameters:
 *
 * + `session_key`: The key for this session
 * + `manager`: A `SessionManager` instance.
 * + `request`: A `Request` instance.
 */
var Session = exports.Session = function(session_key, manager, request) {
  // Remember arguments
  this.session_key = session_key;
  this._manager = manager;
  this._request = request;
  // Some state variables
  this._modified = false;

  // Try loading session data
  if ( this._manager.options.storage_method === 'disk' ) {
    // ... from disk
    try {
      // Note that we wait()ing for the data to return, since we need session immediately available
      this._data = this._manager.store.get('bomber-sessions', this.session_key).wait();
    } catch(e){}
  } else if ( this._manager.options.storage_method === 'cookie' ) {
    // ... from cookie
    this._data = JSON.parse(this._request.cookies.getSecure(this._manager.options.cookie.name + '__data'));
  }

  if ( this._data && (!('__expires' in this._data) || this._data['__expires']<(+new Date())) ) {
    // Session has expired; don't trust the data
    delete this._data;
  }

  if ( !('_data' in this) || !this._data ) {
    // If the data doesn't exist, we'll start with an empty slate
    this.reset();
  } else if ( ('__renew' in this._data) && (+new Date()) > this._data['__renew'] ) {
    // More than renew minutes since we last wrote the session to cookie
    this.renewSession();
  }
};

/* Session.prototype.set = function(name, value)
 *
 * Set a session variable
 *
 * Parameters:
 *
 * + `name`: The name of the session variable to set.
 * + `value`: The value of the session variable
 */
Session.prototype.set = function(name, value) {
  this._data[name] = value;
  this.save();
}

/* Session.prototype.get = function(name)
 *
 * Get the value of a session variable
 *
 * Parameters:
 *
 * + `name`: The name of the session variable to retreieve.
 * + `default_value`: A fallback value of the variable doesn't exist.
 *
 * Returns:
 *
 * The value of the session variable
 */
Session.prototype.get = function(name, default_value) {
  return( this._data[name] || default_value || null );
}

/* Session.prototype.unset = function(name)
 *
 * Clear or delete an existing session vairable.
 *
 * Parameters:
 *
 * + `name`: The name of the session variable to clear.
 */
Session.prototype.unset = function(name) {
  delete this._data[name];
  this.save();
}

/* Session.prototype.reset = function(name)
 *
 * Reset the session by clearing all data
 * The session_key stays the same even after the session has been reset.
 *
 */
Session.prototype.reset = function() {
  // Blank slate of data
  this._data = {__created: (+new Date)}
  // And renew the session cookie: New timeout and new save to storage
  this.renewSession();
}

/* Session.prototype.exists = function(name)
 *
 * Check if a certain session variable has been set or not.
 * 
 * Returns:
 *
 * True if the variable has been set. False otherwise.
 */
Session.prototype.exists = function(name) {
  return ( name in this._data );
}

/* Session.prototype.keys = function(name)
 *
 * Retrieve a list of all set sessions var.
 *
 * Returns:
 *
 * An `Array` of sesison variable names.
 */
Session.prototype.keys = function() {
  var keys = [];
  for ( key in this._data ) {
    if ( !(this._data[key] instanceof Function) && key.substr(0,2) !== "__" ) {
      keys.push(key);
    }
  }
  return( keys );
}

/* Session.prototype.save = function()
 *
 * Notify that the session object has changes.
 * For cookies, we'll need to store while the request is still active. In other
 * cases the object will be marked as changed and save in Session.finish().
 */
Session.prototype.save = function() {
  if ( this._manager.options.storage_method === 'cookie' ) {
    this._request.cookies.setSecure( this._manager.options.cookie.name + '__data', JSON.stringify(this._data), this._getCookieOptions() );
  } else {
    // For everything other than cookies, we'll only want one write for the entire request,
    // so we remember that the session was modified and continue;
    this._modified = true;
  }
}

/* Session.prototype.finish = function()
 *
 * Finish off the session by writing data to storage.
 */
Session.prototype.finish = function() {
  if ( this._modified && this._manager.options.storage_method !== 'cookie' ) {
    this._manager.store.set('bomber-sessions', this.session_key, this._data);
  }
}

/* Session.prototype.renewSession = function()
 *
 * Write the session cookie to the current request connection, 
 * including domain/path/secure from project configuration and 
 * expires from the session timeout.
 */
Session.prototype.renewSession = function() {
  // Update expiration and renew
  this._data['__renew'] = (+new Date( +new Date + (this._manager.options.renew_minutes*60*1000) ));
  this._data['__expires'] = (+new Date( +new Date + (this._manager.options.expire_minutes*60*1000) ));

  // Update cookie with session key
  this._request.cookies.setSecure( this._manager.options.cookie.name, this.session_key, this._getCookieOptions() );

  // And save the cleaned-up data
  this.save();
}

Session.prototype._getCookieOptions = function() {
  return({
      expires: new Date(this._data['__expires']),
      domain: this._manager.options.cookie.domain,
      path: this._manager.options.cookie.path,
      secure: this._manager.options.cookie.secure
    });
}

