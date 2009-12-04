---
layout: docs
title: Action
---

**Note:** I am in the process of discussing some API changes to Actions so check
back here in a week or so to see if things have changed!

Action objects are instantiated for each request to the server.  Their main
goal is making it easy to do asynchronous calls.  Really what they boil 
down to _at this point_ is a glorified [Deferred](http://api.dojotoolkit.org/jsdoc/1.3.2/dojo.Deferred)
with less functionallity.

I recommend reading [this blog post](http://benjaminthomas.org/2009-11-29/bomber-actions.html) 
for the details of their current design.

At their simplest, Actions run a series of tasks. A task is just a function. All
tasks receive two parameters, a [request](/docs/request.html) and a
[response](/docs/response.html).  Additionally, they receive the return value of
the last task.

However, if the result of a task is a [Node Promise](http://nodejs.org/api.html#_tt_process_promise_tt),
the action will add the next task as a callback to the promise. 

An `Action` guarantees that all tasks are bound to it.  This makes keeping track
of state across tasks easy, just set a variable on the `this` object.

When all tasks have been run, one of two things happens:

1.  If there have been no callbacks added to the action, it looks at the return
result of the last task that was ran. 
  
    If it is a `String` the action assumes it is HTML and sends the string as
    the response to the client with a content type of 'text/html'.

    If it is any other object, the action converts it to JSON and sends the JSON
    string as a response to the client with a content type of 'text/json'. (I
    know this is incorrect and I guess I'll change it, but 'text/json' make so
    much more sense than 'application/json'!)

    If it is `null` it does nothing.  This allows you to manipulate the Node
    `http.ServerResponse` object itself for comet style applications or streaming
    things to and from the client.

2.  If a callback has been added to the action, Bomber assumes you want to 
actually _do something_ with the result from this action, so it sends nothing
to the client and instead passes the result to the callback.

Public methods:

`addTask(function)`
: Add a function to the end of the list of tasks to run.

`insertTask(function)`
: Add a function to the list of tasks to be run _after_ the current task.

`bindTo(function)`
: Bind a function to this action.  Also used internally to make sure
all tasks act on this action.

`addCallback(function)`
: Add a function that should be run after all the tasks have completed. Is
passed the return value of the last task. 
