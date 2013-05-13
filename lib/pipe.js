
module.exports = function pipe(obj, actions, func) {
  if (typeof func === 'undefined') {
    func = actions;
    actions = null;
  }

  if (!obj['|||']) {
    obj['|||'] = [];
  }

  // TODO allow you to specify certain actions, or NOT certain actions...
  obj['|||'].push([actions, func]);
}
