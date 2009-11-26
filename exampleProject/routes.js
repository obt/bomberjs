var Router = require('bomber/lib/router').Router;

var r = new Router();

r.add('/', { view: 'simple', action: 'index' });

// will return a 500 error as the view doesn't exist
r.add('/section', { view: 'simple', action: 'section' }) 

r.add('/section/:id.:format', { view: 'simple', action: 'show' })
r.add('/section/:id', { view: 'simple', action: 'show', format: 'html' })

// default catch all routes
r.add('/:view/:action/:id.:format');
r.add('/:view/:action/:id');
r.add('/:view/:action.:format');
r.add('/:view/:action');

exports.router = r;
