---
layout: docs
title: bomber.js
---

`bomber.js` is a shell script that is used to manage your Bomber projects.

Right now all it can do is start a Bomber [Server](/docs/server.html).

It takes one optional argument, the name or the path of a Bomber app.  This argument is
used by the Node `require` command, so [read up on how that works](http://nodejs.org/api.html#_modules)
to make sure Bomber will be able to find your app. If the argument isn't supplied it
uses the current directory.

Examples
--------

{% highlight sh %}
./bomber.js server
{% endhighlight %}

{% highlight sh %}
./bomber.js --app ./exampleProject server
{% endhighlight %}
