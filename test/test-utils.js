var async_testing = require('async_testing');
var utils = require('../lib/utils');

exports['Utils Tests'] = (new async_testing.TestSuite())
  .addTests({
    "test custom error": function(assert) {
      var MyError = utils.createCustomError('MyError');

      var e = new MyError('Test');

      assert.ok(e instanceof Error);
      assert.equal('Test', e.message);
      var stack = e.stack.split(/\n/);
      assert.equal('MyError: Test', stack[0]);
    },
  });

if (module === require.main) {
  async_testing.runSuites(exports);
}
