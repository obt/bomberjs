var sys = require('sys'),
    events = require('events'),
    continuables = require('continuables');

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
      return arguments[1].apply(this, Array.prototype.slice.call(arguments, 3));
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

  var next = function() {
    var args = Array.prototype.slice.call(arguments, 0);

    if( index >= listeners.length ) {
      if( finishedCallback ) {
        return finishedCallback.apply(self, args);
      }
    }
    else {
      if( stepCallback ) {
        args.push(function() {
            stepCallback.call(self, Array.prototype.slice.call(arguments, 0), args, next);
          });
      }
      else {
        args.push(next);
      }
      listeners[index++].apply(self, args);
    }
  };

  next.apply(null, Array.prototype.slice.call(arguments, 3));
};

exports.makeChainable = function(obj) {
  obj.prototype.listen = listen;
  obj.prototype.emit = emit;
};
