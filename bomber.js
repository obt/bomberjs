#! /usr/bin/env node

var sys = require('sys');

var path = require('./lib/utils').path;

require.paths.push(path.base(__filename)+'/..');

var BomberServer = require('./lib/server').Server;

var config = {
  port: 8000,
  requestWaitForData: true
};

var folder = process.ARGV[2] || '.'; //if a folder wasn't specified, look in the current directory

var bs = new BomberServer(folder, config);
//sys.puts(sys.inspect(bs));
bs.start();
