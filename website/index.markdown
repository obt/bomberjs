---
layout: page
title: Introducing Bomber
---

Bomber is a node.js web framework inspired by Rails, Django and anything else
out there that has caught our eye.

We just started, so it is pretty bare bones at the moment.

Warning!
--------

Right now the API is very much in a state of flux.  Seeing as how my first post announcing
I was _thinking_ about writing a framework was about two weeks ago, I am still expirementing
with the best way to make Bomber both intuitive and powerful.

I am open to new ideas and feedback, so if you have any thoughts on ways to make Bomber
better of find any bugs, please feel free to [email me](mailto:benjamin@benjaminthomas.org)
or open [an issue on GitHub](http://github.com/obt/bomberjs/issues). 

Relevant Reading
----------------

+ [Blog post announcing the motivation](http://benjaminthomas.org/2009-11-20/designing-a-web-framework.html)
+ [Blog post discussing the design of the routing](http://benjaminthomas.org/2009-11-24/bomber-routing.html)
+ [Blog post discussing the design of the actions](http://benjaminthomas.org/2009-11-29/bomber-actions.html)

Getting the code
----------------

The source code for Bomber is [located on GitHub](http://github.com/bentomas/bomber).  

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

What's Ahead
------------

Right now my two priorities are:

1. Finalizing (at least for now) the API for [actions](/docs/action.html).
2. Getting a comprehensive test suite. I want to make sure it does what I
think it is doing.
