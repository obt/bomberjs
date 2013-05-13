var bomberServer = require('bomberjs/lib/server');

exports.task = function(baseApp, argv) {
  // parse arguments
  var opts = bomberServer.defaultSettings;

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

  var bs = bomberServer.create(baseApp, opts);
  bs.start();

  //require('sys').p(bs);
};
