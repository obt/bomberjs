var actions = require('./actions')
  , fs = require('fs')
  , path = require('path')
  ;

exports.create = function(path, globalContext) {
  var app =
    { global: globalContext || {}
    , path: path || process.cwd()
    , files: {}
    , actions: {}
    , performAction: actions.performAction
    , mount: mount
    , load: load
    };

  return app;
}

function mount(what, where) {
  if (typeof what === 'string') {
    what = this.load(what);
    var files = what[1];
    what = what[0];
  }
  else {
    // TODO only do this if 'what' is a bomber app, also set parent app
    var files = what.files;
  }
  if (!where) {
    this.actions = what;
  }
  else {
    this.actions[where] = what;
  }

  for (var key in files) {
    this.files[key] = files[key];
  }
} 

// one day have an async version of this?
function load(str) {
  if (str.charAt(0) === '.') {
    str = path.join(this.path, str);
  }

  var paths = [str]
    , files = {}
    , index = 0
    ;

  while (paths.length > 0) {
    p = paths.shift()

    var stat = fs.statSync(p);

    if (stat.isFile()) {
      if (path.basename(p).match(/^[^.].*\.js$/)) {
        files[p] = true;
      }
    }
    else if (stat.isDirectory()) {
      var dir = fs.readdirSync(p);
      for(var i = 0; i < dir.length; i++) {
        if (dir[i].match(/^[^.]/)) {
          paths.push(path.join(p,dir[i]));
        }
      }
    }
  }

  var modules = {};

  for (var file in files) {
    // when calculating the parts below we don't want to do it from the absolute
    // location of the file, but relative to what they passed in
    p = path.join(path.dirname(file), path.basename(file, '.js'))
          .replace(str, '')
          .substr(1);

    var parts = p.split('/')
      , cur = modules
      , key
      ;

    while (parts.length > 0) {
      key = parts.shift();

      if (parts.length > 0) {
        cur[key] = cur[key] || {};
        cur = cur[key];
      }
    }

    var module = require(file);

    if (typeof module === 'function') {
      // TODO should this be async?
      module = module(this);
      files[file] = false;
    }
    else {
      // keep track of the mount point for the files...
    }

    // TODO when setting stuff on cur, make sure to check about __pipes, and append, don't overwrite
    if (p === '' || key == 'index') {
      for (var k in module) {
        cur[k] = module[k];
      }
    }
    else {
      cur[key] = module;
    }
  }

  return [modules, files];
}
