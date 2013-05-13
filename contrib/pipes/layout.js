// TODO don't do this here, do this based on the extension
var handelbars = require('handlebars');

module.exports = layout;

function layout(file, structure) {
  if (typeof structure === 'undefined') {
    structure = file;
    file = undefined;
  }
  if (typeof file === 'undefined') {
    file = 'layouts/default.hbs';
  }
  if (typeof structure === 'undefined') {
    structure = { main: null };
  }

  return function(action, callback) {
    function layoutCallback(err, data) {
      if (err) {
        callback(err);
      }
      else {
        var ctx = {}
          , load = {}
          , render = {}
          , numToRender = 0
          , numToLoad = 0
          ;

        for (var key in data) {
          ctx[key] = data[key];
        }
        for (var key in structure) {
          if (data[key]) {
            // do nothing, we already took care of it
          }
          else if (typeof structure[key] === 'string') {
            ctx[key] = data[key];
          }
          else if(structure[key]) {
            if (structure[key] instanceof LayoutAction) {
              load[key] = structure[key];
              numToLoad++;
            }
            if (structure[key] instanceof LayoutTemplate) {
              render[key] = structure[key];
              numToRender++;
            }
          }
        }

        if (numToLoad > 0) {
          for (var key in load) {
            (function(key) {
              action(load[key].str, function(err, data) {
                numToLoad--;
                if (err) {
                  ctx[key] = err.message;
                }
                else {
                  ctx[key] = data;
                }

                if (numToLoad === 0) {
                  allLoaded();
                }
              });
            })(key);
          }
        }
        else {
          allLoaded();
        }

        function allLoaded() {
          if (numToRender > 0) {
            for (var key in render) {
              (function(key) {
                action.render(render[key].str, ctx, function(err, data) {
                  numToRender--;
                  if (err) {
                    ctx[key] = err.message;
                  }
                  else {
                    ctx[key] = data;
                  }

                  if (numToRender === 0) {
                    allRendered();
                  }
                });
              })(key);
            }
          }
          else {
            allRendered();
          }
        }

        function allRendered() {
          action.render(file, ctx, callback);
        }
      }
    }

    this.next(layoutCallback);
  }
}

function LayoutAction(str) { this.str = str; }
layout.action = function(actionName) { return new LayoutAction(actionName); }

function LayoutTemplate(str) { this.str = str; }
layout.template = function(template) { return new LayoutTemplate(template); }
