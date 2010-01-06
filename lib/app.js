var sys = require('sys');
var path_utils = require('./utils').path;

var App = function(app_path) {
  this.path = app_path;
  if(this.path.charAt(0) == '.') {
    this.path = path_utils.join(process.cwd(), this.path);
  }

  this.key = App.pathToKey(app_path);

  this.loadApps();
  this.loadRouter();

  // should we preload all views?
  this.views = {};
};

App.prototype.loadApps = function() {
  this.apps = {};


  try {
    var config = require(this.path+'/config');
    this.config = config;
    if( config.apps && config.apps.length > 0 )
    {
      config.apps.forEach(function(app_path) {
          var app = new App(app_path);
          this.apps[app.key] = app;
        }, this);
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

App.prototype.loadRouter = function() {
  //sys.puts('loading router for '+this.key);
  try {
    this.router = require(this.path+'/routes').router;
  }
  catch(err) {
    this.router = null;
    sys.puts(err);
  }
};

App.prototype.getView = function(app_key, view_name) {
  if( app_key == '.' || app_key == this.key ) {
    var app = this;
  }
  else {
    var app = this.apps[app_key];
  }

  if( !app.views[view_name] ) {
    app.views[view_name] = require(app.path+'/views/'+view_name);
  }

  return app.views[view_name];
}


App.pathToKey = function(app_path) {
  if( app_path.charAt(0) == '.' ) {
    return path_utils.filename(process.cwd());
  }
  return app_path.replace(/.*\/([^\/]+)\/?$/,"$1");
};

exports.App = App;
