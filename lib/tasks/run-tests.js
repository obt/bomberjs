var sys = require('sys');
var posix = require('posix');
var path = require('path');

var require_resolve = require('bomberjs/lib/utils').require_resolve;

exports.task = function(app) {
  var tests = [];

  var path_to_app = app.module_path;

  if( path_to_app.charAt(0) !== '/' ) {
    path_to_app = require_resolve(path_to_app);
  }

  var paths_to_check = [path.join(path_to_app,'test')];

  while(paths_to_check.length > 0) {
    var cur_path = paths_to_check.pop();
    var dir = posix.readdir(cur_path).wait();
    dir.forEach(function(file_name) {
        var stat = posix.stat(path.join(cur_path, file_name)).wait();
        if( stat.isFile() ) {
          if( !file_name.match(/^test-.*\.js$/) ) {
            return;
          }
          tests.push(path.join(cur_path, file_name));
        }
        else if( stat.isDirectory() ) {
          paths_to_check.push(path.join(cur_path, file_name));
        }
      });
  }

  function runNextTest() {
    if( tests.length < 1 ) {
      return;
    }
    var test = tests.shift();
    process.createChildProcess('node',[test])
      .addListener('output', function(str) {
          if( str !== null ) {
            //sys.print(str);
          }
        })
      .addListener('error', function(str) {
          if( str !== null ) {
            sys.print(str);
          }
        })
      .addListener('exit', function(str) {
          runNextTest();
        })
      .close();
  }

  runNextTest();
};
