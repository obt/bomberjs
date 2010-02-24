var querystring = require("querystring");
var sys = require('sys');

// We'll be using HMAC-SHA1 to sign cookies
var sha1 = require('../bundled/sha1');

var Cookies = exports.Cookies = function(request, response, project) {
  // The cookie headers for this request
  this._cookieHeaders = request.headers["cookie"] || "";
  // Will store the parsed value of the cookie headers.  We don't parse
  // them now, but only when someone actually tries to get a value
  this._cookies = null;
  
  // Secret key for signing cookies
  this._secret = project.config.security.signing_secret;

  // An object used by Cookies.set() to store cookies to be 
  // written in the return headers.
  this._output_cookies = {};
};

Cookies.prototype._prepare = function() {
  // Use Node's built-in querystring module to parse the cookie
  this._cookies = querystring.parse(this._cookieHeaders, sep=";", eq="=");
};


Cookies.prototype.get = function(name, default_value) {
  if( this._cookies=== null ) {
    this._prepare();
  }
  if( this._cookies[name] ) {
    return querystring.unescape(this._cookies[name]) ;
  }
  else {
    return default_value || null;
  }
};

Cookies.prototype.keys = function() {
  if( this._cookies=== null ) {
    this._prepare();
  }

  var keys = [];
  for ( var key in this._cookies ) {
      keys.push(key);
  }
  return keys;
}

Cookies.prototype.set = function(name, value, options) {
  if( this._cookies === null ) {
    this._prepare();
  }
  this._cookies[name] = value;

  this._output_cookies[name] = Cookies.toString(name, value, options);
};

Cookies.prototype.writeHeaders = function(headers) {
  // Append the new cookie to headers
  var oc = [];
  for ( var name in this._output_cookies ) {
    oc.push( this._output_cookies[name] );
  }
  headers["Set-Cookie"] = oc;
};

Cookies.toString = function(name, value, options) {
  value = new String(value);
  var cookie = [ name, "=", querystring.escape(value), ";" ];
        
  options = options || {};

  if ( options.expires ) {
    cookie.push( " expires=", options.expires.toUTCString(), ";" );
  }

  if ( options.path ) {
    cookie.push( " path=", options.path, ";" );
  }
  
  if ( options.domain ) {
    cookie.push( " domain=", options.domain, ";" );
  }
 
  if ( options.secure ) {
    cookie.push( " secure" );
  }

  return cookie.join('');
};

Cookies.prototype.unset = function(name) {
  // Write an empty cookie back to client, set to expired
  this.set(name, '', {expires:new Date('1970-01-01')});
  // And remove the local version of the cookie entirely
  delete this._cookies[name]
};

Cookies.prototype.setSecure = function(name, value, options) {
  this.set( name, Cookies.makeSignedValue(name, value, options, this._secret), options );
};

Cookies.makeSignedValue = function(name, value, options, secret) {
  options = options || {};
  value = new String(value);

  // Note: We might want to Base-64 encode/decode the value here and in getSecure,
  // but I couldn't find a good library for the purpose with clear licensing.
  // (The SHA-1 lib does include encoding, but no decoding)

  var value = [ name, value, (+options.expires || "") ];
  var signature = sha1.hex_hmac_sha1( value.join("|"), secret );
  value.push( signature );

  return value.join('|');
};

Cookies.prototype.getSecure = function(name, default_value) {
  var raw = this.get(name);
  if( raw === null ) {
    return default_value || null;
  }

  var parts = raw.split("|");

  if ( parts.length !== 4 ) {
    return default_value || null;
  }
  if ( parts[0] !== name ) {
    return default_value || null;
  }

  var value = parts[1];
  var expires = parts[2];
  var cookie_signature = parts[3];
  
  if ( expires && expires < new Date() ) {
    // The secure cookie has expired, clear it.
    this.unset(name);
    return default_value || null;
  }
  
  var valid_signature = sha1.hex_hmac_sha1( parts.slice(0,3).join("|"), this._secret );
  if ( cookie_signature !== valid_signature) {
    return default_value || null;
  }

  return value;
};

Cookies.prototype.reset = function() {
  this.keys().forEach(function(key) {
      this.unset(key);
    }, this);
};

Cookies.prototype.exists = function(key) {
  if( this._cookies === null ) {
    this._prepare();
  }
  return (this._cookies[key]);
};
