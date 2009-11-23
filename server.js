var sys = require('sys');
var http = require('http');

var Response = require('./response').Response;

var Server = function(folder, options) {
  this.options = options;

  this.apps = Server.loadApps(folder);
  this.baseApp = this.apps[Server.appPathToKey(folder)];

  this.router = Server.getRouter(this.baseApp);
};

Server.appPathToKey = function(path) {
  if( path == "." ) {
    var cwd = process.cwd();
    return cwd.substr(cwd.lastIndexOf('/')+1);
  }
  return path.replace(/.*\/([^\/]+)$/,"$1");
};
Server.loadApps = function(folder) {
  var toLoad, apps;
  
  toLoad = [folder];
  apps = {};

  while(toLoad.length > 0) {
    var appPath = toLoad.splice(0,1)[0];
    var appKey = Server.appPathToKey(appPath);

    if( appKey in apps ) {
      continue;
    }

    //TODO: maybe verify that we can at least find the App
    // And if not, throw an error?
    apps[appKey] = {
      path: appPath,
      key: appKey,
      views: {}
    };

    try {
      var config = require(appPath+'/config');
      apps[appKey].config = config;
      if( config.apps && config.apps.length > 0 )
      {
        toLoad = toLoad.concat(config.apps);
      }
    }
    catch(err) {
      if( err.message.indexOf("Cannot find module") >= 0 ) {
        //sys.puts("App '"+appKey+"' doesn't have a config file");
      }
      else {
        throw (new Error(err.message));
      }
    }
  }

  return apps;
};

Server.getRouter = function(app) {
  //sys.puts('loading router for '+app.key);
  try {
    app.router = require(app.path+'/routes').router;
  }
  catch(err) {
    sys.puts(err);
  }

  return app.router;
};

Server.getView = function(app, viewName) {
  if( !app.views[viewName] ) {
    app.views[viewName] = require(app.path+'/views/'+viewName);
  }

  return app.views[viewName];
}

Server.prototype.start = function() {
  var server = this;

  http.createServer(function (req, res) {
      try {
        sys.puts("\nReceived " + req.method + " request for " + req.uri.full);

        var route = server.router.findRoute(server.baseApp, req.method, req.uri.path);
        if(!route) {
          res.sendHeader(404, {'Content-Type': 'text/plain'});
          res.sendBody('Not found');
          res.finish();
          return;
        }
        //sys.p(route);

        var view = Server.getView(server.apps[route.action.app], route.action.view);
        var response = new Response(res);

        view[route.action.action].apply(response);
      }
      catch(err) {
        res.sendHeader(500, {'Content-Type': 'text/plain'});
        res.sendBody(err.message);
        res.finish();
      }
      }).listen(server.options.port);

  sys.puts('Bomer Server running at http://localhost:'+server.options.port);
};

exports.Server = Server;
