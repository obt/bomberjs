---
layout: docs
title: Response
---

A wrapper around the Node's `http.ServerResponse` object. Right now it 
mostly makes sending responses and setting headers easier.

The plan is to add some other niceties like:

+ Setting cookies
+ Setting session variables

Public methods/variables:
---------------

`setHeader(key, value)`
: Pretty simple setter function. Down the line it would be nice to make this
handle setting headers multiple times, and other things discussed in
[this thread from the mailing list](http://groups.google.com/group/nodejs/browse_thread/thread/9f4e8763ccf1fd09#).

`sendHeaders()`
: Sends the headers for this request

`finishOnSend`
: An option for what should happen when the `send()` method is called.  If `true`
(the default), `send()` will call `finish()` when it is done.

`send(str)`
: Very similar to Node's `http.ServerResponse.send` except it will automatically
send the headers first if they haven't already been sent. And unless you have
set `Response.finishOnSend` to `false` for this response it will also call `finish()`

`finish()`
: Closes the connection to the client.
