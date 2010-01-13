exports.createCustomError = function(err_name) {
  var custom_err = function (message, stripPoint) {
      this.message = message;
      Error.captureStackTrace(this, stripPoint);
    }

  custom_err.prototype = {
    __proto__: Error.prototype,
    name: err_name,
    stack: {}
  };

  return custom_err;
};

exports.bind = function(){ 
  var args = Array.prototype.slice.call(arguments);
  var fn = args.shift(); 
  var object = args.shift(); 
  return function(){ 
    return fn.apply(object, 
        args.concat(Array.prototype.slice.call(arguments))); 
  }; 
};
