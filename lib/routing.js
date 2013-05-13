var path = require('path');

exports.findRoute = function findRoute(routes, method, path) {
  var route = {};

  for(var i=0; i < routes.length; i++) {
    var r = routes[i];
    if (!r.method || r.method == method) {
      var match = path.match(r.regex);

      // found a match!
      if (match) {
        // loop through all the expected keys and match them to the groups from the match
        var j = 0;
        for(; j < r.keys.length; j++) {
          if( r.keys[j] === '*' ) {
            if (!route.args) {
              route.args = [];
            }
            route.args.push(match[j+1]);
          }
          else {
            if (!route.params) {
              route.params = {};
            }
            route.params[r.keys[j]] = match[j+1];
          }
        }
        for(j++; j < match.length; j++) {
          if (!route.args) {
            route.args = [];
          }
          route.args.push(match[j]);
        }

        route.action = r.action;

        return route;
      }
    }
  }

  return null;
}

exports.load = function load(param) {
  if (typeof param === 'string') {
    return addRoutesFromString.apply(null, arguments);
  }
  else {
    return addRoutesFromArray.apply(null, arguments);
  }
}

function addRoutesFromArray(arr) {
  var routes = [];

  for( var i = 0; i < arr.length; i++) {
    var path = arr[i][0]
      , action = arr[i][1]
      , method = null
      , keys = []
      ;

    if (match = path.match(/^([A-Z]+) /)) { // they specified a method
      method = match[1];
      path = path.substring(method.length + 1);
    }

    if (path.indexOf('~ ') === 0) { // they want to supply their own regexp
      path = new RegExp(path.substring(2));
    }
    else { // we need to create the regexp
      // match from the beginning to the end
      path = '^' + path + '$';
      // escape slashes and periods
      path = path.replace(/(\/|\.)/g, "\\$1");
      // replace all :vars, keeping track of they keys
      path = path.replace(/(:[a-zA-Z_][a-zA-Z0-9_]*|\*)/g, function(match, key) {
          if (key.charAt(0) === ':') {
            keys.push(key.substr(1));
            return "([^\\\/]+)";
          }
          else {
            keys.push('*');
            return "(.+)";
          }
        });
      // turn into regexp
      path = new RegExp(path);
    }

    var action =
      { method: method
      , regex: path
      , keys: keys
      , action: action
      };

    routes.push(action);
  }

  return routes;
}

function addRoutesFromString(str) {
  if (str.charAt(0) === '.') {
    str = path.join(process.cwd(), path.dirname(str), path.basename(str, path.extname(str)));
  }

  try {
    return addRoutesFromArray(require(str));
  }
  catch(err) {
    // TODO throw error, don't exit
    console.log('Cannot load routes from ' + str);
    process.exit();
  }
}
