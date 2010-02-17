var sys = require('sys'),
    path = require('path');

var async_testing = require('../dependencies/node-async-testing/async_testing');

// the testing apps assume that bomberjs is on the path.
require.paths.push(path.dirname(__filename)+'/../..');
var App = require('bomberjs/lib/app').App;
var app_errors = require('bomberjs/lib/app').errors;

exports['App Suite'] = (new async_testing.TestSuite())
  .setup(function() {
      this.project = {config: {}};
      this.project.base_app = this.app = new App('bomberjs/test/fixtures/testApp', this.project);
    })
  .addTests({
    "test app doesn't have to exist": function(assert) {
      // Since all parts of an app are optional when we create an
      // App object if it doesn't exist we can't verify this.
      // It just won't do anything.
      assert.doesNotThrow(function() {
          var app = new App('bomberjs/test/fixtures/nonExistantApp');
        });
    },
    "test _inheritAndFlattenConfig": function() {
      var self = {
        'server': { option: false },
        'testApp': { one_a: 1, one_b: 1, one_c: 1, one_d: 1 },
        './subApp1': { option: false },
        './anotherApp': { option: true },
        '.': { one_b: 2, two_a: 2, two_b: 2, two_c: 2 },
      };

      var parent = {
        'server': { option: true },
        'testApp': { one_c: 3, two_b: 3, three_a: 3, three_b: 3 },
        './subApp1': { option: true },
        '.': { one_d: 4, two_c: 4, three_b: 4, four_a: 4 },
      };

      var parent_copy = process.mixin(true, {}, parent);
      // this properly copies right?
      this.assert.notEqual(parent_copy, parent);

      var received = this.app._inheritAndFlattenConfig(self, parent);

      // make sure they get combined properly
      var expected = {
        'server': { option: true },
        './subApp1': { option: true },
        './anotherApp': { option: true },
        '.': { one_a: 1, one_b: 2, one_c: 3, one_d: 4, two_a: 2, two_b: 3, two_c: 4, three_a: 3, three_b: 4, four_a: 4 }
      };
      this.assert.deepEqual(expected, received);

      // make sure that we didn't change the parent
      this.assert.deepEqual(parent_copy, parent);

      // make sure that changing the the combined doesn't change 
      // the parent
      received.server.one = 3;
      this.assert.deepEqual(parent_copy, parent);
    },
    "test _configForApp": function() {
      var start = {
        "server": { option: true },
        "one": { option: true },
        "two": { option: true },
        "./two": { option: true },
        "./two/three": { option: true },
        "./four": { option: true },
      };

      var expected_app_one = {
        "server": { option: true },
        "one": { option: true },
        "two": { option: true }
      };
      this.assert.deepEqual(expected_app_one, this.app._configForApp(start, 'one'));

      var expected_app_two = {
        "server": { option: true },
        "one": { option: true },
        "two": { option: true },
        ".": { option: true },
        "./three": { option: true }
      };
      this.assert.deepEqual(expected_app_two, this.app._configForApp(start, 'two'));

      var expected_app_three_from_app_two = {
        "server": { option: 1 },
        "one": { option: 1 },
        "two": { option: 1 },
         ".": { option: 1 }
      };
      this.assert.deepEqual(expected_app_three_from_app_two, this.app._configForApp(expected_app_two, 'three'));

      var expected_app_four = {
        "server": { option: 1 },
        "one": { option: 1 },
        "two": { option: 1 },
        ".": { option: 1 }
      };
      this.assert.deepEqual(expected_app_four, this.app._configForApp(start, 'four'));
    },
    "test load config": function(assert) {
      assert.equal(1, this.app.config.option_one);
      assert.equal(2, this.app.config.option_two);
    },
    "test load subapps": function(assert) {
      //base test app has 1 sub app
      assert.equal(1, count(this.app.apps));

      // first sub app has config passed to it from testApp
      assert.deepEqual({option: true}, this.app.apps.subApp1.config);
    },
    "test subapp's parent is set": function(assert) {
      assert.equal(this.app, this.app.apps.subApp1.parent);
    },
    "test can load non-existant view": function(assert) {
      // can't get a view that doesn't exist
      assert.throws(function() {
          this.app.getView('non-existant')
        }, app_errors.ViewNotFoundError );

      // can't get a view from an app that doesn't exist
      assert.throws(function() {
          this.app.getView('view1', 'not-existant-app')
        }, app_errors.AppNotFoundError );
    },
    "test load view": function(assert) {
      assert.ok(this.app.getView('view1'));
    },
    "test load view from sub-app": function(assert) {
      // can dig down to get a view file from a subapp
      var subAppView = this.app.getView('subApp1view1','subApp1');
      assert.ok(subAppView);
      // this view has 1 function
      assert.equal(1, count(subAppView));
    },
    "test load routes": function(assert) {
      // test that we properly load in the routes
      assert.equal(3, this.app.router._routes.length);
      assert.equal(2, this.app.apps.subApp1.router._routes.length);
    },
    "test getRoute will pass routing along": function(assert) {
      // getRoute will pass the routing along if an app_key is passed in that
      // points to a sub app
      var route = this.app.getRoute('GET', '/view_name/action_name', 'subApp1');
      var expected = {
        "action": {
          "app": "subApp1",
          "view": "view_name",
          "action": "action_name"
        },
        "params": {}
      };
      assert.deepEqual(expected, route);
    },
    "test getRoute will pass routing along if it gets a partial route": function(assert) {
      // getRoute will pass the routing along if it gets a partial route back
      // from the router
      var route = this.app.getRoute('GET', '/deferToSubApp1/view_name/action_name');
      var expected = {
        "action": {
          "app": "subApp1",
          "view": "view_name",
          "action": "action_name"
        },
        "params": {}
      };
      assert.deepEqual(expected, route);
      route = this.app.getRoute('GET', '/deferToSubApp1/view_name/action_name/1');
      expected = {
        "action": {
          "app": "subApp1",
          "view": "view_name",
          "action": "action_name"
        },
        "params": {id: "1"}
      };
      assert.deepEqual(expected, route);
    },
    "test errors are thrown appropriately": function(assert) {
      assert.throws(function() {
          this.app.getAction({ app: 'non-existant', view: 'subApp1view1', action: 'action'});
        }, app_errors.AppNotFoundError);
      assert.throws(function() {
          this.app.getAction({ app: 'subApp1', view: 'non-existant', action: 'action'});
        }, app_errors.ViewNotFoundError);
      assert.throws(function() {
          this.app.getAction({ app: 'subApp1', view: 'subApp1view1', action: 'non-existant'});
        }, app_errors.ActionNotFoundError);
    },
    "test can load action": function(assert) {
      assert.ok(this.app.getAction({ app: 'subApp1', view: 'subApp1view1', action: 'action'}));
    },
    "test can specify a function in a route": function(assert) {
      var func = function() {};
      assert.equal(func, this.app.getAction({action: func}));
    },
    "test _parseAppPath": function(assert) {
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
        assert.deepEqual(app_keys[key], this.app._parseAppPath(key));
      }
    },
    "test modulePathToKey": function(assert) {
      assert.equal(path.basename(process.cwd()), App.modulePathToAppKey('.'));
      assert.equal('path', App.modulePathToAppKey('./my/path'));
      assert.equal('path', App.modulePathToAppKey('/my/path'));
      assert.equal('path', App.modulePathToAppKey('my/path'));
      assert.equal('path', App.modulePathToAppKey('./path'));
      assert.equal('path', App.modulePathToAppKey('/path'));
      assert.equal('path', App.modulePathToAppKey('path'));
    }
  });

function count(object) {
  var count = 0;
  for( var key in object ) {
    count++;
  }
  return count;
}

if (module === require.main) {
  async_testing.runSuites(exports);
}
