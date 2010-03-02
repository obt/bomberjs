exports.task = function(project, argv) {
  // parse arguments
  var opts = {};
  while( argv.length > 0 ) {
    var stop = false;
    switch(argv[0]) {
      case "--port":
      case "-p":
        opts['port'] = argv[1];
        argv.splice(0,1);
        break;
    }
    argv.splice(0,1);
  }

  // merge the command line configuration
  process.mixin(project.config.server, opts);

  project.server.start();
};
