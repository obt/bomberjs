Bomber is a node.js web framework inspired by Rails, Django and anything else out there that has caught our eye.

Main website and documentation: http://bomber.obtdev.com/

Warning! Right now the API is very much in a state of flux.  We are still experimenting with the best way to make Bomber both intuitive and powerful.  Expect things to change a lot for the forseeable future.

Getting up and running
----------------------

The source code for Bomber is [located on GitHub][bomber-src].  To check it out, run the following command:

    git checkout git://github.com/obt/bomberjs.git

The easiest way to try it out is to `cd` into the example project and run the following command to start the server (assuming you have [Node] installed and in your path):

    cd bomberjs/exampleProject
    ../bomber.js start-server


Brief summary
-------------

Bomber is centered around the idea of 'apps'.  Apps are just a bunch of functionality wrapped up into a folder. 

Here is what an app folder structure could look like:

    app-name/
      ./routes.js
      ./views/
        ./view-name.js

Here is an example `routes.js` file:

    var Router = require('bomber/lib/router').Router;
    var r = new Router();

    r.add('/:view/:action/:id');
    r.add('/:view/:action');

    exports.router = r;

Here is an example view file:

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

Participating
-------------

We are open to new ideas and feedback, so if you have any thoughts on ways to make Bomber better, or find any bugs, please feel free to [participate in the Google Group](http://groups.google.com/group/bomberjs). 

Relevant Reading
----------------

+ [Blog post announcing the motivation](http://benjaminthomas.org/2009-11-20/designing-a-web-framework.html)
+ [Blog post discussing the design of the routing](http://benjaminthomas.org/2009-11-24/bomber-routing.html)
+ [Blog post discussing the design of the actions](http://benjaminthomas.org/2009-11-29/bomber-actions.html)

[bomber-src]: http://github.com/obt/bomberjs
[Node]: http://nodejs.org/

