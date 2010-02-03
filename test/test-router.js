var sys = require('sys');
var TestSuite = require('../dependencies/node-async-testing/async_testing').TestSuite;
var path = require('path');

var Router = require('../lib/router').Router;

var BomberResponse = require('../lib/response').Response;
var BomberRequest = require('../lib/request').Request;

var MockRequest = require('./mocks/request').MockRequest;
var MockResponse = require('./mocks/response').MockResponse;


// Simple routes
(new TestSuite('Router Tests'))
  .setup(function() {
    this.r = new Router();
    this.r.path = path.dirname(__filename)+'/fixtures/testApp/routes.js';
  })
  .runTests({
    "test router.add": function(test) {
      test.r.add('/(a)(b)(c)', { view: 'view_name', action: 'action_name' });
      test.r.add('/defer', "subApp");
      test.r.add('/:action/:id/:more', { view: 'view_name' });
      test.r.add('/:action/:id', { view: 'view_name_int', id: '[0-9]+' });
      test.r.add('/:action/:id', { view: 'view_name' });
      test.r.add('/:action', { view: 'view_name' });
      test.r.add('/', { view: 'view_name', action: 'action_name' });

      var tests = [
        [ ['GET', '/'],
          { action: {
              view: 'view_name',
              action: 'action_name'
            },
            params: {
            }
          } ],
        [ ['GET', '/abc'],
          { action: {
              view: 'view_name',
              action: 'action_name'
            },
            params: {
              args: ['a','b','c']
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
              view: 'view_name_int',
              action: 'action_name'
            },
            params: {
              id: "1"
            }
          } ],
        [ ['GET', '/action_name/string'],
          { action: {
              view: 'view_name',
              action: 'action_name'
            },
            params: {
              id: "string"
            }
          } ],
        [ ['GET', '/action_name/string/'],
          { action: {
              view: 'view_name',
              action: 'action_name'
            },
            params: {
              id: "string"
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


      tests.forEach(function(t) {
          var route = test.r.findRoute.apply(test.r, t[0]);
          test.assert.deepEqual(t[1], route);
        });
    },
    "test addFolder adds route": function(test) {
      test.r.addFolder();
      test.assert.equal(1, test.r._routes.length);
    },
    "test addFolder adds route with no path specified": function(test) {
      test.r.addFolder();

      var route = test.r.findRoute('GET','/resources/file.txt');
      test.assert.ok(route.action.action);
    },
    "test addFolder adds route with path specified": function(test) {
      test.r.addFolder({path: '/media/'});

      var route = test.r.findRoute('GET','/media/file.txt');
      test.assert.ok(route.action.action);
    },
    "test addFolder adds route with no folder specified": function(test) {
      test.r.addFolder();

      var route = test.r.findRoute('GET','/resources/file.txt');
      test.assert.equal(route.params.folder, './resources/');
    },
    "test addFolder adds route with folder specified": function(test) {
      test.r.addFolder({folder: '/path/to/folder/'});

      var route = test.r.findRoute('GET','/resources/file.txt');
      test.assert.equal(route.params.folder, '/path/to/folder/');
    },
    "test route gets filename correctly": function(test) {
      test.r.addFolder({folder: '/path/to/folder/'});

      var route = test.r.findRoute('GET','/resources/file.txt');
      test.assert.equal(route.params.filename, 'file.txt');
    },
    "test generate function serves file": function(test) {
      test.r.addFolder();

      var url = '/resources/file.txt';

      var route = test.r.findRoute('GET',url);

      var mrequest = new MockRequest('GET', url);
      var mresponse = new MockResponse();
      var request = new BomberRequest(mrequest, {"href": url, "pathname": url}, route);
      var response = new BomberResponse(mresponse);

      route.action.action(request, response).wait();

      test.assert.equal(200, mresponse.status);
      test.assert.equal('text\n', mresponse.bodyText);
    },
    "test generate function serves file from absolute folder": function(test) {
      test.r.addFolder({folder: path.dirname(__filename)+'/fixtures/testApp/resources/'});

      var url = '/resources/file.txt';

      var route = test.r.findRoute('GET',url);

      var mrequest = new MockRequest('GET', url);
      var mresponse = new MockResponse();
      var request = new BomberRequest(mrequest, {"href": url, "pathname": url}, route);
      var response = new BomberResponse(mresponse);

      route.action.action(request, response).wait();

      test.assert.equal(200, mresponse.status);
    },
    "test returns 404 for non-existant file": function(test) {
      test.r.addFolder({folder: path.dirname(__filename)+'/fixtures/testApp/resources/'});

      var url = '/resources/non-existant';

      var route = test.r.findRoute('GET',url);

      var mrequest = new MockRequest('GET', url);
      var mresponse = new MockResponse();
      var request = new BomberRequest(mrequest, {"href": url, "pathname": url}, route);
      var response = new BomberResponse(mresponse);

      var http_response = route.action.action(request, response).wait();

      test.assert.equal('HTTP404NotFound', http_response.name);
    },
  });
