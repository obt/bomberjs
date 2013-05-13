
exports.makeEmitter = function(obj) {
  obj.listeners = {};
  obj.listen = _listen;
  obj.chain = _chain;
}

function _listen(eventName, func) {
  this.chain('newListener', func, function(f) {
      if( typeof this.listeners[eventName] === 'undefined' ) {
        this.listeners[eventName] = [];
      }

      this.listeners[eventName].push(f);
    });
}

// args: eventName, [arg1, arg2, arg3], callback
function _chain() {
  // parameters
  var args = Array.prototype.slice.call(arguments, 0)
    , eventName = args.shift()
    , callback = args.pop()
    ;

  // scope
  var queue = this.listeners[eventName]
    , index = 0
    , obj = this
    ;

  // the first argument is reserved for whether or not there is
  // an error, but at first there is no error
  args.unshift(null);

  // start the chain
  next.apply(null, args);

  function next() {
    if( !queue || index > queue.length ) {
      // either there are no listeners or
      // we've gone through all the listeners,
      // finish the chain
      return callback.apply(obj, arguments);
    }

    var l = queue[index++]
      , args = Array.prototype.slice.call(arguments, 0)
      ;

    args.push(next);

    try {
      l.apply(obj, args);
    }
    catch(err) {
      next(err);
    }
  }
}
