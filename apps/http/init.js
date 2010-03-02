var http = require('http');

exports.load = function(app, project) {
  // make sure that we only create a server once
  if( !project.server ) {
    project.server = require('./lib/server/create_server').createServer(project);
  }
};
