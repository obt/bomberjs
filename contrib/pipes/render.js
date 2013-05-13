var templateCache = {};

// TODO handle collections in here

module.exports = function render(options) {
  // options
  // -------
  // cache: true|false
  // default: <ext>
  // engines: { extension1: engine, extension2: engine }
  // action: what action to ask for templates from

  options.default = options.default || Object.keys(options.engines)[0];

  // return the "pipe"
  return function(action, c) {
    var actionName = this.actionName;

    // TODO check for a template_prefix on the action, in case there is an
    // optional template prefix (rendering into the sidebar)

    action.render = function() {
      callback = arguments[arguments.length-1];
      data = arguments[arguments.length-2];
      name = arguments[arguments.length-3] || actionName;

      if (options.default && name.search(/\/[^.]+\..+/) < 0) {
        name = name + options.default;
      }

      // TODO ask parent render about this
      parentRenderCallback();

      function parentRenderCallback(err, str) {
        if (str) {
          // the parent rendered it just fine, so return that
          return callback(null, str);
        }
        else if (name in templateCache) {
          if (typeof templateCache[name] === 'string') {
            foundTemplate(name, templateCache[name]);
          }
          else {
            // the file doesn't exist, move onto the next
            callback(new Error('cannot find template, '+name));
          }
        }
        else {
          action(options.action, { file: name }, readFileCallback);
        }
      }

      function readFileCallback(err, contents) {
        if (err) {
          templateCache[name] == null;
          callback(new Error('cannot find template, '+name));
        }
        else {
          contents = contents.toString();
          if (options.cache) {
            templateCache[name] = contents;
          }
          foundTemplate(contents);
        }
      }

      function foundTemplate(template) {
        console.log('rendering ' + name);

        var ext = name.substr(name.lastIndexOf('.'));
        var engine = options.engines[ext];

        if (!engine) {
          // TODO try and require it...
          callback(new Error('cannot find engine for ' + ext));
        }

        engine(template, data, undefined, callback);
      }
    }

    this.next();
  }
}
