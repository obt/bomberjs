var Router = require('bomber/lib/router').Router;

var r = new Router();

r.add('/', { view: 'simple', action: 'index' });

// will return a 500 error as the view doesn't exist
r.add('/section', { view: 'simple', action: 'section' }) 

r.add('/section/:id', { view: 'simple', action: 'show', id: '[0-9]+' })

// default catch all routes
r.add('/:view/:action/:id');
r.add('/:view/:action');

exports.router = r;
