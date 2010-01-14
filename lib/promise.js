/*
  Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
  Available via Academic Free License >= 2.1 OR the modified BSD license.
  see: http://dojotoolkit.org/license for details

  This is a modified version with no remaining dependencies to dojo.
*/
var hitch = function() {
  var args = Array.prototype.slice.call(arguments);
  var method = args.shift();
  if (method instanceof Function) {
    var scope = null;
  }
  else {
    var scope = method;
    method = args.shift();
  }

  if (scope || args.length > 0) {
    return function() {
        return method.apply(
            scope,
            args.concat(Array.prototype.slice.call(arguments))
            );
      };
  }
  else {
    return method;
  }
};

exports.Promise = function(/*Function?*/ canceller) {
  this.chain = [];
  this.id = this._nextId();
  this.fired = -1;
  this.paused = 0;
  this.results = [null, null];
  this.canceller = canceller;
  this.silentlyCancelled = false;
};

process.mixin(exports.Promise.prototype, {
  _nextId: (function() {
    var n = 1;
    return function() { return n++; };
  })(),

  cancel: function() {
    var err;
    if (this.fired == -1) {
      if (this.canceller) {
        err = this.canceller(this);
      }
      else {
        this.silentlyCancelled = true;
      }
      if (this.fired == -1) {
        if (!(err instanceof Error)) {
          var res = err;
          var msg = "Promise Cancelled";
          if (err && err.toString) {
            msg += ": " + err.toString();
          }
          err = new Error(msg);
          err.cancelResult = res;
        }
        this.errback(err);
      }
    }
    else if ( (this.fired == 0) && 
              ( (this.results[0] instanceof promise.Promise) ||
                (this.results[0] instanceof process.Promise)
              ) ) {
      this.results[0].cancel();
    }
  },
      

  _resback: function(res) {
    // summary:
    //    The private primitive that means either callback or errback
    this.fired = ((res instanceof Error) ? 1 : 0);
    this.results[this.fired] = res;

    this._fire();
  },

  _check: function() {
    if (this.fired != -1) {
      if (!this.silentlyCancelled) {
        throw new Error("already called!");
      }
      this.silentlyCancelled = false;
      return;
    }
  },

  callback: function(arg) {
    //  summary:  
    //    Begin the callback sequence with a non-error value.
    
    /*
    callback or errback should only be called once on a given
    Promise.
    */
    this._check();
    this._resback(arg);
  },

  errback: function(/*Error*/res) {
    //  summary: 
    //    Begin the callback sequence with an error result.
    this._check();
    if (!(res instanceof Error)) {
      res = new Error(res);
    }
    this._resback(res);
  },

  addBoth: function(/*Function|Object*/cb, /*String?*/cbfn) {
    //  summary:
    //    Add the same function as both a callback and an errback as the
    //    next element on the callback sequence.This is useful for code
    //    that you want to guarantee to run, e.g. a finalizer.
    var enclosed = hitch.apply(null, arguments);
    return this.then(enclosed, enclosed);
  },

  addCallback: function(/*Function|Object*/cb, /*String?*/cbfn /*...*/) {
    return this.then(hitch.apply(null, arguments));
  },

  addErrback: function(cb, cbfn) {
    //  summary: 
    //    Add a single callback to the end of the callback sequence.
    return this.then(null, hitch.apply(null, arguments));
  },

  then: function(cb, eb) {
    // summary: 
    //    Add separate callback and errback to the end of the callback
    //    sequence.
    this.chain.push([cb, eb])
    if (this.fired >= 0) {
      this._fire();
    }
    return this;
  },

  _fire: function() {
    // summary: 
    //    Used internally to exhaust the callback sequence when a result
    //    is available.
    var chain = this.chain;
    var fired = this.fired;
    var res = this.results[fired];
    var self = this;
    var cb = null;

    while ( (chain.length > 0) &&
            (this.paused == 0) ) {
      // Array
      var f = chain.shift()[fired];
      
      if (!f) {
        continue;
      }
      var func = function() {
        var ret = f(res);
        //If no response, then use previous response.
        if (typeof ret != "undefined") {
          res = ret;
        }

        fired = ((res instanceof Error) ? 1 : 0);

        if ( (res instanceof exports.Promise) ||
             (res instanceof process.Promise) ) {
          cb = function(res) {
            self._resback(res);
            // inlined from _pause()
            self.paused--;
            if ( (self.paused == 0) && 
                 (self.fired >= 0) ) {
              self._fire();
            }
          }
          // inlined from _unpause
          this.paused++;
        }
      };

      try{
        func.call(this);
      }catch(err) {
        fired = 1;
        res = err;
      }
    }
    if ( chain.length < 1 && fired == 1 && res ) {
      throw res;
    }

    this.fired = fired;
    this.results[fired] = res;
    if ((cb)&&(this.paused)) {
      // this is for "tail recursion" in case the dependent
      // promise is already fired
      if (res instanceof exports.Promise) {
        res.addBoth(cb);
      }
      else {
        res.addCallback(cb);
        res.addErrback(cb);
      }
    }
  }
});
