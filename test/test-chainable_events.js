var sys = require('sys');

var TestSuite = require('../dependencies/node-async-testing/async_testing').TestSuite;

var makeChainable = require('../lib/chainable_events').makeChainable;

(new TestSuite('Action Tests'))
  .setup(function() {
      var Func = function() {};
      makeChainable(Func);

      this.obj = new Func();
    })
  .runTests({
    "test add listener": function() {
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
      test.numAssertionsExpected = 3;

      var finished = function(one, two, three) {
        test.assert.equal(1, one);
        test.assert.equal(2, two);
        test.assert.equal(3, three);
        test.finish();
      };

      test.obj.emit('event', finished, null, 1, 2, 3);
    },
    "test emit with listener": function(test) {
      test.numAssertionsExpected = 6;

      var finished = function(one, two, three) {
        test.assert.equal(1, one);
        test.assert.equal(2, two);
        test.assert.equal(3, three);
        test.finish();
      };

      test.obj.listen('event', function(cb, one, two, three) {
          test.assert.equal(1, one);
          test.assert.equal(2, two);
          test.assert.equal(3, three);

          cb();
        });

      test.obj.emit('event', finished, null, 1, 2, 3);
    },
    "test listener can cancel event": function(test) {
      test.numAssertionsExpected = 1;
      var canceled = finished = function(val) {
        test.assert.equal('val', val);
      };

      // this listener cancels the event
      test.obj.listen('event', function(cb) {
          cb('val');
        });

      // this listener will never get called
      test.obj.listen('event', function(cb) {
          test.assert.ok(false);
          cb();
        });

      test.obj.emit('event', finished, canceled);
      test.obj.emit('finished', function() { test.finish(); });
    },
    "test this always points to the emitting object": function(test) {
      test.numAssertionsExpected = 5;

      var canceled = finished = function() {
        test.assert.equal(test.obj, this);
      };

      // these listeners return normally
      test.obj.listen('event1', function(cb) {
          test.assert.equal(test.obj, this);
          cb();
        });
      test.obj.listen('event1', function(cb) {
          test.assert.equal(test.obj, this);
          cb();
        });

      // this listener cancels the event
      test.obj.listen('event2', function(cb) {
          test.assert.equal(test.obj, this);
          cb(true);
        });

      test.obj.emit('event1', finished);
      test.obj.emit('event2', finished, canceled);
      test.obj.emit('event3', function() { test.finish(); });
    },
  });
