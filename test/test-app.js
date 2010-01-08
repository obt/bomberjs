var sys = require('sys');
var assert = require('assert');
var path = require('path');

// the testing apps assume that bomberjs is on the path.
require.paths.push(path.dirname(__filename)+'/../..');

var App = require('bomberjs/lib/app').App;

// Since all parts of an app are optional when we create an
// App object if it doesn't exist we can't verify this.
// It just won't do anything.
assert.doesNotThrow(function() {
    var app = new App('bomberjs/test/fixtures/nonExistantApp');
  });

var app = new App('bomberjs/test/fixtures/testApp');
//sys.p(app);

//base test app has config
assert.ok(app.config);

//base test app has 1 sub app
assert.equal(1, count(app.apps));

// first sub app has no config
assert.equal(null, app.apps.subApp1.config);

// can't get a view that doesn't exist
assert.throws(function() {
    app.getView('non-existant')
  });

// simple view file exists
assert.ok(app.getView('view1'));

// can dig down to get a view file from a subapp
var subAppView = app.getView('subApp1view1','subApp1');
assert.ok(subAppView);
// this view has 1 function
assert.equal(1, count(subAppView));

// test that we properly load in the routes
assert.equal(1, app.router.routes.length);
assert.equal(2, app.apps.subApp1.router.routes.length);

// getRoute will pass the routing along if an app_key is passed in that
// points to a sub app
var route = app.getRoute('GET', '/view_name/action_name', 'subApp1');
var expected = {
  "action": {
    "app": "subApp1",
    "view": "view_name",
    "action": "action_name"
  },
  "params": {}
};
assert.deepEqual(expected, route);

// getRoute will pass the routing along if it gets a partial route back
// from the router
var route = app.getRoute('GET', '/deferToSubApp1/view_name/action_name');
var expected = {
  "action": {
    "app": "subApp1",
    "view": "view_name",
    "action": "action_name"
  },
  "params": {}
};
assert.deepEqual(expected, route);
route = app.getRoute('GET', '/deferToSubApp1/view_name/action_name/1');
expected = {
  "action": {
    "app": "subApp1",
    "view": "view_name",
    "action": "action_name"
  },
  "params": {id: "1"}
};
assert.deepEqual(expected, route);

// test _parseAppPath
var app_keys = {
  '': [],
  '.': [],
  './': [],
  '/': [],
  'testApp': [],
  '/testApp': [],
  './subApp': ['subApp'],
  '/subApp': ['subApp'],
  'subApp': ['subApp'],
  'testApp/subApp': ['subApp'],
  '/testApp/subApp': ['subApp'],
  './sub/app/stuff': ['sub', 'app/stuff'],
  '/sub/app/stuff': ['sub', 'app/stuff'],
  'sub/app/stuff': ['sub', 'app/stuff'],
  'testApp/sub/app/stuff': ['sub', 'app/stuff'],
  '/testApp/sub/app/stuff': ['sub', 'app/stuff']
};
for(var key in app_keys) {
  assert.deepEqual(app_keys[key], app._parseAppPath(key));
}

// test that App.modulePathToKey does so properly
assert.equal(path.filename(process.cwd()), App.modulePathToKey('.'));
assert.equal('path', App.modulePathToKey('./my/path'));
assert.equal('path', App.modulePathToKey('/my/path'));
assert.equal('path', App.modulePathToKey('my/path'));
assert.equal('path', App.modulePathToKey('./path'));
assert.equal('path', App.modulePathToKey('/path'));
assert.equal('path', App.modulePathToKey('path'));

function count(object) {
  var count = 0;
  for( var key in object ) {
    count++;
  }
  return count;
}

//sys.p(app);
