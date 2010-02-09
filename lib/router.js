var sys = require('sys'),
    path = require('path');

/* Router()
 *
 * The job of the router is to turn a url into a set of request parameters
 *
 * It does this by analyzing 'routes' that have been added to it.
 */
var Router = exports.Router = function() {
  this._routes = [];
};

/* Router.regExpEscape(str)
 *
 * A function for escaping a string for turning it into a regular expression
 *
 * Parameters:
 *
 * + `str`: `String`. The string to escape for using in a regualr expression.
 *
 * Returns: 
 *
 * An escaped string.
 */
Router.regExpEscape = function(str) {
  return str.replace(/(\/|\.)/g, "\\$1");
};

/* Router.prototype.add(path, params_or_subApp)
 *
 * This adds a route to this particular Router.
 * 
 * At its simplest a route is an object that has  a) a regular expression to
 * match against a url and b) a set of instructions for what to do when a 
 * match is found.
 *
 * Parameters:
 *
 * + `path`: `String` or `Regexp`.  If it is a `RegExp` then nothing is changed.
 *   If it is a `String` the string is converted to a regular expression.
 * + `params_or_subApp`: `Object` or `String`.  If it is an `Object` then the
 *   object is used to add constraints to the path, or used to fill in blanks
 *   like app, view or action name.  If it is a `String` then it should be the
 *   name of a subApp that should handle the rest of the URL not matched.
 */
Router.prototype.add = function(path, params_or_subApp) {
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

  this._routes.push(r);
};


/* Router.prototype.addFolder(params)
 *
 * Add a route to server flat files in a folder. Defaults to serving content
 * ./app/resources/ from /resources/.
 *
 * Syntax:
 *   var r = new Router();
 *   r.addFolder();
 *   r.addFolder({path:'/photos/'});
 *   r.addFolder({path:'/custom/', folder:'custom'});
 */
Router.prototype.addFolder = function(params) {
  // Prepare parameter defaults
  params = params || {};
  if ( !('path' in params) ) params.path = '/resources/';
  if ( !('folder' in params) ) params.folder = './resources/';

  // And append the route
  var router = this;
  var addFolderAction = function(request, response) {
    // Make sure there's not access to the parent folder
    if( request.params.filename.indexOf('..') >= 0 || request.params.filename.indexOf('./') >= 0 ) {
      return new response.build.forbidden();
    }

    // Resolve file
    var filename = path.join(request.params.folder, request.params.filename);
    if( request.params.folder.indexOf('/') !== 0 ) {
      filename = path.join(path.dirname(router.path), filename);
    }

    // Check that file exists and return
    var p = new process.Promise();
    response.sendFile(filename)
      .addErrback(function(err) {
        if( err.message == "No such file or directory" ) {
          p.emitSuccess( new response.build.notFound() );
        }
        else if( err.message == "Permission denied" ) {
          p.emitSuccess( new response.build.forbidden() );
        }
        return err;
      })
      .addCallback(function() {
        p.emitSuccess();
      });
    return p;
  };

  this.add(params.path + ':filename', {folder: params.folder, filename :'[^\\\\]+', action: addFolderAction});
};

/* Router.prototype.findRoute
 *
 * Searches through the list of routes that have been added to this router
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
          if( key == 'app' || key == 'view' || key == 'action' ) {
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
            if( key == 'app' || key == 'view' || key == 'action' ) {
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
