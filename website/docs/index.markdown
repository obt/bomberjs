---
layout: docs
title: Documentation
---

We just started writing Bomber, so the API is very much in a state of
flux.  Because of this the best documentation is going to be the source
code itself.  I have tried to be diligent about making sure to comment.
So, when in doubt consult the source.

The Documentation consists of the following sub-sections:

Overviews
---------

[bomber.js](/docs/bomber.html)
: `bomber.js` is the script you will use to manage Bomber projects

[App Structure](/docs/apps.html)
: A summary of what files an App can have

API
---

[Action](/docs/action.html)
: Action objects are where you generate your responses.  

[Request](/docs/request.html)
: A wrapper around the node.js `http.ServerRequest` object.  Makes it easier
  to do things like wait for and parse POST data.

[Response](/docs/response.html)
: A wrapper around the node.js `http.ServerResponse` object.  Adds some
  niceties.

[Router](/docs/routing.html)
: A Router is used to turn a URL into an action.

[Server](/docs/server.html)
: The server object is what manages listening for connections, and
  finding and calling the appropriate actions.
