var sys = require('sys');
var path_utils = require('./utils').path;

var App = function(module_path) {
  this.module_path = module_path;
  if(this.module_path.charAt(0) == '.') {
    this.module_path = path_utils.join(process.cwd(), this.module_path);
  }

  this.key = App.modulePathToKey(module_path);

  this._loadApps();
  this._loadRouter();

  // should we preload all views?
  this.views = {};
};

App.prototype.getView = function(view_name, app_path) {
  var app_path_parts = this._parseAppPath(app_path);

  if( app_path_parts.length == 0 ) {
    if( !this.views[view_name] ) {
      this.views[view_name] = require(this.module_path+'/views/'+view_name);
    }
    return this.views[view_name];
  }
  if( app_path_parts[0] in this.apps ) {
    return this.apps[app_path_parts[0]].getView(view_name, app_path_parts[1]);
  }

  // at this point if we haven't returned, then something has gone wrong...
  throw "Can't find app for '"+app_path+"'";
}

App.prototype.getRoute = function(method, path, app_path) {
  var app_path_parts = this._parseAppPath(app_path);

  if( app_path_parts.length == 0 ) {
    route = this.router.findRoute(method, path);

    if( route.path ) {
      // we aren't finished processing this route.  the router returned
      // a partial path, and hopefully supplied the name of a different
      // app to look in for the rest of the routing.
      if( route.action.app != this.key && route.action.app != "." && route.action.app in this.apps ) {
        route = this.apps[route.action.app].getRoute(method, route);
      }
      else {
        return null;
      }
    }
    return route;
  }
  if( app_path_parts[0] in this.apps ) {
    var route = this.apps[app_path_parts[0]].getRoute(method, path, app_path_parts[1]);

    if( this._parseAppPath(route.action.app).length === 0 ) {
      route.action.app = "";
    }
    route.action.app = path_utils.join(app_path_parts[0], route.action.app);
    if(route.action.app.charAt(route.action.app.length-1) == '/') {
      route.action.app = route.action.app.substr(0, route.action.app.length-1);
    }
    return route;
  }

  // at this point if we haven't returned, then something has gone wrong...
  throw "Can't find app for '"+app_path+"'";

}

App.prototype._loadApps = function() {
  this.apps = {};

  try {
    this.config = require(this.module_path+'/config');
    if( this.config.apps && this.config.apps.length > 0 )
    {
      this.config.apps.forEach(function(app_module_path) {
          if( app_module_path.charAt(0) == '.' ) {
            app_module_path = path_utils.join(this.module_path, app_module_path);
          }
          var app = new App(app_module_path);
          this.apps[app.key] = app;
        }, this);
    }
  }
  catch(err) {
    if( err.message.indexOf("Cannot find module") >= 0 ) {
      this.config = null;
      //sys.puts("App '"+appKey+"' doesn't have a config file");
    }
    else {
      throw (new Error(err.message));
    }
  }
}

App.prototype._loadRouter = function() {
  //sys.puts('loading router for '+this.key);
  try {
    this.router = require(this.module_path+'/routes').router;
  }
  catch(err) {
    this.router = null;
    //sys.puts(err);
  }
};

/* An app_path is an easy way to reference an app, as opposed to say
 * using the full module path to that app. This function helps
 * us determine what app is requested.
 *
 * The versatility of this function might be getting out of hand. I don't
 * know how much I want to guess what users mean.  The rules are straight forward
 * but I don't know if we want to force people into one direction...
 *
 * Rules:
 * '.','./','/' are removed from beginning of key
 * current app name is removed from beginning of key
 *
 * Examples
 * (assuming the current app is 'currApp')
 * (grouped by equivelancy)
 *
 * '' => []
 * '.' => []
 * './' => []
 * '/' => []
 *
 * 'currApp' => []
 * '/currApp' => []
 *
 * './subApp' => ['subApp']
 * '/subApp' => ['subApp']
 * 'subApp' => ['subApp']
 * 'currApp/subApp' => ['subApp']
 * '/currApp/subApp' => ['subApp']
 *
 * './sub/app/stuff' => ['sub', 'app/stuff']
 * '/sub/app/stuff' => ['sub', 'app/stuff']
 * 'sub/app/stuff' => ['sub', 'app/stuff']
 * 'currApp/sub/app/stuff' => ['sub', 'app/stuff']
 * '/currApp/sub/app/stuff' => ['sub', 'app/stuff']
 */

App.prototype._parseAppPath = function(app_path) {
  if( typeof app_path == 'undefined' ) {
    // app_path is assumed to be a string
    app_path = "";
  }

  app_path = app_path.replace(/^(\.\/|\.|\/)/,'');
  app_path = app_path.replace(this.key+"/", '');

  if( app_path.length == 0 || app_path == this.key ) {
    return []
  }

  var parts = app_path.split("/");
  if( parts.length == 1 ) {
    return parts
  }
  else {
    return [parts[0], parts.slice(1).join('/')];
  }
}

/* This function turns a module path into a key, one word that is easy
 * for refrencing. It just returns anything after the last slash.
 *
 * Examples:
 * (assuming current working directory = /path/to/dir)
 * '.' => 'dir'
 * './my/path' => 'path'
 * 'my/path' => 'path'
 * '/my/path' => 'path'
 */
App.modulePathToKey = function(app_path) {
  if( app_path == '.' ) {
    app_path = process.cwd();
  }
  return path_utils.filename(app_path);
};

exports.App = App;
