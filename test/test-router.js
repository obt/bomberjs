var sys = require('sys');
var assert = require('assert');

var Router = require('../lib/router').Router;

// Simple routes
var r = new Router();
r.add('/defer', "subApp");
r.add('/:action/:id/:more', { view: 'view_name' });
r.add('/:action/:id', { view: 'view_name' });
r.add('/:action', { view: 'view_name' });
r.add('/', { view: 'view_name', action: 'action_name' });
var tests = [
  [ ['GET', '/'],
    { action: {
        view: 'view_name',
        action: 'action_name'
      },
      params: {
      }
    } ],
  [ ['GET', '/action_name'],
    { action: {
        view: 'view_name',
        action: 'action_name'
      },
      params: {
      }
    } ],
  [ ['GET', '/action_name/1/another'],
    { action: {
        view: 'view_name',
        action: 'action_name'
      },
      params: {
        id: "1",
        more: "another"
      }
    } ],
  [ ['GET', '/action_name/1'],
    { action: {
        view: 'view_name',
        action: 'action_name'
      },
      params: {
        id: "1"
      }
    } ],
  [ ['GET', '/action_name/1/'],
    { action: {
        view: 'view_name',
        action: 'action_name'
      },
      params: {
        id: "1"
      }
    } ],
  [ ['GET', '/defer/more/path'],
    { action: {
        app: 'subApp',
      },
      params: {},
      path: '/more/path'
    } ],
];
runTestsOnRouter(r, tests);

function runTestsOnRouter(router, tests) {
  tests.forEach(function(test) {
      var route = router.findRoute.apply(router, test[0]);
      //sys.p(test[0]);
      assert.deepEqual(test[1], route);
    });
}
