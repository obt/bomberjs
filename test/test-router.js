var sys = require('sys');
var assert = require('assert');
var path = require('path');

var Router = require('../lib/router').Router;

var BomberResponse = require('../lib/response').Response;
var BomberRequest = require('../lib/request').Request;

var MockRequest = require('./mocks').MockRequest;
var MockResponse = require('./mocks').MockResponse;


// Simple routes
var r = new Router();
r.add('/(a)(b)(c)', { view: 'view_name', action: 'action_name' });
r.add('/defer', "subApp");
r.add('/:action/:id/:more', { view: 'view_name' });
r.add('/:action/:id', { view: 'view_name_int', id: '[0-9]+' });
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
runTestsOnRouter(r, tests);

function runTestsOnRouter(router, tests) {
  tests.forEach(function(test) {
      var route = router.findRoute.apply(router, test[0]);
      //sys.p(test[0]);
      assert.deepEqual(test[1], route);
    });
}

var addFolder_tests = {
  "__setup": function() {
    this.r = new Router();
    this.r.path = path.dirname(__filename)+'/fixtures/testApp/routes.js';
  },
  "test addFolder adds route": function() {
    this.r.addFolder();
    assert.equal(1, this.r._routes.length);
  },
  "test addFolder adds route with no path specified": function() {
    this.r.addFolder();

    var route = this.r.findRoute('GET','/resources/file.txt');
    assert.ok(route.action.action);
  },
  "test addFolder adds route with path specified": function() {
    this.r.addFolder({path: '/media/'});

    var route = this.r.findRoute('GET','/media/file.txt');
    assert.ok(route.action.action);
  },
  "test addFolder adds route with no folder specified": function() {
    this.r.addFolder();

    var route = this.r.findRoute('GET','/resources/file.txt');
    assert.equal(route.params.folder, './resources/');
  },
  "test addFolder adds route with folder specified": function() {
    this.r.addFolder({folder: '/path/to/folder/'});

    var route = this.r.findRoute('GET','/resources/file.txt');
    assert.equal(route.params.folder, '/path/to/folder/');
  },
  "test route gets filename correctly": function() {
    this.r.addFolder({folder: '/path/to/folder/'});

    var route = this.r.findRoute('GET','/resources/file.txt');
    assert.equal(route.params.filename, 'file.txt');
  },
  "test generate function serves file": function() {
    this.r.addFolder();

    var url = '/resources/file.txt';

    var route = this.r.findRoute('GET',url);

    var mrequest = new MockRequest('GET', url);
    var mresponse = new MockResponse();
    var request = new BomberRequest(mrequest, {"href": url, "pathname": url}, route);
    var response = new BomberResponse(mresponse);

    route.action.action(request, response).wait();

    assert.equal(200, mresponse.status);
    assert.equal('text\n', mresponse.bodyText);
  },
  "test generate function serves file from absolute folder": function() {
    this.r.addFolder({folder: path.dirname(__filename)+'/fixtures/testApp/resources/'});

    var url = '/resources/file.txt';

    var route = this.r.findRoute('GET',url);

    var mrequest = new MockRequest('GET', url);
    var mresponse = new MockResponse();
    var request = new BomberRequest(mrequest, {"href": url, "pathname": url}, route);
    var response = new BomberResponse(mresponse);

    route.action.action(request, response).wait();

    assert.equal(200, mresponse.status);
  },
  "test returns 404 for non-existant file": function() {
    this.r.addFolder({folder: path.dirname(__filename)+'/fixtures/testApp/resources/'});

    var url = '/resources/non-existant';

    var route = this.r.findRoute('GET',url);

    var mrequest = new MockRequest('GET', url);
    var mresponse = new MockResponse();
    var request = new BomberRequest(mrequest, {"href": url, "pathname": url}, route);
    var response = new BomberResponse(mresponse);

    var http_response = route.action.action(request, response).wait();

    assert.equal('HTTP404NotFound', http_response.name);
  },
};

for( var test in addFolder_tests) {
  if( test == '__setup' ) {
    continue;
  };
  if('__setup' in addFolder_tests) {
    var obj = new addFolder_tests.__setup();
    addFolder_tests[test].call(obj);
  }
  else {
    addFolder_tests[test].call();
  }
}
