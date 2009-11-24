// taken from node.js source
exports.path = {
  join: function() {
    var joined = "";
    for (var i = 0; i < arguments.length; i++) {
      var part = arguments[i].toString();

      /* Some logic to shorten paths */
      if (part === ".") {
        continue;
      }
      while (/^\.\//.exec(part)) part = part.replace(/^\.\//, "");

      if (i === 0) {
        part = part.replace(/\/*$/, "/");
      }
      else if (i === arguments.length - 1) {
        part = part.replace(/^\/*/, "");
      }
      else {
        part = part.replace(/^\/*/, "").replace(/\/*$/, "/");
      }

      joined += part;
    }
    return joined;
  },
  filename: function(path) {
    var parts = path.split("/");
    return parts[parts.length-1];
  },
  base: function(path) {
    var parts = path.split("/");
    return parts.slice(0,parts.length-1).join('/');
  }
};
