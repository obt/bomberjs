var app = require('./app');

exports.create = function(baseAppModulePath) {
  var project = {
    settings: {},

    // utility functions
    eachApp: eachApp,
    findApp: findApp,
    findApps: findApps,

    // event functions
    listen: listen,
    pipe: pipe,
    emit: emit
  };

  project.baseApp = app.create(baseAppModulePath, project);

  // load the init.js file of all apps
  project.eachApp(function(app) {
      try {
        app.load(app.modulePath+'/init');
      }
      catch(err) {
        if( err.message !== ("Cannot find module '"+app.modulePath+"/init"+"'") ) {
          throw err;
        }
      }
    });

  return project;
};

/******** utility functions *****/
function eachApp(func) {
  var todo = [this.baseApp];

  while(todo.length > 0) {
    var a = todo.shift();
    func(a);
    for( var key in a.apps ) {
      todo.push(a.apps[key]);
    }
  }
}

function findApps(glob) {
  var apps = [];

  this.eachApp(function(app) {
      if (globMatches(app.appPath, glob)) {
        apps.push(app);
      }
    });
  return apps;
}
function findApp(glob) {
  return this.findApps(appPath)[0];
}

function globMatches(appPath, glob) {
  var regex = new RegExp('^' + (appPath.charAt(0) === '/' ? '' : '\\/') + appPath.replace(/\*+\/?/g, function(match) {
        if( match.indexOf('**/') === 0 ) {
          return '([^/]+/)*';
        }
        else {
          return '[^/]+/';
        }
      }).replace(/(\/|\.)/g, "\\$1")+'$');

  return !!(appPath.match(regex));
}

/******** event functions *****/
function observe(type, event, options, callback) {
  if( typeof callback === 'undefined' ) {
    callback = options;
    options = {};
  }

  options.type = type;

  if (event.indexOf('/' ) > -1) {
    var i = event.lastIndexOf('/');
    options.glob = event.substr(0, i);
    event = event.substr(i+1);
  }

  if( typeof this._observers === 'undefined' ) {
    this._observers = {};
  }
  if( typeof this._observers[event] === 'undefined' ) {
    this._observers[event] = [];
  }

  this._observers[event].push([options, callback]);
}

function listen(event, options, callback) {
  observe.call(this, 'listen', event, options, callback);
}

function pipe(event, options, callback) {
  observe.call(this, 'pipe', event, options, callback);
}

function emit() {
  var args = Array.prototype.slice.call(arguments,0);

  var callback = args.pop(),
      appPath = null,
      event = args[0],
      argument = args[1],
      step = args[2];

  if (event.indexOf('/' ) > -1) {
    var i = event.lastIndexOf('/');
    appPath = event.substr(0, i);
    event = event.substr(i+1);
  }

  var observers = this._observers[event].filter(function(el) {
      return !el[0].glob || (appPath && globMatches(appPath, el[0].glob));
    });

  var index = 0,
      queue = observers.filter(function(el) {
      return el[0].type === 'pipe' && !el[0].after;
    });

  return next(null, argument);

  function next(error, arg) {
    var obv = queue[index++];

    if( !obv ) {
      // we've gone through all the pipe observers
      var listeners = observers.filter(function(el) {
            return el[0].type === 'listen';
          });

      for (var i = 0; i < listeners.length; i++) {
        var el = listeners[i];
        try {
          el[1](arg);
        }
        catch(err) {
          return reject(err);
        }
      }

      return p.resolve(arg);
    }

    if( obv[0].name ) {
      // this observer has a name, so we need to check if any other observers
      // are waiting on it
      queue = queue.concat(observers.filter(function(el) {
          return el[0].after && el[0].after === obv[0].name;
        }));
    }

    if( step ) {
      var after = function(error, returned) {
        try {
          promise.when(step(err, returned, arg), next, reject);
        }
        catch(err) {
          return reject(err);
        }
      };
      try {
        promise.when(obv[1](arg), after, function(err) { after(null, err); });
      }
      catch(err) {
        return after(null, err);
      }
    }
    else {
      var after = next;
    }

    try {
      promise.when(obv[1](arg), after);
    }
    catch(err) {
      return reject(err);
    }
  }
}
