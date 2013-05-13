// with mixins we always mix to the left, meaning the object that is returned
// is the left most object passed in

// in mixLeft the properties of the left most object takes precedent over the 
// properties in the right objects
exports.mixLeft = function() {
  var left = arguments[0];

  for( var index = 1; index < arguments.length; index++) {
    right = arguments[index];
    if (!right) {
      break;
    }

    for(var k in right) {
      // we only copy a value over in "mixLeft" if the left side doesn't have it
      if( !left.hasOwnProperty(k) && right.hasOwnProperty(k) ) {
        if (right[k] && typeof right[k] === "object") {
          exports.mixLeft(left[k], right[k]);
        }
        else {
          left[k] = right[k];
        }
      }
    }
  }

  return left;
};

// in mixRigth the properties of the left most object are overriden by the 
// properties in the right objects
exports.mixRight = function() {
  var left = arguments[0];

  for( var index = 1; index < arguments.length; index++) {
    right = arguments[index];
    if (!right) {
      break;
    }

    for(var k in right) {
      // we only copy a value over in "mixLeft" if the left side doesn't have it
      if( right.hasOwnProperty(k) ) {
        if (right[k] && typeof right[k] === "object") {
          exports.mixRight(left[k], right[k]);
        }
        else {
          left[k] = right[k];
        }
      }
    }
  }

  return left;
};
