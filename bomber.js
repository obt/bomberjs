#! /usr/bin/env node

var sys = require('sys');

var path = require('./lib/utils').path;

// apps depend on bomber being on the path
try {
  var BomberServer = require('bomberjs/lib/server').Server;
}
catch(err) {
  if( err.message == "Cannot find module 'bomberjs/lib/server'" ) {
    require.paths.push(path.base(__filename)+'/..');
    var BomberServer = require('bomberjs/lib/server').Server;
  }
}


var config = {
  port: 8000,
  requestWaitForData: true
};

var folder = process.ARGV[2] || '.'; //if a folder wasn't specified, look in the current directory

var bs = new BomberServer(folder, config);
//sys.puts(sys.inspect(bs));
bs.start();
