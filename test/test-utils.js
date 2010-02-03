var sys = require('sys');
var TestSuite = require('../dependencies/node-async-testing/async_testing').TestSuite;

var utils = require('../lib/utils');

(new TestSuite('Utils Tests')).runTests({
  "test custom error": function(test) {
    var MyError = utils.createCustomError('MyError');

    var e = new MyError('Test');

    test.assert.ok(e instanceof Error);
    test.assert.equal('Test', e.message);
    var stack = e.stack.split(/\n/);
    test.assert.equal('MyError: Test', stack[0]);
  },
  "test bind": function(test) {
    var test = this;
    var func = function(arg1, arg2) {
      test.assert.equal(test, this);
      test.assert.equal(1, arg1);
      test.assert.equal(2, arg2);
    };

    utils.bind(func, this, 1, 2)();
  },
  "test mime lookup": function(test) {
    // easy
    test.assert.equal('text/plain', utils.mime.lookup('text.txt'));
    
    // just an extension
    test.assert.equal('text/plain', utils.mime.lookup('.txt'));
    
    // default
    test.assert.equal('application/octet-stream', utils.mime.lookup('text.nope'));

    // fallback
    test.assert.equal('fallback', utils.mime.lookup('text.fallback', 'fallback'));
  },
  "test charset lookup": function(test) {
    // easy
    test.assert.equal('UTF-8', utils.charsets.lookup('text/plain'));
    
    // none
    test.assert.ok(typeof utils.charsets.lookup('text/nope') == 'undefined');

    // fallback
    test.assert.equal('fallback', utils.charsets.lookup('text/fallback', 'fallback'));
  }
});
