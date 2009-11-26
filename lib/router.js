/* The job of the router is to turn a url into a set of request parameters
 *
 * It does this by analyzing 'routes' that have been added to it.
 */

var sys = require('sys');

var Router = function() {
  this.routes = [];
};

/* A function for escaping a string, for turning it into a regular expression
 */
Router.regExpEscape = function(str) {
  return str.replace(/(\/|\.)/g, "\\$1");
};

Router.prototype.add = function() {
  var path = arguments[0];
  var params = arguments[1] || {};

  if( !(path instanceof RegExp) ) {
    if(path.lastIndexOf('/') != (path.length-1) ) {
      path = path + '/?';
    }
    path = Router.regExpEscape(path);
    var keys = [];
    path = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, function(str, p1) {
        keys.push(p1);

        if( params[p1] ) {
          return Router.regExpEscape('('+params[p1]+')');
        }
        else {
          return "([^\\\/.]+)";
        }
      });
    path = new RegExp("^" + path + "$");
  }
  
  var r = {
    method: null,
    regex: path,
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

        // WE HAVE A MATCH!

        var route = {
          action: {},
          params: {},
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
        if(j < (match.length-1)) {
          route.params.args = [];
        }
        for(; j < (match.length-1); j++) {
          route.params.args.push(match[j+1]);
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
