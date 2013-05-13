var sys = require('sys'),
    path = require('path');

exports.create = function() {
  return {
    _routes: []

    // functions
    , add: router_add
    , findRoute: router_findRoute
  }
};

function router_add(path, params_or_subApp, method) {
  if( typeof params_or_subApp != 'undefined' &&
      params_or_subApp !== null &&
      params_or_subApp.constructor == String ) {
      // it must be the name of a sub app
    var subApp = params_or_subApp;
    var params = {};
  }
  else {
    var subApp = null;
    var params = params_or_subApp || {};
  }

  if( !(path instanceof RegExp) ) {
    path = '^' + path;
    
    //if this doesn't route to a subapp then we want to match the whole path
    //so add end of line characters.
    if( subApp === null ) {
      if( path.lastIndexOf('/') != (path.length-1) ) {
        path = path + '/?';
      }
      path = path + '$';
    }
    path = _regExpEscape(path);
    var keys = [];
    path = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, function(str, p1) {
        keys.push(p1);

        if( params[p1] ) {
          //Idea: require that params[p1] be a regex in order to do this?
          return _regExpEscape('('+params[p1]+')');
        }
        else {
          return "([^\\\/.]+)";
        }
      });
    path = new RegExp(path);
  }
  
  var r = {
    method: method,
    regex: path,
    keys: keys,
    params: params,
    subApp: subApp
  };

  this._routes.push(r);
}

router_findRoute = function(method, path_or_route) {
  var numRoutes = this._routes.length;

  if( path_or_route.constructor == String ) { // it is a path
    var path = path_or_route;
    var route = {
      action: {},
      params: {},
    };
  }
  else {  // it is a route object
    var route = path_or_route;
    var path = route.path;
    delete route.path;
  }

  for(var i=0; i<numRoutes; i++) {
    //sys.puts(path + ' == ' + this._routes[i].regex);

    if(!this._routes[i].method || this._routes[i].method == method) {
      var match = path.match(this._routes[i].regex);
      if(match) {
        for(var j=0; j<this._routes[i].keys.length; j++) {
          var key = this._routes[i].keys[j];
          if( key == 'app' || key == 'controller' || key == 'method' ) {
            route.action[key] = match[j+1];
          }
          else {
            route.params[key] = match[j+1];
          }
        }
        if( this._routes[i].subApp === null ) {
          // grab any extra arguments and put them in an 'args' variable
          if(j < (match.length-1)) {
            route.params.args = [];
            for(; j < (match.length-1); j++) {
              route.params.args.push(match[j+1]);
            }
          }
          for(var key in this._routes[i].params) {
            if( this._routes[i].keys.indexOf(key) >= 0 ) {
              continue;
            }
            if( key == 'app' || key == 'controller' || key == 'method' ) {
              route.action[key] = this._routes[i].params[key];
            }
            else {
              route.params[key] = this._routes[i].params[key];
            }
          }
        }
        else {
          if( !('app' in route.action) ) {
            route.action.app = this._routes[i].subApp;
          }
          route.path = path.substr(match[0].length);
        }

        return route;
      }
    }
  }

  return null;
};

_regExpEscape = function(str) {
  return str.replace(/(\/|\.)/g, "\\$1");
};

