#! /usr/bin/env node

var sys = require('sys')
  , path = require('path')
  , fs = require('fs')
  ;
 
// We depend on bomberjs being on the path, so wrap this require for a module we
// need in a try catch, and if bomberjs isn't in the path add it.
try {
  var app = require('bomberjs/lib/app');
}
catch(err) {
  if( err.message == "Cannot find module 'bomberjs/lib/app'" ) {
    // if that isn't on the path then assume the script being run is
    // in the source, so add the directory of the script to the path.
    require.paths.push(path.join(__dirname,'..'));
    var app = require('bomberjs/lib/app');
  }
}

/******** load in default tasks *****/
// load in all the files from bomberjs/lib/tasks.  These are our
// base tasks that every app has.  like start_server (and
// run_tests eventually).  Down the line I'd like apps to be able
// to write their own tasks
var module = require('bomberjs/lib/utils/module')
  , bomberjsLocation = path.normalize(path.join(module.resolveLocation('bomberjs/lib/app', true),'../../'))
  , dirContents = fs.readdirSync(path.join(bomberjsLocation,'lib/tasks'))
  , tasks = {}
  ;

dirContents.forEach(function(file) {
    if( !file.match(/\.js$/) ) {
      return;
    }
    var p = 'bomberjs/lib/tasks/'+file.substr(0,file.length-3);
    tasks[path.basename(p)] = p;
  });


/******** parse arguments *****/
// ARGV[0] is always node and ARGV[1] is always bomber.js so ignore those
var argv = process.ARGV.slice(2);

var opts = {};
while( argv.length > 0 ) {
  var stop = false;
  switch(argv[0]) {
    case "--app":
    case "-a":
      opts['app'] = argv[1];
      argv.shift();
      break;
    default:
      // once we reach an argument that doesn't start with '--' or '-' we stop,
      // and that argument is the task name
      stop = true;
  }
  if( stop ) {
    break;
  }
  argv.shift();
}

/******** create base app ****/
app.create(opts.app, function(baseApp) {
    /******** run requested task *****/
    if( argv.length == 0) {
      // they passed in no task, show help message
      sys.puts('Script for managing Bomber apps.\nhttp://bomber.obtdev.com/');
      sys.puts('\nAvailable tasks:');

      Object.keys(tasks).forEach(function(task) {
          sys.print("  ");
          sys.puts(task);
        });
    }
    else {
      if( !(argv[0] in tasks) ) {
        sys.puts("Unknown task: "+argv[0]);
      }
      else {
        var task = argv.shift();
        require(tasks[task]).task(baseApp, argv);
      }
    }
  });

