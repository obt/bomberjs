/* The job of the router is to turn a url into a set of request parameters
 *
 * It does this by analyzing 'routes' that have been added to it.
 */

var sys = require('sys');

var Router = function() {
  this.routes = [];
};

Router.prototype.add = function() {
  var regex = arguments[0];
  if( !(regex instanceof RegExp) ) {
    if(regex.lastIndexOf('/') != (regex.length-1) ) {
      regex = regex + '/?';
    }
    regex = regex.replace(/(\/|\.)/g, "\\$1");
    var keys = [];
    regex = regex.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, function(str, p1) {
        keys.push(p1);
        return "([^\\\/.]+)";
      });
    regex = new RegExp("^" + regex + "$");
  }
  
  var r = {
    method: null,
    regex: regex,
    params: arguments[1],
    keys: keys,
  };

  this.routes.push(r);
};

Router.prototype.findRoute = function(currApp, method, path) {
  var numRoutes = this.routes.length;

  for(var i=0; i<numRoutes; i++) {
    //sys.puts(path + ' == ' + this.routes[i].regex);

    if(!this.routes[i].method || this.routes[i].method == method) {
      var match = path.match(this.routes[i].regex);
      if(match) {
        var route = {
          action: {},
          params: {},
          args: []
        };
        for(var j=0; j<this.routes[i].keys.length; j++) {
          var key = this.routes[i].keys[j];
          if( key == 'app' || key == 'view' || key == 'action' ) {
            route.action[key] = match[j+1];
          }
          else {
            route.params[key] = match[j+1];
          }
        }
        for(; j < (match.length-1); j++) {
          route.args.push(match[j+1]);
        }
        for(var key in this.routes[i].params) {
          if( key == 'app' || key == 'view' || key == 'action' ) {
            route.action[key] = this.routes[i].params[key];
          }
          else {
            route.params[key] = this.routes[i].params[key];
          }
        }

        if( !route.action.app ) {
          route.action.app = currApp.key;
        }
        return route;
      }
    }
  }

  return null;
};

exports.Router = Router;
