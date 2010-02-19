var sys = require('sys');

var async_testing = require('../dependencies/node-async-testing/async_testing');

var makeChainable = require('../lib/chainable').makeChainable;

exports['Chainable Events'] = (new async_testing.TestSuite())
  .setup(function() {
      var Func = function() {};
      makeChainable(Func);

      this.obj = new Func();
    })
  .addTests({
    "test add listeners": function(assert) {
      // listeners object should not exist if no listeners have been added
      assert.ok(!this.obj._listeners);

      // add some listeners
      this.obj.listen('event1', function() {});
      this.obj.listen('event2', function() {});
      this.obj.listen('event1', function() {});

      // listeners object should exist and have two properties
      assert.ok(this.obj._listeners);
      assert.ok(this.obj._listeners.event1);
      assert.ok(this.obj._listeners.event2);

      // the two properties should have the right number of events
      assert.equal(2, this.obj._listeners.event1.length);
      assert.equal(1, this.obj._listeners.event2.length);
    },
    "test emit with no listeners": function(assert, finishTest, test) {
      test.numAssertionsExpected = 1;

      var finished = function(val) {
        assert.equal(1, val);
        finishTest();
      };

      test.obj.emit('event', finished, null, 1);
    },
    "test emit with listeners": function(assert, finishTest, test) {
      test.numAssertionsExpected = 3;

      var finished = function(val) {
        assert.equal(3, val);
        finishTest();
      };

      test.obj.listen('event', function(obj, cb) {
          assert.equal(1, obj);
          cb(2);
        });
      test.obj.listen('event', function(obj, cb) {
          assert.equal(2, obj);
          cb(3);
        });

      test.obj.emit('event', finished, null, 1);
    },
    "test this always points to the emitting object": function(assert, finishTest, test) {
      test.numAssertionsExpected = 3;

      var finished = function() {
        assert.equal(test.obj, this);
        finishTest();
      };

      test.obj.listen('event', function(cb) {
          assert.equal(test.obj, this);
          cb();
        });
      test.obj.listen('event', function(cb) {
          assert.equal(test.obj, this);
          cb();
        });

      test.obj.emit('event', finished);
    },
    "test step function gets called after every listener": function(assert, finishTest, test) {
      test.numAssertionsExpected = 5;

      var finished = function() {
        assert.equal(test.obj, this);
        finishTest();
      };

      var count = 0;

      var step = function(returned, old, cb) {
        count++;
        assert.equal(returned[0], count);
        cb.apply(null, returned);
      };

      test.obj.listen('event', function(val, cb) {
          assert.equal(0, val);
          cb(val+1);
        });
      test.obj.listen('event', function(val, cb) {
          assert.equal(1, val);
          cb(val+1);
        });

      test.obj.emit('event', finished, step, 0);
    },
    "test step function can cancel chain": function(assert, finishTest, test) {
      test.numAssertionsExpected = 2;

      var finished = function() {
        // should not be called
        assert.ok(false);
      };

      var count = 0;

      var step = function(returned, old, cb) {
        count++;
        // should be called once
        assert.equal(1, count);
        process.nextTick(function() {
            finishTest();
          });
      };

      test.obj.listen('event', function(val, cb) {
          assert.ok(true);
          cb(val);
        });
      test.obj.listen('event', function(val, cb) {
          // should not be called
          assert.ok(false);
          cb(val);
        });

      test.obj.emit('event', finished, step, 0);
    },
  });

if (module === require.main) {
  async_testing.runSuites(exports);
}
