var sys = require('sys');

var TestSuite = require('../dependencies/node-async-testing/async_testing').TestSuite;

var makeChainable = require('../lib/chainable').makeChainable;

(new TestSuite('Action Tests'))
  .setup(function() {
      var Func = function() {};
      makeChainable(Func);

      this.obj = new Func();
    })
  .runTests({
    "test add listeners": function() {
      // listeners object should not exist if no listeners have been added
      this.assert.ok(!this.obj._listeners);

      // add some listeners
      this.obj.listen('event1', function() {});
      this.obj.listen('event2', function() {});
      this.obj.listen('event1', function() {});

      // listeners object should exist and have two properties
      this.assert.ok(this.obj._listeners);
      this.assert.ok(this.obj._listeners.event1);
      this.assert.ok(this.obj._listeners.event2);

      // the two properties should have the right number of events
      this.assert.equal(2, this.obj._listeners.event1.length);
      this.assert.equal(1, this.obj._listeners.event2.length);
    },
    "test emit with no listeners": function(test) {
      test.numAssertionsExpected = 1;

      var finished = function(val) {
        test.assert.equal(1, val);
        test.finish();
      };

      test.obj.emit('event', finished, null, 1);
    },
    "test emit with listeners": function(test) {
      test.numAssertionsExpected = 3;

      var finished = function(val) {
        test.assert.equal(3, val);
        test.finish();
      };

      test.obj.listen('event', function(obj) {
          test.assert.equal(1, obj);
          return 2
        });
      test.obj.listen('event', function(obj) {
          test.assert.equal(2, obj);
          return 3
        });

      test.obj.emit('event', finished, null, 1);
    },
    "test this always points to the emitting object": function(test) {
      test.numAssertionsExpected = 3;

      var finished = function() {
        test.assert.equal(test.obj, this);
        test.finish();
      };

      test.obj.listen('event', function() {
          test.assert.equal(test.obj, this);
        });
      test.obj.listen('event', function() {
          test.assert.equal(test.obj, this);
        });

      test.obj.emit('event', finished);
    },
    "test step function gets called after every listener": function(test) {
      test.numAssertionsExpected = 5;

      var finished = function() {
        test.assert.equal(test.obj, this);
        test.finish();
      };

      var count = 0;

      var step = function(val) {
        count++;
        test.assert.equal(val, count);
      };

      test.obj.listen('event', function(val) {
          test.assert.equal(0, val);
          return val+1;
        });
      test.obj.listen('event', function(val) {
          test.assert.equal(1, val);
          return val+1;
        });

      test.obj.emit('event', finished, step, 0);
    },
    "test step function can cancel chain": function(test) {
      test.numAssertionsExpected = 2;

      var finished = function() {
        // should not be called
        test.assert.ok(false);
      };

      var count = 0;

      var step = function(val) {
        count++;
        // should be called once
        test.assert.equal(1, count);
        return true;
      };

      test.obj.listen('event', function(val) {
          test.assert.ok(true);
          return val;
        });
      test.obj.listen('event', function(val) {
          // should not be called
          test.assert.ok(false);
          return val;
        });

      test.obj.emit('event', finished, step, 0);
    },
  });
