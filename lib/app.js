var sys = require('sys'),
    path = require('path');

var utils = require('./utils');

/* AppNotfoundError
 *
 * Thrown when a specific App can't be found.
 */
/* ViewNotfoundError
 *
 * Thrown when a specific View can't be found.
 */
/* ActionNotfoundError
 *
 * Thrown when a specific Action can't be found.
 */
var errors = exports.errors = {};
['AppNotFoundError','ViewNotFoundError','ActionNotFoundError']
    .forEach(function(err_name) {
        errors[err_name] = utils.createCustomError(err_name);
      });

/* App(module_path)
 *
 * Bomber is centered around the idea of apps, which are just a bunch of
 * functionallity wrapped up into a folder. This object handles all interactions
 * with an app.
 *
 * For example, those might be:
 *
 * + loading the app, e.g. reading config.js, routes.js, etc
 * + loading specified subapps
 * + getting a route for a url
 * + loading a specific action or view
 *
 * Parameters:
 *
 * + `module_path`: `String`. The path to this app. Node will use it to
 *   `require()` the app's modules.
 * + `project_scope`: `Object`. A reference to the global object that all apps have a
 *   reference to.
 * + `parent`: `App`.  Optional. The app that created this app.
 * + `parent_apps_config`: `Object`. Optional. An app's configuration is loaded from
 *    a config.js file in its root.  This object will override (recursively) the
 *    configuration from that file.
 *
 * Note:
 *
 * A few functions in this "class" take an optional last parameter that
 * is an "app_path".  An app_path is a way to navigate apps and their subapps to
 * get the app that you want.  Because certain things like routing and getting
 * actions can apply to sub apps (and not this one) you have to have some way to
 * specify this. App.prototype._parseAppPath helps facilitate with this by
 * returning an object that tells if the function should apply to this app, or
 * should be passed to a sub app.
 */
var App = exports.App = function(module_path, project_scope, parent, parent_apps_config) {
  // set the module path if one hasn't been given
  if( typeof module_path === "undefined"
      || module_path === null
      || module_path === '' ) {
    this.module_path = '.';
  }
  else {
    this.module_path = module_path;
  }

  // if the module path is relative, make it not so.
  if(this.module_path.charAt(0) === '.') {
    this.module_path = path.join(process.cwd(), this.module_path);
  }

  // get the key for this app
  this.key = App.modulePathToAppKey(this.module_path);

  // scope stuff
  this.project = project_scope;
  this.parent = parent;

  // set up the app
  this._loadConfigurationAndApps(parent_apps_config);
  this._loadRouter();

  // TODO: should we preload all views?
  this.views = {};
};

/* App.modulePathToAppKey(app_path)
 *
 * This function turns a module path into a key, one word that is easy
 * for refrencing. It just returns anything after the last slash.
 *
 * Parameters:
 *
 * + `module_path`: `String`. The module path for the app.
 *
 * Returns:
 *
 * `String`. An app key.  
 *
 * Examples:
 * ---------
 *
 * (assuming current working directory = /path/to/dir)
 *
 *     '.' => 'dir'
 *     './my/path' => 'path'
 *     'my/path' => 'path'
 *     '/my/path' => 'path'
 */
App.modulePathToAppKey = function(app_path) {
  if( app_path == '.' ) {
    app_path = process.cwd();
  }
  return path.basename(app_path);
};

/* App.prototype.getView(view_name, app_path)
 *
 * Find a view belonging to this app or a subapp.
 *
 * Parameters:
 *
 * + `view_name`: `String`. The name of the view.  This will correspond to the filename.
 *   So if the app structure looks like this:
 *
 *       ./app/
 *         views/
 *           my_view.js
 *
 *   then `my_view` is the name of the view.
 *
 * + `app_path`: `String`. Is the view we are looking for located in a subapp? This is the
 *   path to the app that the view is located in.
 *
 * Returns:
 *
 * The exports object of the file specified by `view_name`.
 *
 * Throws:
 *
 * + `ViewNotFoundError` if there is no file corresponding to `view_name`
 * + `AppNotFoundError` if there is no app corresponding to `app_path`
 */
App.prototype.getView = function(view_name, app_path) {
  var app_path_parts = this._parseAppPath(app_path);

  if( app_path_parts.length == 0 ) {
    if( !this.views[view_name] ) {
      try {
        this.views[view_name] = require(this.module_path+'/views/'+view_name);
      }
      catch(err) {
        if( err.message.indexOf('Cannot find module') === 0 ) {
          throw new errors.ViewNotFoundError('app: ' + (app_path || this.key)
                                              + ', view: ' + view_name);
        }
      }
    }
    return this.views[view_name];
  }
  if( app_path_parts[0] in this.apps ) {
    return this.apps[app_path_parts[0]].getView(view_name, app_path_parts[1]);
  }

  // at this point if we haven't returned, then something has gone wrong...
  throw new errors.AppNotFoundError('app: ' + app_path);
};

/* App.prototype.getAction(route_action)
 *
 * Find an action specified by a route.
 *
 * Parameters:
 *
 * + `route_action`: A route is an object that is returned by
 *   `App.prototype.getRoute` and it has two properties.  `params` and `action`.
 *   See `Router.prototype.findRoute` for details.
 *
 *   This object expects to receive the `action` property of a route. The
 *   `action` is an object that can have 3 properties: `action`, `view`
 *   and `app`.  Here is how those properties are used.
 *
 *   `action`: Required. Either a `String` or a `Function`.  If it is a `String`
 *   then `view` is required.  If it is a `Function` then `view` and `app` are 
 *   ignored.   
 *
 *   `view`: `String`. The name of the view.  This is used by
 *   `App.prototype.getView` so look at that object for details.   
 *
 *   `app`: `String`. The app path.  This is used by `App.prototype.getView` so
 *   look at that object for details.   
 *
 * Returns:
 *
 * A function
 *
 * Throws:
 *
 * + `ActionNotFoundError` if it can't find a function specified
 *   by `route_action`
 *
 * This method also calls `App.prototype.getView`, so it can `throw` the same
 * errors as that method.
 */
App.prototype.getAction = function(route_action) {
  // If the route_action's action is a function, just return that
  if( route_action.action instanceof Function ) {return route_action.action;}

  var view = this.getView(route_action.view, route_action.app);

  if( !(route_action.action in view) ) {
    throw new errors.ActionNotFoundError('app: '
                    + (route_action.app || this.key)
                    + ', view: ' + route_action.view
                    + ', action: ' + route_action.action);
  }

  return view[route_action.action];
};

/* App.prototype.getRoute(method, url_path, app_path)
 *
 * This calls the `findRoute` method of the appropriate bomberjs Router
 * object. 
 *
 * This does some trickery in that if the `Router.prototype.findRoute` method
 * returns a partial route (so it didn't process the full path of the URL), it
 * will pass the route off to the app specified by the partial route.
 *
 * Parameters:
 *
 * + `method`: `String`. The HTTP method for this request.
 *
 * + `url_path`: `String`. The URL requested.
 *
 * + `app_path`: `String`. You can specify that a particular path should be routed by a
 *   subapp.  This is the path to that subapp.
 *
 * Returns:
 *
 * A route object.  See `Router.prototype.findRoute` for details.
 *
 * Throws:
 *
 * + `AppNotFoundError` if there is no app corresponding to `app_path`
 */
App.prototype.getRoute = function(method, url_path, app_path) {
  var app_path_parts = this._parseAppPath(app_path);

  if( app_path_parts.length == 0 ) { // they requested this app
    if( !this.router ) {
      sys.puts("No router for app '"+this.key+"'");
      return null;
    }
    route = this.router.findRoute(method, url_path);

    if( route !== null && route.path ) {
      // we aren't finished processing this route.  the router returned
      // a partial url, and hopefully supplied the name of a different
      // app to look in for the rest of the routing.
      if(    route.action.app != this.key
          && route.action.app != "."
          && route.action.app in this.apps ) {
        route = this.apps[route.action.app].getRoute(method, route);
      }
      else {
        return null;
      }
    }
    return route;
  }
  else if( app_path_parts[0] in this.apps ) { // they requested a sub app
    var route = this.apps[app_path_parts[0]].getRoute(
                                                method,
                                                url_path,
                                                app_path_parts[1]);

    if( this._parseAppPath(route.action.app).length === 0 ) {
      route.action.app = "";
    }
    route.action.app = path.join(app_path_parts[0], route.action.app);
    if(route.action.app.charAt(route.action.app.length-1) == '/') {
      route.action.app = route.action.app.substr(0, route.action.app.length-1);
    }
    return route;
  }

  // at this point if we haven't returned, then something has gone wrong...
  throw new errors.AppNotFoundError('app: ' + app_path);
};

/* App.prototype._loadConfigurationAndApps(parent_apps_config)
 *
 * Used internally to load the configuration and all subapps of this app.
 *
 * Parameters:
 *
 * + `parent_apps_config`: `Object`. The configuration from the parent app.  This
 *   will get merged with the configuration loaded from `config.js`.
 */
App.prototype._loadConfigurationAndApps = function(parent_apps_config) {
  // load in the config module
  try {
    var config_module = require(this.module_path+'/config');
  }
  catch(err) {
    if( err.message.indexOf("Cannot find module") >= 0 ) {
      var config_module = {};
      //sys.puts("App '"+appKey+"' doesn't have a config file");
    }
    else {
      throw (new Error(err.message));
    }
  }

  // combine the config from the module with the config passed in from our
  // parent app
  var apps_config = this._inheritAndFlattenConfig(config_module.apps_config, parent_apps_config);

  // grab the config explicitly for this app
  this.config = apps_config['.'] || {};
  // you cannot nest an app within itself, so no subapps are going to need to see the config
  // for this app.
  delete apps_config[this.key];

  // merge the project configuration
  this.project.config = process.mixin( process.mixin(true, {}, config_module.project_config), this.project.config);

  // use the listed apps in config_module.apps to load in all the 
  // sub apps
  this.apps = {};
  if( config_module.apps )
  {
    config_module.apps.forEach(function(app_module_path) {
        var app_key = App.modulePathToAppKey(app_module_path);

        // make sure we only pass configuration that applies to this app.
        // This happens because in configuration you can supply options
        // for specific apps relative to others.
        var this_apps_config = this._configForApp(apps_config, app_key);

        // check to see if the app is relative to this one and if so
        // join the module path with this module_path
        if( app_module_path.charAt(0) == '.' ) {
          app_module_path = path.join(this.module_path, app_module_path);
        }

        // finally, create the app
        this.apps[app_key] = new App(app_module_path, this.project, this, this_apps_config);
      }, this);
  }
};

/* App.prototype._inheritAndFlatten(self, parent)
 *
 * Used internally to merge two configurations
 *
 * Parameters:
 *
 * + `self`: `Object`. The configuration loaded from this app
 * + `parent`: `Object`. The configuration loaded from the parent app
 *
 * Returns:
 *
 * + The merged configuration
 */
App.prototype._inheritAndFlattenConfig = function(self, parent) {
  // We do this in a slightly tricky way.  We want to do two things in this
  // function.  First is have the parent configuration merged with the
  // configuration from this app.  The parent configuration overwrites the app's
  // configuration.  Secondly, if there are any relative references to this app
  // we want to merge those with the non-relative references. Relative overwrites
  // non-relative. i.e. more specific overwrites more general.

  // we have to copy the `self` object because it is straight from
  // the module.  If we were to manipulate it directly then all other instances
  // of this app elsewhere in the tree would get this modified object.
  var combined = process.mixin(true, {}, self);

  // For self, if it has both absolute and relative means
  // of referencing this app, merge them.
  if( this.key in combined ) {
    if( '.' in combined ) {
      process.mixin(combined[this.key], combined['.']);
      combined['.'] = combined[this.key];
      delete combined[this.key];
    }
    else {
      combined['.'] = combined[this.key];
    }
  }

  // Merge in non-relative items from parent first
  for(var key in parent) {
    if( key.charAt(0) !== '.' ) {
      if( key == this.key ) {
        process.mixin(true, combined['.'], parent[key]);
      }
      else {
        if( !(key in combined) ) {
          combined[key] = {};
        }
        process.mixin(true, combined[key], parent[key]);
      }
    }
  }

  // Finally merge in relative items from parent, so they take
  // the most precedent
  for(var key in parent) {
    if( key.charAt(0) === '.' ) {
      if( !(key in combined) ) {
        combined[key] = {};
      }
      process.mixin(true, combined[key], parent[key]);
    }
  }

  return combined;
};

/* App.prototype._configForApp(apps_config, app_key)
 *
 * Used internally to prepare a configuration for sending it to a subapp.
 *
 * It is possible to specify configuration for sub apps in an app.  You can
 * specify it for all sub apps with a given key or you can provide an app path
 * to the app.  This function goes through and makes sure all the relative paths
 * (app paths) point to the passed in app, and it removes that passed in app's
 * key from the path.
 *
 * Parameters:
 *
 * + `apps_config`: `Object`. The configuration to process
 * + `app_key`: `String`. The key of the app for which this configuration
 *   should be edited.
 *
 * Returns:
 *
 * The new, edited, configuration.
 */
App.prototype._configForApp = function(apps_config, app_key) {
  var new_config = process.mixin(true, {}, apps_config);

  for( var key in new_config ) {
    if( key.charAt(0) === '.' ) {
      var parsed = this._parseAppPath(key);
      if( parsed[0] === app_key ) {
        if( parsed.length === 2 ) {
          new_config['./'+parsed[1]] = new_config[key];
        }
        else {
          new_config['.'] = new_config[key];
        }
        delete new_config[key];
      }
      else {
        delete new_config[key];
      }
    }
  }

  return new_config;
};

/* App.prototype._loadRouter()
 *
 * Used internally to load the router of this app
 */
App.prototype._loadRouter = function() {
  //sys.puts('loading router for '+this.key);
  try {
    this.router = require(this.module_path+'/routes').router;
    this.router.path = this.module_path+'/routes';
  }
  catch(err) {
    this.router = null;
    //sys.puts(err);
  }
};

/* App.prototype._parseAppPath(app_path)
 *
 * Used internally to determine which app needs to handle a function.
 *
 * An app_path is an easy way to reference subapps of an app, as opposed to say
 * using the full module path to that app. This function helps us determine what
 * app is requested.
 *
 * The versatility of this function might be getting out of hand. I don't
 * know how much I want to guess what users mean.  The rules are straight
 * forward but I don't know if we want to force people into one direction...
 *
 * Rules:
 * '.', './', '/' are removed from beginning of path
 * current app name is removed from beginning of path
 *
 * Parameters:
 *
 * + `app_path`: `String`
 *
 * Returns:
 *
 * An array.  The array is empty if the app_path pointed to this app.  The
 * first element in the array is the name of the direct subapp of this app
 * specified.  The second argument is the rest app_path, for the subapp to 
 * parse itself.
 *
 * Examples:
 * ---------
 *
 * (assuming the current app is 'currApp')
 *
 * (grouped by equivelancy)
 *
 *     '' => []
 *     '.' => []
 *     './' => []
 *     '/' => []
 *
 *     'currApp' => []
 *     '/currApp' => []
 *
 *     './subApp' => ['subApp']
 *     '/subApp' => ['subApp']
 *     'subApp' => ['subApp']
 *     'currApp/subApp' => ['subApp']
 *     '/currApp/subApp' => ['subApp']
 *
 *     './sub/app/stuff' => ['sub', 'app/stuff']
 *     '/sub/app/stuff' => ['sub', 'app/stuff']
 *     'sub/app/stuff' => ['sub', 'app/stuff']
 *     'currApp/sub/app/stuff' => ['sub', 'app/stuff']
 *     '/currApp/sub/app/stuff' => ['sub', 'app/stuff']
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
};

