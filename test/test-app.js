var assert = require('assert');
var sys = require('sys');

var path = require('../lib/utils').path;
require.paths.push(path.base(__filename)+'/../..');
var App = require('bomberjs/lib/app').App;

// Since all parts of an app are optional when we create an
// App object if it doesn't exist we can't verify this.
// It just won't do anything.
assert.doesNotThrow(function() {
    var app = new App('bomberjs/test/fixtures/nonExistantApp');
  });

var app = new App('bomberjs/test/fixtures/testApp');

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

//TODO test _loadRoater and getRoute

// test _parseAppKey
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
  assert.deepEqual(app_keys[key], app._parseAppKey(key));
}

// test that App.pathToKey does so properly
assert.equal('bomberjs', App.pathToKey('.'));
assert.equal('path', App.pathToKey('./my/path'));
assert.equal('path', App.pathToKey('/my/path'));
assert.equal('path', App.pathToKey('my/path'));
assert.equal('path', App.pathToKey('./path'));
assert.equal('path', App.pathToKey('/path'));
assert.equal('path', App.pathToKey('path'));

function count(object) {
  var count = 0;
  for( var key in object ) {
    count++;
  }
  return count;
}

//sys.p(app);
