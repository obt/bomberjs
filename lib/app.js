var sys = require('sys');
var path_utils = require('./utils').path;

var App = function(app_path) {
  this.path = app_path;
  if(this.path.charAt(0) == '.') {
    this.path = path_utils.join(process.cwd(), this.path);
  }

  this.key = App.pathToKey(app_path);

  this._loadApps();
  this._loadRouter();

  // should we preload all views?
  this.views = {};
};

App.prototype.getView = function(view_name, app_key) {
  var val = this._passAlongIfNecessary('getView', app_key, view_name);
  if( val != App.NOT_PASSED ) { return val; }

  if( !this.views[view_name] ) {
    this.views[view_name] = require(this.path+'/views/'+view_name);
  }
  return this.views[view_name];
}

App.prototype.getRoute = function(method, path, app_key) {
  var val = this._passAlongIfNecessary('getRoute', app_key, method, path);
  if( val != App.NOT_PASSED ) { return val; }

  route = this.router.findRoute(method, path);

  if( route.path ) {
    // we aren't finished processing this route.  the router returned
    // a partial path, and hopefully supplied the name of a different
    // app to look in for the rest of the routing.
    if( route.action.app != this.key && route.action.app != "." && route.action.app in this.apps ) {
      var p = route.path;
      delete route.path;
      route = this.apps[route.action.app].findRoute(method, p, route);
    }
    else {
      return null;
    }
  }
  return route;
}

App.prototype._loadApps = function() {
  this.apps = {};

  try {
    this.config = require(this.path+'/config');
    if( this.config.apps && this.config.apps.length > 0 )
    {
      this.config.apps.forEach(function(app_path) {
          if( app_path.charAt(0) == '.' ) {
            app_path = path_utils.join(this.path,app_path);
          }
          var app = new App(app_path);
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
    this.router = require(this.path+'/routes').router;
  }
  catch(err) {
    this.router = null;
    //sys.puts(err);
  }
};


/* Since Apps can have sub apps, or reference other apps, sometimes
 * we want a function to be ran but all we know is that it is a sub
 * app of this particular app.  Functions that want to allow this can
 * call this method which looks at the app_key to see if we want to
 * run this on a sub app or not.  If that is desired, do so, otherwise
 * return App.NOT_PASSED indicating to the calling function that no
 * processing has been passed to a sub app.
 */
App.prototype._passAlongIfNecessary = function(func_name, app_key) {
  var app_key_parts = this._parseAppKey(app_key);

  if( app_key_parts.length == 0 ) {
    return App.NOT_PASSED;
  }
  if( app_key_parts[0] in this.apps ) {
    var app = this.apps[app_key_parts[0]];
    var args = Array.prototype.slice.call(arguments, 2);
    args.push(app_key_parts[1]);
    return this[func_name].apply(app, args);
  }

  // at this point if we haven't returned, then something has gone wrong...
  throw "Can't find app for '"+app_key+"'";
};
// an object or testing whether we passed the function on to another
// app.  The value of this object isn't important, all this is important
// is that it exist.
App.NOT_PASSED = {};

/* An app_key is an easy way to reference an app, as opposed to say
 * using the full module path to that app. but app_keys are actually
 * paths themselves, to reference sub apps. So, this function helps
 * us determin what app is requested.
 *
 * The versatility of this function might be getting out of hand. I don't
 * know how much I want to guess what users mean.  The rules are straight forward
 * but I don't know if we want to force people into one direction...
 *
 * Rules:
 * '.','./','/' are removed from beginning of key
 * current app name is removed from beginning of key
 *
 * Some examples:
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

App.prototype._parseAppKey = function(app_key) {
  if( typeof app_key == 'undefined' ) {
    // app_key is assumed to be a string
    app_key = "";
  }

  app_key = app_key.replace(/^(\.\/|\.|\/)/,'');
  app_key = app_key.replace(this.key+"/", '');

  if( app_key.length == 0 || app_key == this.key ) {
    return []
  }

  var parts = app_key.split("/");
  if( parts.length == 1 ) {
    return parts
  }
  else {
    return [parts[0], parts.slice(1).join('/')];
  }
}

/* This function turns an app_path, i.e. a module path into an app_key,
 * i.e. one word that is easy for refrencing.
 *
 * different app_paths and what is returned
 * (assuming current dir = /current/working/directory)
 * '.' => 'directory'
 * './my/path' => 'path'
 * 'my/path' => 'path'
 * '/my/path' => 'path'
 */
App.pathToKey = function(app_path) {
  if( app_path == '.' ) {
    app_path = process.cwd();
  }
  return path_utils.filename(app_path);
};

exports.App = App;
