var Router = require('bomberjs/apps/http/lib/router').Router;

var r = exports.router = new Router();

// serve files in ./resources
r.addFolder();

// specific routes
r.add('/', { view: 'simple', action: 'index' });
r.add('/env', { view: 'simple', action: 'env' });
r.add('/section/:id', { view: 'simple', action: 'show', id: '[0-9]+' })

// default catch all routes
r.add('/:view/:action/:id');
r.add('/:view/:action');

