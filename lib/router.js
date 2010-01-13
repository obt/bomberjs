/* The job of the router is to turn a url into a set of request parameters
 *
 * It does this by analyzing 'routes' that have been added to it.
 */

var Router = function() {
  this.routes = [];
};

/* A function for escaping a string for turning it into a regular expression
 */
Router.regExpEscape = function(str) {
  return str.replace(/(\/|\.)/g, "\\$1");
};

Router.prototype.add = function(path, params_or_subApp) {
  var path = path;

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
    if( subApp === null ) {
      if( path.lastIndexOf('/') != (path.length-1) ) {
        path = path + '/?';
      }
      path = path + '$';
    }
    path = Router.regExpEscape(path);
    var keys = [];
    path = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, function(str, p1) {
        keys.push(p1);

        if( params[p1] ) {
          //TODO, require that params[p1] be a regex in order to do this?
          return Router.regExpEscape('('+params[p1]+')');
        }
        else {
          return "([^\\\/.]+)";
        }
      });
    path = new RegExp(path);
  }
  
  var r = {
    method: null,
    regex: path,
    keys: keys,
    params: params,
    subApp: subApp
  };

  this.routes.push(r);
};

/* Searches through the list of routes that have been added to this router
 * and checks them against the passed in path_or_route.
 *
 * if path_or_route is
 *   a string it is a path,
 *   otherwise it is a route.
 *
 * It can take either because findRoute can sometimes return partial routes.
 * i.e. routes that have matched a part of the path but have to be passed along
 * to other apps for more processing. 
 *
 * Partial routes are distinguished from regular routes by the existence of 
 * a path key.  For example:
 * { 
 *   path: "/rest/of/path",
 *   action: { app: "subApp" }
 * }
 */
Router.prototype.findRoute = function(method, path_or_route) {
  //TODO: configuration settings for ?
  //  .html, .json, .xml format indicators
  //  whether or not the end slash is allowed, disallowed or optional

  var numRoutes = this.routes.length;

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
    //sys.puts(path + ' == ' + this.routes[i].regex);

    if(!this.routes[i].method || this.routes[i].method == method) {
      var match = path.match(this.routes[i].regex);
      if(match) {
        for(var j=0; j<this.routes[i].keys.length; j++) {
          var key = this.routes[i].keys[j];
          if( key == 'app' || key == 'view' || key == 'action' ) {
            route.action[key] = match[j+1];
          }
          else {
            route.params[key] = match[j+1];
          }
        }
        if( this.routes[i].subApp === null ) {
          // grab any extra arguments and put them in an 'args' variable
          if(j < (match.length-1)) {
            route.params.args = [];
            for(; j < (match.length-1); j++) {
              route.params.args.push(match[j+1]);
            }
          }
          for(var key in this.routes[i].params) {
            if( this.routes[i].keys.indexOf(key) >= 0 ) {
              continue;
            }
            if( key == 'app' || key == 'view' || key == 'action' ) {
              route.action[key] = this.routes[i].params[key];
            }
            else {
              route.params[key] = this.routes[i].params[key];
            }
          }
        }
        else {
          if( !('app' in route.action) ) {
            route.action.app = this.routes[i].subApp;
          }
          route.path = path.substr(match[0].length);
        }

        return route;
      }
    }
  }

  return null;
};

exports.Router = Router;
