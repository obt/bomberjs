var fs = require('fs')
  , path = require('path')
  ;

module.exports = function(dir) {
  return function(action, callback) {
    var file = path.join(dir, action.file);
    console.log('loading ' + file);
    
    if (file.charAt(0) !== '.' || file.charAt(0) !== '/') {
      fs.readFile(file, callback);
    }
  }
}
