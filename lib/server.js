// node modules
var sys = require('sys')
  , http = require('http')
  , url = require('url')
  ;

// bundled dependencies
var sha1 = require('../dependencies/sha1');

// built-in
var requestHandler = require('./requestHandler')
  , connection = require('./connection')
  ;

exports.create = function(baseApp, opts) {
  return {
  // properties
    baseApp: baseApp
  , settings: opts
  // state
  , running: false
  // functions
  , stop: server_stop
  , start: server_start
  }
};

exports.defaultSettings = {
  port: 8400
};

function server_start() {
  if (!this.running) {
    this.running = true;

    var app = this.baseApp;
    this.httpServer = http.createServer(function (req, res) {
        sys.puts("\nReceived " + req.method + " request for " + req.url);

        try {
          requestHandler(app, connection.create(req, res));
        }
        catch(err) {
          sys.puts(err.stack);
        }
      });
    this.httpServer.listen(this.settings.port);

    sys.puts('Bomber Server running at http://localhost:'+this.settings.port);
  }
};

function server_stop() {
  if (this.running) {
    this.httpServer.close();
    this.running = false;
    sys.puts('Server stopped.');
  }
}
