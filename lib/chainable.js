var events = require('events'),
    promise = require('../bundled/promise/promise');

var listen = function(event_name, func) {
  if( typeof this._listeners === 'undefined' ) {
    this._listeners = {};
  }
  if( typeof this._listeners[event_name] === 'undefined' ) {
    this._listeners[event_name] = [];
  }

  this._listeners[event_name].push(func);
};

var emit = function() {
  // if there are no listeners, then just call the finish callback
  if(    typeof this._listeners === 'undefined'
    || typeof this._listeners[arguments[0]] === 'undefined') {
    if( arguments[1] ) {
      return arguments[1].call(this, arguments[3]);
    }
    else {
      return;
    }
  }

  var self = this,
      finishedCallback = arguments[1],
      stepCallback = arguments[2],
      listeners = (this._listeners ? (this._listeners[arguments[0]] || []) : []),
      index = 0;

  var numArgs = arguments.length - 3;

  var next = function(arg) {
    if( index >= listeners.length ) {
      if( finishedCallback ) {
        return finishedCallback.call(self, arg);
      }
    }
    else {
      if( stepCallback ) {
        var after = function(returned) {
          stepCallback.call(self, returned, arg, next);
        };
      }
      else {
        var after = next;
      }
      promise.when(listeners[index++].call(self, arg), after, after);
    }
  };

  next(arguments[3]);
};

exports.makeChainable = function(obj) {
  obj.prototype.listen = listen;
  obj.prototype.emit = emit;
};
