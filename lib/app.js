var sys = require('sys'),
    path = require('path');

exports.createApp = createApp;
exports.modulePathToAppKey = modulePathToAppKey;
exports.guessAppLocation = guessAppLocation;

function createApp(modulePath, project, parent_apps_config) {
  modulePath = cleanupModulePath(modulePath);
  var key = modulePathToAppKey(modulePath);

  var app = {
    project: project,
    key: key,
    appPath: '/'+key,
    modulePath: modulePath,
    location: guessAppLocation(modulePath),
  };

  loadConfigAndSubApps(app, parent_apps_config);

  app.load = load;

  return app;
};

function load(path) {
  return require(path).load(this, this.project);
}

function cleanupModulePath(modulePath) {
  if( typeof modulePath === "undefined"
      || modulePath === null
      || modulePath === '' ) {
    modulePath = '.';
  }
  if(modulePath.charAt(0) === '.') {
    modulePath = path.join(process.cwd(), modulePath);
  }

  return modulePath;
}

function modulePathToAppKey(modulePath) {
  if( modulePath == '.' ) {
    modulePath = process.cwd();
  }
  return path.basename(modulePath);
}

function guessAppLocation(module_name, appendSuffix) {
  var path = require('path'),
      fs = require('fs');

  if( module_name.charAt(0) == '/' ) {
    return module_name;
  }

  var suffixes = ['.js','.node','/index.js', '/index.node'];

  for( var i=0; i < require.paths.length; i++ ) {
    var p = require.paths[i];
    
    var stat = null;
    if( appendSuffix ) {
      for( var j=0; j < suffixes.length; j++ ) {
        try {
          stat = fs.statSync(path.join(p,module_name+suffixes[j]));
          break;
        }
        catch(err) {
          if( err.message != "No such file or directory" ) {
            throw err;
          }
        }
      };
    }
    else {
      try {
        stat = fs.statSync(path.join(p,module_name));
      }
      catch(err) {
        if( err.message != "No such file or directory" ) {
          throw err;
        }
      }
    }

    if( stat !== null ) {
      return path.join(p,module_name);
    }
  }
}

function loadConfigAndSubApps(app, parent_apps_config) {
  // load in the config module
  try {
    var config_module = require(app.modulePath+'/config');
  }
  catch(err) {
    if( err.message.indexOf("Cannot find module") >= 0 ) {
      var config_module = {};
    }
    else {
      throw (new Error(err.message));
    }
  }

  // combine the config from the module with the config passed in from our
  // parent app
  var apps_config = inheritAndFlattenConfig(app, config_module.apps_config, parent_apps_config);

  // grab the config explicitly for this app
  app.config = apps_config['.'] || {};

  // you cannot nest an app within itself, so no subapps are going to need to see the config
  // for this app.
  delete apps_config[app.key];

  // merge the project configuration
  app.project.config = process.mixin(true, {}, config_module.project_config, app.project.config);

  // use the listed apps in config_module.apps to load in all the 
  // sub apps
  app.apps = {};
  if( config_module.apps )
  {
    config_module.apps.forEach(function(app_module_path) {
        var appKey = modulePathToAppKey(app_module_path);

        // make sure we only pass configuration that applies to this app.
        // This happens because in configuration you can supply options
        // for specific apps relative to others.
        var this_apps_config = configForApp(apps_config, appKey);

        // check to see if the app is relative to this one and if so
        // join the module path with this module_path
        if( app_module_path.charAt(0) == '.' ) {
          app_module_path = path.join(app.modulePath, app_module_path);
        }

        // finally, create the app
        app.apps[appKey] = createApp(app_module_path, app.project, this_apps_config);
        app.apps[appKey].parent = app;
        app.apps[appKey].appPath = app.appPath+app.apps[appKey].appPath;
      }, this);
  }
};

function inheritAndFlattenConfig(app, self, parent) {
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
  if( app.key in combined ) {
    if( '.' in combined ) {
      process.mixin(combined[app.key], combined['.']);
      combined['.'] = combined[app.key];
      delete combined[app.key];
    }
    else {
      combined['.'] = combined[app.key];
    }
  }

  // Merge in non-relative items from parent first
  for(var key in parent) {
    if( key.charAt(0) !== '.' ) {
      if( key == app.key ) {
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

function configForApp(apps_config, app_key) {
  var new_config = process.mixin(true, {}, apps_config);

  for( var key in new_config ) {
    if( key.charAt(0) === '.' ) {
      delete new_config[key];
    }
  }

  for( var key in new_config ) {
    if( key.charAt(0) === '.' ) {
      var parsed = parseAppPath(key);
      if( parsed[0] === app_key ) {
        if( parsed.length === 2 ) {
          new_config['./'+parsed[1]] = new_config[key];
        }
        else {
          new_config['.'] = new_config[key];
        }
        delete new_config[key];
      }
    }
  }

  return new_config;
};


function parseAppPath(appPath) {
  if( typeof appPath == 'undefined' ) {
    // appPath is assumed to be a string
    appPath = "";
  }

  appPath = appPath.replace(/^(\.\/|\.|\/)/,'');

  if( appPath.length == 0 ) {
    return []
  }

  var parts = appPath.split("/");
  if( parts.length == 1 ) {
    return parts
  }
  else {
    return [parts[0], parts.slice(1).join('/')];
  }
};
