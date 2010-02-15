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
    // third arg is the finish callback
    if( arguments[1] ) {
      return arguments[1].call(this, arguments[3]);
    }
    else {
      return;
    }
  }

  // binding/scope/whatever for the 'next' function
  var self = this,
      finishedCallback = arguments[1],
      stepCallback = arguments[2],
      listeners = (this._listeners ? (this._listeners[arguments[0]] || []) : []),
      index = 0,
      calledListener,
      lastValue;

  var next = function(val) {
    if( continuables.isContinuable(val) ) {
      val(next);
    }
    else if ( val instanceof events.Promise ) {
      val.addCallback(next);
      val.addErrback(next);
    }
    else {
      if( calledListener === true && stepCallback ) {
        // if the last thing called was a listener then we need to call
        // the step callback
        calledListener = false;
        lastValue = val;
        next(stepCallback.call(self, val));
      }
      else {
        if( calledListener === false && stepCallback ) {
          // we need to look at the result. if the step function returns
          // something it is to cancel the chain and finish.
          if( typeof val !== 'undefined' ) {
            return;
          }

          val = lastValue;
          lastValue = undefined;
        }

        if( index < listeners.length ) {
          calledListener = true;
          next(listeners[index++].call(self, val));
        }
        else {
          if( finishedCallback ) {
            finishedCallback.call(self, val);
          }
        }
      }
    }
  };

  next(arguments[3]);
};

exports.makeChainable = function(obj) {
  obj.prototype.listen = listen;
  obj.prototype.emit = emit;
};
