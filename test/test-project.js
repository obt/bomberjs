var sys = require('sys'),
    path = require('path');

var async_testing = require('../bundled/async-testing/async_testing'),
    promise = require('../bundled/promise');

// make sure bomberjs is on the path
require.paths.push(path.dirname(__filename)+'/../..');
var project = require('bomberjs/lib/project');

exports['Project event emitter Suite'] = (new async_testing.TestSuite())
  .setup(function() {
      this.project = project.create();
    })
  .addTests({
    "test observe": function(assert) {
      this.project.listen('event', func);
      this.project.listen('event', {name: 'name'}, func);
      this.project.pipe('event', func);
      this.project.pipe('event', {name: 'name'}, func);

      var expected = [
        [{type: 'listen'},func],
        [{type: 'listen', name: 'name'},func],
        [{type: 'pipe'},func],
        [{type: 'pipe', name: 'name'},func]
      ]
      assert.deepEqual(expected, this.project._observers.event);

      function func() {};
    },
    "test order": function(assert) {
      this.numAssertionsExpected = 7;

      this.project.listen('event', function(arg) {
          assert.equal(5, arg);
        });
      this.project.listen('event', {name: 'name'}, function(arg) {
          assert.equal(5, arg);
        });
      this.project.pipe('event', function(arg) {
          assert.equal(0, arg);
          return 1;
        });
      this.project.pipe('event', {name: 'name1'}, function(arg) {
          assert.equal(1, arg);
          return 2;
        });
      this.project.pipe('event', {after: 'name2'}, function(arg) {
          assert.equal(4, arg);
          return 5;
        });
      this.project.pipe('event', {name: 'name2', after: 'name1'}, function(arg) {
          assert.equal(2, arg);
          return 3;
        });
      this.project.pipe('event', {after: 'name1'}, function(arg) {
          assert.equal(3, arg);
          return 4;
        });

      this.project.emit('event', 0);
    },
    "test returns a promise": function(assert, finished) {
      this.numAssertionsExpected = 1;

      this.project.emit('event', 0)
        .then(function(arg) {
            assert.equal(0, arg);
            finished();
          });
    },
    "test pipe can return promise": function(assert, finished) {
      this.numAssertionsExpected = 2;

      var p = new promise.Promise();
      this.project.pipe('event', function(arg) {
          assert.equal(0, arg);
          return p;
        });

      this.project.emit('event', 0)
        .then(function(arg) {
            assert.equal(1, arg);
            finished();
          });

      p.resolve(1);
    },
    "test pipe can throw error": function(assert, finished) {
      this.numAssertionsExpected = 1;

      var error = new Error();
      this.project.pipe('event', function(arg) {
          throw error;
        });

      this.project.emit('event', 0)
        .then(null, function(err) {
            assert.equal(error, err);
            finished();
          });
    },
    "test listener can throw error": function(assert, finished) {
      this.numAssertionsExpected = 1;

      var error = new Error();
      this.project.listen('event', function(arg) {
          throw error;
        });

      this.project.emit('event', 0)
        .then(null, function(err) {
            assert.equal(error, err);
            finished();
          });
    },
    "test pipe promise can error": function(assert, finished) {
      this.numAssertionsExpected = 2;

      var p = new promise.Promise();
      this.project.pipe('event', function(arg) {
          assert.equal(0, arg);
          return p;
        });

      this.project.emit('event', 0)
        .then(null, function(arg) {
            assert.equal(1, arg);
            finished();
          });

      p.reject(1);
    },
    "test step function called after each pipe": function(assert, finished) {
      this.numAssertionsExpected = 3;
      var index = 1;

      this.project.pipe('event', function(arg) {
          return arg+1;
        });
      this.project.pipe('event', function(arg) {
          return arg+1;
        });

      this.project.emit('event', 0, step)
        .then(function(arg) {
            assert.equal(2, arg);
            finished();
          });

      function step(err, returned, previous) {
        assert.equal(index++, returned);

        return returned;
      }
    },
    "test step function can throw error": function(assert, finished) {
      this.numAssertionsExpected = 1;

      var error = new Error();

      this.project.pipe('event', function(arg) {
          return arg;
        });

      this.project.emit('event', 0, step)
        .then(null, function(err) {
            assert.equal(error, err);
            finished();
          });

      function step(err, returned, previous) {
        throw error;
      }
    },
    "test step function receives thrown error": function(assert, finished) {
      this.numAssertionsExpected = 2;

      var error = new Error();

      this.project.pipe('event', function(arg) {
          throw error;
        });

      this.project.emit('event', 0, step)
        .then(function(arg) {
            assert.equal(0, arg);
            finished();
          });

      function step(err, returned, previous) {
        assert.equal(error, err);
        return previous;
      }
    },
    "test step function receives promise error": function(assert, finished) {
      this.numAssertionsExpected = 2;

      var error = new Error();

      var p = new promise.Promise();
      this.project.pipe('event', function(arg) {
          return p;
        });

      this.project.emit('event', 0, step)
        .then(function(arg) {
            assert.equal(0, arg);
            finished();
          });

      p.reject(1);

      function step(err, returned, previous) {
        assert.equal(1, err);
        return previous;
      }
    },
  });

if (module === require.main) {
  async_testing.runSuites(exports);
}
