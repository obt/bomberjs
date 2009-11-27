---
layout: page
title: Introducing Bomber
---

Bomber is a node.js web framework inspired by Rails, Django and anything else
out there that has caught our eye.

We just started, so it is pretty bare bones at the moment.

Relevant Reading
----------------

+ [Blog post announcing the motivation](http://benjaminthomas.org/2009-11-20/designing-a-web-framework.html)
+ [Blog post discussing the design of the routing](http://benjaminthomas.org/2009-11-24/bomber-routing.html)

Getting the code
----------------

[The Bomber source](http://github.com/bentomas/bomber) is located on GitHub.  

To check it out, run the following command:

{% highlight sh %}
git checkout git://github.com/bentomas/bomber.git
{% endhighlight %}


Brief summary
-------------

Bomber is centered around the idea of 'apps'.  Apps are just a bunch of
functionality wrapped up into a folder. 

Here is what an app folder structure could look like:

{% highlight text %}
app-name/
  ./routes.js
  ./views/
    ./view-name.js
{% endhighlight %}

Here is an example `routes.js` file:

{% highlight javascript %}
var Router = require('bomber/lib/router').Router;
var r = new Router();

r.add('/:view/:action/:id');
r.add('/:view/:action');

exports.router = r;
{% endhighlight %}

Here is an example view file:

{% highlight javascript %}
exports.index = function(request, response) {
  return "index action";
};
exports.show = function(request, response) {
  if( request.format == 'json' ) {
    return {a: 1, b: 'two', c: { value: 'three'}};
  }
  else {
    return "show action";
  }
};
{% endhighlight %}
