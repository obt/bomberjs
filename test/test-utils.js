var sys = require('sys');

var async_testing = require('../dependencies/node-async-testing/async_testing');

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
    "test bind": function(assert) {
      var test = this;
      var func = function(arg1, arg2) {
        assert.equal(test, this);
        assert.equal(1, arg1);
        assert.equal(2, arg2);
      };

      utils.bind(func, this, 1, 2)();
    },
    "test mime lookup": function(assert) {
      // easy
      assert.equal('text/plain', utils.mime.lookup('text.txt'));
      
      // just an extension
      assert.equal('text/plain', utils.mime.lookup('.txt'));
      
      // default
      assert.equal('application/octet-stream', utils.mime.lookup('text.nope'));

      // fallback
      assert.equal('fallback', utils.mime.lookup('text.fallback', 'fallback'));
    },
    "test charset lookup": function(assert) {
      // easy
      assert.equal('UTF-8', utils.charsets.lookup('text/plain'));
      
      // none
      assert.ok(typeof utils.charsets.lookup('text/nope') == 'undefined');

      // fallback
      assert.equal('fallback', utils.charsets.lookup('text/fallback', 'fallback'));
    }
  });

if (module === require.main) {
  async_testing.runSuites(exports);
}
