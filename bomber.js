#! /usr/bin/env node

var sys = require('sys');
var path = require('path');
var fs = require('fs');
 
// We depend on bomberjs being on the path, so wrap this require for a module we
// need in a try catch, and if bomberjs isn't in the path we can add it.
try {
  var project = require('bomberjs/lib/project');
}
catch(err) {
  // if that isn't on the path then assume the script being run is in the source,
  // so add the directory of the script to the path.
  if( err.message == "Cannot find module 'bomberjs/lib/project'" ) {
    require.paths.push(path.dirname(__filename)+'/..');
    var project = require('bomberjs/lib/project');
  }
}

/******** load in default tasks *****/
// we use the 'guessAppLocation' from the lib/app.js because it is basically
// just a way to figure out the location of a module
var guessAppLocation = require('bomberjs/lib/app').guessAppLocation;
var bomberjs_location = path.normalize(path.join(guessAppLocation('bomberjs/lib/app', true),'../../'));

var dir = fs.readdirSync(path.join(bomberjs_location,'lib/tasks'));

var tasks = {};
dir.forEach(function(file) {
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

/******** create project *****/
var project = project.create(opts.app);

/******** load app tasks *****/
project.eachApp(function(app) {
    try {
      var dir = fs.readdirSync(app.location+'/tasks');
      dir.forEach(function(file) {
          if (file.match(/^.+\.js$/)) {
            var n = path.basename(file, '.js');
            tasks[n] = app.modulePath + '/tasks/' + n;
          }
        });
    }
    catch(err) {
      if (err.message !== 'No such file or directory') {
        throw err;
      }
    }
  });

/******** run requested task *****/
if( argv.length == 0) {
  // the passed in no task
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
    require(tasks[task]).task(project, argv);
  }
}
