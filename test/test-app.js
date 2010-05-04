var sys = require('sys'),
    path = require('path');

var async_testing = require('async_testing');

// the testing apps assume that bomberjs is on the path.
require.paths.push(path.dirname(__filename)+'/../..');
var app = require('bomberjs/lib/app');

exports['App Suite'] = (new async_testing.TestSuite())
  .setup(function() {
      var project = {config: {}};
      this.app = app.create('bomberjs/test/app', project);
    })
  .addTests({
    "test app doesn't have to exist": function(assert) {
      // Since all parts of an app are optional when we create an
      // App object if it doesn't exist we can't verify this.
      // It just won't do anything.
      assert.doesNotThrow(function() {
          var app = app.create('bomberjs/test/fixtures/nonExistantApp');
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
        "server": { option: true },
        "one": { option: true },
        "two": { option: true },
         ".": { option: true }
      };
      this.assert.deepEqual(expected_app_three_from_app_two, this.app._configForApp(expected_app_two, 'three'));

      var expected_app_four = {
        "server": { option: true },
        "one": { option: true },
        "two": { option: true },
        ".": { option: true }
      };
      this.assert.deepEqual(expected_app_four, this.app._configForApp(start, 'four'));
    },
    "test load config": function(assert) {
      assert.equal(1, this.app.config.one);
      assert.equal(2, this.app.config.two);
    },
    "test load subapps": function(assert) {
      //base test app has 1 sub app
      assert.equal(2, count(this.app.apps));
      assert.equal(3, count(this.app.apps.A.apps));
      assert.equal(3, count(this.app.apps.B.apps));
    },
    "test subapp's parent is set": function(assert) {
      assert.equal(this.app, this.app.apps.A.parent);
      assert.equal(this.app.apps.A, this.app.apps.A.apps.C.parent);
    },
    "test modulePathToKey": function(assert) {
      assert.equal(path.basename(process.cwd()), app.modulePathToAppKey('.'));
      assert.equal('path', app.modulePathToAppKey('./my/path'));
      assert.equal('path', app.modulePathToAppKey('/my/path'));
      assert.equal('path', app.modulePathToAppKey('my/path'));
      assert.equal('path', app.modulePathToAppKey('./path'));
      assert.equal('path', app.modulePathToAppKey('/path'));
      assert.equal('path', app.modulePathToAppKey('path'));
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
