// We'll be using HMAC-SHA1 to sign cookies
var sha1 = require('./sha1');


/* Cookie(request, response)
 *
 * Cookie handler for Bomber, designed to work as sub-objected within both Reponse and Request.
 *
 * The is heavily inspired by the work done on cookie-node (see http://github.com/jed/cookie-node/).
 *
 * Parameters:
 *
 * + `request`: A `Request` instance.
 * + `response`: A `Response` instance.
 */
var Cookie = exports.Cookie = function(request, response) {
  // The context for the cookie object
  this._request = request;
  this._response = response;

  // An object used by Cookie._prepare() to store the parsed value
  // of the cookie header.
  this.__cookies = null;
  // An object used by Cookie.set() to store cookies to be 
  // written in the return headers.
  this.__output_cookies = [];
};

/* Cookie.prototype._prepare()
 *
 * Read the cookie header and prepare the internal 
 * __cookies object for reading.
 *
 */
Cookie.prototype._prepare = function() {
  // Use Node's built-in querystring module to parse the cookie
  this.__cookies = require("querystring").parse(this._request.headers["cookie"] || "", sep=";", eq="=");
}

/* Cookie.prototype._getSecret()
 *
 * Get the secret for signing cookies.
 *
 */
Cookie.prototype._getSecret = function() {
  // TODO: Generate, save, config, stuff
  return( this._secret = this._secret || sha1.hex_hmac_sha1(Math.random(), Math.random()) );
}



/* Cookie.prototype.get(name, default_value)
 *
 * Returns the value of a specific cookie, optionally falls 
 * back on another default value or an empty string.
 *
 * When this function is called for the first time during
 * the request, we'll also parse the cookie header.
 *
 * Parameters:
 *
 * + `name`: `String`. The name of the cookie to be returned
 * + `default_value`: `Object`. A fall-back value to return if cookie doesn't exist
 *
 * Returns:
 *
 * The value of the requested cookie
 */
Cookie.prototype.get = function(name, default_value) {
  if( this.__cookies=== null ) this._prepare();
  return this.__cookies[name] || default_value || "";
}

/* Cookie.prototype.set = function(name, value, options)
 *
 * Set a cookie to be written in the output headers.
 *
 * Parameters:
 *
 * + `name`: `String`. The name of the cookie to update.
 * + `value`: `String`. The new value of the cookie.
 * + `options`: `Object`. A key-value object specifying optional extra-options.
 *  
 * Valid `options` properties are:
 *
 * + `expires`: `Date`. Cookie expiry date.
 * + `path`: `String`. The path where the cookie is valid.
 * + `domain`: `String`. Domain where the cookie is valid.
 * + `secure`: `Boolean`. Secure cookie?
 * 
 */
Cookie.prototype.set = function(name, value, options) {
  // TODO: name/value & =/;?
  var cookie = [ name, "=", value, ";" ];
        
  options = options || {};

  if ( options.expires )
    cookie.push( " expires=", options.expires.toUTCString(), ";" );

  if ( options.path )
    cookie.push( " path=", options.path, ";" );
  
  if ( options.domain )
    cookie.push( " domain=", options.domain, ";" );
 
  if ( options.secure )
    cookie.push( " secure" );

  // Update local version of cookies
  if( this.__cookies=== null ) this._prepare();
  this.__cookies[name] = value;

  // Append the new cookie to headers
  this.__output_cookies.push( cookie.join("") );
  this._response.headers["Set-Cookie"] = this.__output_cookies.join(", ");
}

/* Cookie.prototype.unset = function(name)
 *
 * Unset a cookie by setting the value to an empty string ("")
 *
 * Parameters:
 *
 * + `name`: `String`. The name of the cookie to unset.
 *
 */
Cookie.prototype.unset = function(name) {
  // Write an empty cookie back to client, set to expired
  this.set(name, '', {expires:new Date('1970-01-01')});
  // And remove the local version of the cookie entirely
  delete this.__cookies[name]
}


/* Cookie.prototype.setSecure = function(name, value, options)
 *
 * Set a new cookie, signed by a local secret key to make sure it isn't tampered with
 *
 * The signing method deviates slightly from http://github.com/jed/cookie-node/ in that 
 * the name of the cookie is used in the signature.
 *
 * Parameters:
 *
 * + `name`: `String`. The name of the secure cookie
 * + `value`: `String`. The value of the secure cookie.
 * + `options`: `String`. A set of options, see Cookie.set() for details
 *
 */
Cookie.prototype.setSecure = function(name, value, options) {
  options = options || {};
  // TODO: Base64?
  var value = [ name, value, (+options.expires || "") ];
  var signature = sha1.hex_hmac_sha1( value.join("|"), this._getSecret() );
  value.push( signature );
  this.set( name, value.join("|"), options );
}

/* Cookie.prototype.getSecure = function(name)
 *
 * Get the value for a signed cookie.
 *
 * Parameters:
 *
 * + `name`: `String`. The name of the secure cookie
 *
 * Returns:
 *
 * The value of the requested cookie if the signature is correct and the signature 
 * hasn't expired. Otherwise `null` is returned.
 */
Cookie.prototype.getSecure = function(name) {
  var parts = this.get(name).split("|");

  if ( parts.length !== 4 ) {
    return null;
  }
  if ( parts[0] !== name ) {
    return null;
  }

  var value = parts[1];
  var expires = parts[2];
  var cookie_signature = parts[3];
  
  if ( expires && expires < new Date() ) {
    // The secure cookie has expired, clear it.
    this.unset(name);
    return null;
  }
  
  var valid_signature = sha1.hex_hmac_sha1( parts.slice(0,3).join("|"), this._getSecret() );
  if ( cookie_signature !== valid_signature) {
    return null;
  }

  return value;
}
  
  
