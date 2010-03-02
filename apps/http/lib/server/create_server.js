var http = require('http'),
    sys = require('sys');

var sha1 = require('bomberjs/bundled/sha1');

var requestHandler = require('./request_handler').requestHandler;

exports.createServer = function(project) {
  checkProject(project);

  return {
    // properties
    project: project,
    config: project.config.server,
    running: false,

    // functions
    stop: stop,
    start: start,
  };
};

function stop(callback) {
  return this.project.emit('stop', null)
    .then(finished, finished); // make sure finished is called no matter what

  function finished() {
    this.httpServer.close();
    this.running = false;
    sys.puts('closed');
  }
};

function start() {
  this.project.eachApp(function(app) {
     loadRouterForApp(app);
   });

  // scope for the callbacks
  var server = this;

  return this.project.emit('startup', null)
    .then(success, failure);

  function success() {
    server.running = true;

    server.httpServer = http.createServer(function (req, res) {
        // bind the requestHandler method to the server
        requestHandler.call(server, req, res);
      });
    server.httpServer.listen(server.config.port);

    sys.puts('Bomber Server running at http://localhost:'+server.config.port);
  }

  function failure(err) {
    sys.puts( err.stack || err );
  }
};

function loadRouterForApp(app) {
  //sys.puts('loading router for '+app.key);
  try {
    app.router = require(app.modulePath+'/routes').router;
    app.router.path = app.modulePath+'/routes';
  }
  catch(err) {
    if( err.message !== "Cannot find module '"+app.modulePath+"/routes'" ) {
      throw err;
    }
  }
}

function checkProject(project) {
  var securitySecretWarning =
    "\nWARNING: No signing secret is set in your configuration file.\n" +
    " The secret is used to sign secure cookies, validate session and encrypt user\n"+
    " passwords, so it's extremely important for you to set a unique and secure secret.\n" +
    " A temporary secret will be used for now, but all cookies, session and user\n" +
    " accounts will be invalidated when the server is restarted!\n";

  // Warn if no signing secret is set -- and create a temporary one
  if (!project.config.security || !project.config.security.signing_secret) {
    sys.error(securitySecretWarning);

    // set the random signing secret
    project.config.security = project.security || {};
    project.config.security.signing_secret = sha1.hex_hmac_sha1(Math.random(), Math.random());
  }
}
