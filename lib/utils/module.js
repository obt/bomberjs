var path = require('path')
  , fs = require('fs')
  ;

exports.resolveLocation = function(moduleName) {
  if( moduleName.charAt(0) == '/' ) {
    return moduleName;
  }

  var suffixes = ['.js','.node','/index.js', '/index.node'];

  for( var i=0; i < require.paths.length; i++ ) {
    var p = require.paths[i];
    
    var stat = null;
    for( var j=0; j < suffixes.length; j++ ) {
      try {
        stat = fs.statSync(path.join(p,moduleName+suffixes[j]));
        break;
      }
      catch(err) {
        if (err.errno != 2) {
          throw err;
        }
      }
    }

    if( stat !== null ) {
      return path.join(p,moduleName);
    }
  }
}
