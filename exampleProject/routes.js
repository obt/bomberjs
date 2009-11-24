var Router = require('bomber/lib/router').Router;

var r = new Router();

r.add('/', { view: 'simple', action: 'index' });
r.add('/section', { view: 'simple', action: 'section' }) // will return a 500 error as the view doesn't exist
r.add('/section/:id.:format', { view: 'simple', action: 'show' })
r.add('/section/:id', { view: 'simple', action: 'show' })
r.add('/:view/:action/:id', { view: 'view_name', action: 'action_name' });

exports.router = r;
