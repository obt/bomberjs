var sys = require('sys'),
    path = require('path');

var cee = require('./chainedEventEmitter');

/**************** exports ****************/

exports.create = function(modulePath, parent, callback) {
  // clean up the args a bit
  modulePath = _cleanupModulePath(modulePath);
  if( !callback ) {
    callback = parent;
    parent = null;
  }

  // create our app
  var app            = function app() { return findApp.apply(this, arguments); }

  app.parent     = parent;

  // meta
  app.modulePath = modulePath;
  app.key        = _modulePathToAppKey(modulePath);
  app.appPath    = parent ? parent.appPath+'/'+app.key : '/'+app.key;
  app.location       = _guessAppLocation(modulePath);

  // state
  app.apps           = [];
  app.settings       = {};

  // utility functions
  app.loadApps       = app_loadApps;
  app.eachApp        = app_eachApp;
  app.findApp        = app_findApp;


  // add in event stuff
  cee.makeEmitter(app);

  //load the config file
  try {
    var configFunction = require(modulePath+'/config');

    if(configFunction.length > 0) {
      // they asked for the callback, they must be asynchronous
      configFunction.call(app, function() {
          _configLoaded();
        });
    }
    else {
      // they didn't ask for the callback, must be synchronous
      configFunction.call(app);
      _configLoaded();
    }
  }
  catch(err) {
    if( err.message == "Cannot find module '"+modulePath+'/config'+"'" ) {
      // they don't have a config file, this shouldn't be a problem
      _configLoaded();
    }
    else {
      throw err;
    }
  }

  function _configLoaded() {
    try {
      require(modulePath+'/router').call(app);
    }
    catch(err) {
      if( err.message == "Cannot find module '"+modulePath+'/router'+"'" ) {
        // they don't have a router, this shouldn't be a problem
        callback(app);
      }
      else {
        throw err;
      }
    }
    callback(app);
  }
};

/******** utility functions ******/
// all these are meant to act on an "app" object.  hence the 'app_' prefix.

function app_loadApps() {
  var appModulePaths = Array.prototype.slice(arguments, 0)
    , callback = appModulePaths.pop()
    ;

  if( appModulePaths[0].constructor == Array ) {
    appModulePaths = appModulePaths[0];
  }

  var parent = this;
  exports.create(appModulePath, this, function(app) {
      parent.apps.push(app);
    });
}
function app_eachApp(func) {
  var todo = [this];

  while(todo.length > 0) {
    var a = todo.shift();
    func(a);
    for( var key in a.apps ) {
      todo.push(a.apps[key]);
    }
  }
}
function app_findApps(glob) {
  var apps = [];

  this.eachApp(function(app) {
      if (_globMatches(app.appPath, glob)) {
        apps.push(app);
      }
    });

  return apps;
}
function app_findApp() {
  return this.findApps(appPath)[0];
}

/******** internal functions *****/

function _cleanupModulePath(modulePath) {
  if( typeof modulePath === "undefined" || modulePath === null || modulePath === '' ) {
    modulePath = '.';
  }

  if(modulePath.charAt(0) === '.') {
    modulePath = path.join(process.cwd(), modulePath);
  }

  return modulePath;
}

function _modulePathToAppKey(modulePath) {
  if( modulePath == '.' ) {
    modulePath = process.cwd();
  }
  return path.basename(modulePath);
}

function _guessAppLocation(modulePath) {
  var path = require('path'),
      fs = require('fs');

  if( modulePath.charAt(0) == '/' ) {
    return modulePath;
  }

  for( var i=0; i < require.paths.length; i++ ) {
    var p = require.paths[i]
      , stat
      ;
    
    try {
      stat = fs.statSync(path.join(p,modulePath));
    }
    catch(err) {
      if( err.errno != 2 ) {
        throw err;
      }
    }

    if( stat !== null ) {
      return path.join(p,modulePath);
    }
  }
}

function _globMatches(appPath, glob) {
  var regex = new RegExp('^' + (glob.charAt(0) === '/' ? '' : '\\/') + glob.replace(/\*+\/?/g, function(match) {
        if( match.indexOf('**/') === 0 ) {
          return '([^/]+/)*';
        }
        else {
          return '[^/]+/';
        }
      }).replace(/(\/|\.)/g, "\\$1")+'$');

  return !!(appPath.match(regex));
}

