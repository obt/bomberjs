var path = require('path');

exports.createCustomError = function(err_name) {
  var custom_err = function (message, stripPoint) {
      this.message = message;
      Error.captureStackTrace(this, stripPoint);
      // TODO think about removing the first entry in the stack trace
      // which points to this line.
    }

  custom_err.prototype = {
    __proto__: Error.prototype,
    name: err_name,
    stack: {}
  };

  return custom_err;
};

// I'm going to submit a variation of this function as a patch to Node,
// but the require code is in a bit of a state of flux right now.
// What this function does is tell you the location of a module that has
// been required. It is pretty dump at this point.  I am sure there are
// some edge cases I haven't caught.
exports.require_resolve = function require_resolve(module_name, appendSuffix) {
  var fs = process.fs;

  if( module_name.charAt(0) == '/' ) {
    return module_name;
  }

  if( typeof appendSuffix === 'undefined' ) {
    appendSuffix = true;
  }

  suffixes = ['.js','.node','/index.js', 'index.node'];
  for( var i=0; i < require.paths.length; i++ ) {
    var p = require.paths[i];
    
    var stat = null;
    if( appendSuffix ) {
      for( var j=0; j < suffixes.length; j++ ) {
        try {
          stat = fs.stat(path.join(p,module_name+suffixes[j]));
          break;
        }
        catch(err) {
          if( err.message != "No such file or directory" ) {
            throw err;
          }
        }
      };
    }
    else {
      try {
        stat = fs.stat(path.join(p,module_name));
      }
      catch(err) {
        if( err.message != "No such file or directory" ) {
          throw err;
        }
      }
    }

    if( stat !== null ) {
      return path.join(p,module_name);
    }
  };
};
