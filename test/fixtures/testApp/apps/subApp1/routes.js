var Router = require('bomberjs/lib/router').Router;

var r = new Router();

r.add('/:view/:action/:id');
r.add('/:view/:action');

exports.router = r;
