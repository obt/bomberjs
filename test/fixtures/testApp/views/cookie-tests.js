var sys = require('sys');

exports.set = function(request, response) {
  for(var key in request.params) {
    request.cookies.set(key, request.params[key]);
  }

  var read = [];
  for( var key in request.params ) {
    read.push(request.cookies.get(key));
  }

  return read.join(',');
};

exports.read = function(request, response) {
  var read = [];
  var def = request.params['_default'];
  for(var key in request.params) {
    if( key == '_default' ) {
      continue;
    }
    var val = request.cookies.get(key,def);
    if( val === null ) {
      continue;
    }
    read.push(val);
  }

  return read.join(',');
}

exports.setSecure = function(request, response) {
  var count = 0;
  for(var key in request.params) {
    request.cookies.setSecure(key, request.params[key]);
    count++;
  }

  return ''+count;
};

exports.readSecure = function(request, response) {
  var read = [];
  var def = request.params['_default'];
  for(var key in request.params) {
    if( key == '_default' ) {
      continue;
    }
    read.push(request.cookies.getSecure(key,def));
  }

  return read.join(',');
}

exports.unset = function(request, response) {
  for(var key in request.params) {
    request.cookies.unset(key);
  }

  var read = [];
  for( var key in request.params ) {
    read.push(request.cookies.get(key));
  }

  return read.join(',');
};

exports.reset = function(request, response) {
  request.cookies.reset();
  return '';
};

exports.keys = function(request, response) {
  return request.cookies.keys().join(',');
};

exports.exists = function(request, response) {
  var existence = [];
  for(var key in request.params) {
    if(request.cookies.get(key)) {
      existence.push(1);
    }
    else {
      existence.push(0);
    }
  }

  return existence.join(',');
};
