var sys = require('sys');

var sha1 = require('../bundled/sha1'),
    promise = require('../bundled/promise');

var createApp = require('./app').createApp;

exports.create = function(baseAppModulePath) {
  var project = {
    config: {},

    // utility functions
    eachApp: eachApp,
    findApp: findApp,
    findApps: findApps,

    // event functions
    listen: listen,
    pipe: pipe,
    emit: emit
  };

  if (baseAppModulePath) {
    project.baseApp = createApp(baseAppModulePath, project);

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
  }

  return project;
};

/******** utility functions *****/
function eachApp(func) {
  var apps = [];

  var todo = [this.baseApp];

  while(todo.length > 0) {
    var a = todo.shift();
    apps.push(a);
    for( var key in a.apps ) {
      todo.push(a.apps[key]);
    }
  }

  next();

  function next() {
    if (apps.length < 1) {
      return;
    }
    func(apps.shift());
    next();
  }
}

function findApps(appPath) {
  var apps = [];
  var regex = new RegExp('^' + (appPath.charAt(0) === '/' ? '' : '\\/') + appPath.replace(/\*+\/?/g, function(match) {
        if( match.indexOf('**/') === 0 ) {
          return '([^/]+/)*';
        }
        else {
          return '[^/]+/';
        }
      }).replace(/(\/|\.)/g, "\\$1")+'$');

  this.eachApp(function(app) {
      if ((app.appPath).match(regex)) {
        apps.push(app);
      }
    });
  return apps;
}
function findApp(appPath) {
  return this.findApps(appPath)[0];
}

/******** event functions *****/
function listen(event, options, callback) {
  observe.call(this, 'listen', event, options, callback);
}

function pipe(event, options, callback) {
  observe.call(this, 'pipe', event, options, callback);
}

function emit(event, argument, step) {
  var p = new promise.Promise();

  if(  typeof this._observers === 'undefined' || typeof this._observers[event] === 'undefined') {
    p.resolve(argument);
    return p;
  }

  var self = this,
      observers = (this._observers ? (this._observers[event] || []) : []),
      index = 0;

  var queue = observers.filter(function(el) {
      return el[0].type === 'pipe' && !el[0].after;
    });

  next(argument);

  return p;

  function next(arg) {
    var o = queue[index++];

    if( !o ) {
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

    if( o[0].name ) {
      // this observer has a name, so we need to check if any other observers
      // are waiting on it
      queue = queue.concat(observers.filter(function(el) {
          return el[0].after && el[0].after === o[0].name;
        }));
    }

    if( step ) {
      var after = function(returned, err) {
        try {
          promise.when(step(err, returned, arg), next, reject);
        }
        catch(err) {
          return reject(err);
        }
      };
      try {
        promise.when(o[1](arg), after, function(err) { after(null, err); });
      }
      catch(err) {
        return after(null, err);
      }
    }
    else {
      try {
        promise.when(o[1](arg), next, reject);
      }
      catch(err) {
        return reject(err);
      }
    }
  }

  function reject(err) {
    p.reject(err);
  }
}

function observe(type, event, options, callback) {
  if( typeof callback === 'undefined' ) {
    callback = options;
    options = {};
  }

  options.type = type;

  if( typeof this._observers === 'undefined' ) {
    this._observers = {};
  }
  if( typeof this._observers[event] === 'undefined' ) {
    this._observers[event] = [];
  }

  this._observers[event].push([options, callback]);
}
