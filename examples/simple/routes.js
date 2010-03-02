var Router = require('bomberjs/apps/http/lib/router').Router;

var r = new Router();

r.add('/', { view: 'simple', action: 'index' });
r.add('/env', { view: 'simple', action: 'env' });

// will return a 500 error as the view doesn't exist
r.add('/section', { view: 'simple', action: 'section' }) 

r.add('/section/:id', { view: 'simple', action: 'show', id: '[0-9]+' })

r.addFolder();
r.addFolder({path:'/photos/'});

// default catch all routes
r.add('/:view/:action/:id');
r.add('/:view/:action');

exports.router = r;
