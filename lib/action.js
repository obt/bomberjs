/* This is the bulk of the Bomber magic for making async
 * javascript easier for creating full pages.  Basically, you divide
 * up what you need to do into 'tasks' and it then runs the tasks
 * one after another, taking care of binding and handling promise
 * objects (ie waiting for other async tasks to be done).
 *
 * Each task will always be called with the request and the response
 * object for this action, so that you can access/set the cookies and 
 * session variables. 
 */
var sys = require('sys');

var Action = function(req, res) {
  this._request = req;
  this._response = res;

  this._tasks = [];
  if( arguments.length > 2 ) {
    this._tasks = this._tasks.concat(Array.prototype.slice.call(arguments,2));
  }

  this._promise = null;
};

/* Pretty self explainatory. */
Action.prototype.addTask = function(func) {
  this._tasks.push(func);
};

/* This adds a new task to this action, but immediately after the 
 * task currently being run.
 */
Action.prototype.insertTask = function(func) {
  this._tasks.unshift(func);
};

/* Just in case you want to bind a function to this action.  Action 
 * actually uses this when it adds callbacks to Promises.
 */
Action.prototype.bindTo = function() {
  var self = this;
  var args = Array.prototype.slice.call(arguments);
  var func = args.shift();
  return function() {
    return func.apply(self,args.concat(Array.prototype.slice.call(arguments)));
  };
};

/* Pretty self-explanatory. Start processing this action
 *
 * TODO: think about removing this function, and instead calling
 * _runNextTask with a setTimeout, so that this feels even more
 * like a promise.  The drawback to this, is that it would weight
 * for a certain amount of time before it ran.  Time that it wouldn't
 * necessarily have to do.
 */
Action.prototype.start = function() {
  this._runNextTask();
};

/* Make the action act like a Promise. So, you can add callbacks and wait 
 * for it to finish. */
Action.prototype.addCallback = function(func) {
  if(!this._promise) {
    this._promise = new process.Promise();
  }

  this._promise.addCallback(func);
};

/* Should be called when a task is completed, with the result of the previous
 * task
 *
 * Can take the following arguments:
 *            nothing: then, call the next task
 * http-status-object: then don't call the next task.
 *                     update the response, send it and return
            a promise: add this function as the callback to the promise and return
 *      anything else: call the next task with any arguments passed in
 *
 */
Action.prototype._runNextTask = function() {
  // the last task returned a promise, we want to run the next task
  // when the promise completes.  so we add this function  as a
  // callback to the promise, but bind it to this action
  if(arguments.length == 1 && arguments[0] instanceof process.Promise) {
    arguments[0].addCallback(this.bindTo(this._runNextTask, this._request, this._response));
    return;
  }

  /* Redirect, 404, 500
  else if(arguments.length == 1 && arguments[0] instanceof HTTPStatusRepose) {
  // update the response, send it, and return
  }
  */

  // if there are no more tasks, then we are done, complete the view
  if( this._tasks.length < 1 ) {
    this._completed.apply(this, arguments);
  }

  // otherwise run the next task, passing in any arguments
  var args = [this._request, this._response].concat(Array.prototype.slice.call(arguments));
  this._runNextTask(this._tasks.shift().apply(this, args));
};

/* can only take ONE argument
 *
 * basically, this is the result of the view, so it should return whatever
 * it 'made'
 */
Action.prototype._completed = function(something) {
  if( typeof something == "undefined" ) {
    //do nothing.
  }
  /*
  else if(something instanceof Redirect, 404, 500, etc) {
    // make the appropriate changes to the response
  }
  */
  else {
    //if we have a callback, do that, with the something,
    if(this._promise) {
      this._promise.emitSuccess(something);
      return;
    }

    //otherwise send a response to the client
    if(something.constructor == String) { // return text/html response
      this._response.setHeader('Content-Type', 'text/html');
      this._response.send(something);
    }
    else { // return a json representation of the passed in object
      this._response.setHeader('Content-Type', 'text/json');
      this._response.send(sys.inspect(something));
    }
  }
};

exports.Action = Action;
