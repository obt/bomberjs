#! /usr/bin/env node

/* bomber.js
 *
 * bomber.js is a shell script that is used to manage your Bomber projects.
 *
 * Syntax:
 * -------
 *
 *     bomber.js <flags> <task>
 *
 * Flags:
 *
 * + `--app <filename>`, `-a <filename>`: Optional.  the name or the path of a
 *   Bomber app. This argument is used by the Node require command, so read up
 *   on how that works to make sure Bomber will be able to find your app. If the
 *   argument isn’t supplied it uses the current directory.
 *
 * Tasks:
 *
 * It loads its commands in from `./lib/tasks`.
 *
 * + `start_server`: Start a bomber server
 *
 * Examples:
 * ---------
 *
 *     ./bomber.js server
 *
 *     ./bomber.js --app ./exampleProject server
 */

var sys = require('sys');
var path = require('path');
var posix = require('posix');
 
// We depend on bomberjs being on the path, so wrap this require
// for a module we need in a try catch, and so if bomberjs isn't in
// the path we can add it.
try {
  var App = require('bomberjs/lib/app').App;
}
catch(err) {
  // if that isn't on the path then assume the script being run is
  // in the source, so add the directory of the script to the path.
  if( err.message == "Cannot find module 'bomberjs/lib/app'" ) {
    require.paths.push(path.dirname(__filename)+'/..');
    var App = require('bomberjs/lib/app').App;
  }
}

// load in all the files from bomberjs/lib/tasks.  These are our
// base tasks that every app has.  like start_server (and
// run_tests eventually).  Down the line I'd like apps to be able
// to write their own tasks
var bomberjs_location = path.normalize(path.join(require('bomberjs/lib/utils').require_resolve('bomberjs/lib/app'),'../../'));
var dir = posix.readdir(path.join(bomberjs_location,'lib/tasks')).wait();
var tasks = {};
dir.forEach(function(file) {
    if( !file.match(/\.js$/) ) {
      return;
    }
    var p = 'bomberjs/lib/tasks/'+file.substr(0,file.length-3);
    tasks[path.basename(p)] = p;
  });


// ARGV[0] always equals node
// ARGV[1] always equals bomber.js
// so we ignore those
var argv = process.ARGV.slice(2);

// parse arguments
var opts = {};
while( argv.length > 0 ) {
  var stop = false;
  switch(argv[0]) {
    case "--tasks":
    case "-t":
      opts['tasks'] = true;
      break;
    case "--app":
    case "-a":
      opts['app'] = argv[1];
      argv.splice(0,1);
      break;
    default:
      stop = true;
  }
  if( stop ) {
    break;
  }
  argv.splice(0,1);
}

var app = new App(opts.app);
//TODO: allow apps to be able to supply their own tasks and load them
// here

if( opts.tasks ) {
  sys.puts('Available tasks:');
  Object.keys(tasks).forEach(function(task) {
    sys.print("  ");
    sys.puts(task);
    });
}
else if( argv.length == 0) {
  sys.puts("Script for managing Bomber apps.\nhttp://bomber.obtdev.com/");
}
else {
  if( !(argv[0] in tasks) ) {
    sys.puts("Unknown task: "+argv[0]);
  }
  else {
    require(tasks[argv[0]]).task(app);
  }
}
