var path = require('path');

exports.performAction = performAction;

function performAction(actionName, actionContext, callback) {
  // actionContext is optional
  if (typeof callback === 'undefined') {
    callback = actionContext;
    actionContext = undefined;
  }
  // but make sure actionContext is an object
  if (typeof actionContext === 'undefined' || actionContext === null) {
    actionContext = {};
  }

  // scope
  var app = this;

  actionName = path.normalize(actionName);
  var parts = findAction(this, actionName);
  if (!parts) {
    return callback(new Error("Cannot find bomber action " + actionName));
  }
  
  function perform(an, ac, cb) {
    // an=actionName, ac=actionContext, cb=callback (don't want to overwrite the
    // outer scope)

    if (typeof cb === 'undefined') {
      // ac is optional
      cb = ac;
      ac = undefined;
    }

    if (typeof ac === 'undefined') {
      // if you don't pass in a context to this, we use the previous one
      ac = perform;
    }

    if (an.substr(0,1) !== '/') {
      // if relative name, make absolute
      an = path.join(path.dirname(actionName || ''), an);
    }

    // grab the last app (the one this action belongs to) and perform the action
    app.performAction(an, ac, cb);
  }

  // copy the actioncontext properties into the perform function
  for (var key in actionContext) {
    perform[key] = actionContext[key];
  }

  var pipeSelf =
    { actionName: actionName
    , next: function (newCtx, newCallback) {
        if(typeof newCallback === 'undefined') {
          newCallback = newCtx;
          newCtx = undefined;
        }
        if (typeof newCtx !== 'undefined') { perform = newCtx; }
        if (typeof newCallback !== 'undefined') { callback = newCallback; } 

        if (parts.length === 1) { pipeSelf = null; }

        var part = parts.shift();
        part.apply(pipeSelf, part.length === 1 ? [callback] : [perform, callback]);
      }
    };

  try {
    pipeSelf.next();
  }
  catch(e) {
    callback(e);
  }
}

function findAction(app, name) {
  var keys = name.split('/')
    , current = app.actions
    , parts = []
    ;

  for(var i = 0; i < keys.length; i++) {
    if (keys[i] == '') { continue; }

    if (current['|||']) {
      for (var j = 0; j < current['|||'].length; j++) {
        var p = current['|||'][j];
        if (p[0] === null || p[0].indexOf(keys[i]) >= 0) {
          parts.push(p[1]);
        }
      }
    }

    current = current[keys[i]];

    if (!current) { break; }
  }

  if (typeof current !== 'function') {
    // TODO check if it is an app
    // didn't find an action, just an object
    return null;
  }

  parts.push(current);

  return parts;
}
