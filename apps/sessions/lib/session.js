var sys = require('sys');
var Session = exports.Session = function(data, options) {
  this._modified = false;
  this._frozen = false;

  this._data = data || {};
};

Session.prototype.set = function(name, value) {
  if( this._frozen ) {
    throw "Cannot modify session.  It has already been written for this request.";
  }
  this._data[name] = value;
  this._modified = true;
};

Session.prototype.get = function(name, default_value) {
  return( this._data[name] || default_value || null );
};

Session.prototype.unset = function(name) {
  delete this._data[name];
};

Session.prototype.reset = function() {
  // Blank slate of data
  this._data = {};
  this._modified = true;
};

Session.prototype.exists = function(name) {
  return name in this._data;
};

Session.prototype.keys = function() {
  var keys = [];
  for ( key in this._data ) {
    if ( key.substr(0,2) !== "__" ) {
      keys.push(key);
    }
  }
  return keys;
};

Session.prototype.freeze = function() {
  this._frozen = true;
}
