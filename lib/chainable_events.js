var sys = require('sys');

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
  var args = Array.prototype.slice.call(arguments,3);

  // if there are no listeners, then just call the finish callback
  if(    typeof this._listeners === 'undefined'
      || typeof this._listeners[arguments[0]] === 'undefined' ) {
    // second arg is the finish callback
    return arguments[1].apply(this, args);
  }

  // binding/scope/whatever for the callNextPiece function
  var self = this,
      onFinish = arguments[1], // second arg is the finish callback
      onCancel = arguments[2], // third argument is the cancel callback
      pieces = this._listeners[arguments[0]],
      pieceIndex = 0;

  var callNextPiece = function(val) {
    // a link in the chain returned something, so cancel chain
    if( typeof val !== 'undefined' ) {
      // remove callNextPiece from beginning of args array
      args.shift();
      // add the returned value to the beginning of the args array
      args.unshift(val);
      var func = onCancel;
    }
    else if( pieceIndex >= pieces.length ) {
      // remove callNextPiece from beginning of args array
      args.shift();
      var func = onFinish;
    }
    else {
      var func = pieces[pieceIndex];
      pieceIndex++;
    }
    func.apply(self, args);
  };

  // add callNextPiece to the beginning of the args array, so the listeners can
  // grab it easily
  args.unshift(callNextPiece);

  // start the listener chain
  callNextPiece();
};

exports.makeChainable = function(obj) {
  obj.prototype.listen = listen;
  obj.prototype.emit = emit;
};
