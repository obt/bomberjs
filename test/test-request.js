var sys = require('sys');

var async_testing = require('../dependencies/node-async-testing/async_testing');

var BomberRequest = require('../lib/request').Request,
    MockRequest = require('./mocks/request').MockRequest;

exports['Request Tests'] = (new async_testing.TestSuite())
  .setup(function() {
      this.mr = new MockRequest('POST', '/');
      this.br = new BomberRequest(this.mr, {"href": "/", "pathname": "/"}, {});
    })
  .addTests({
    "test simple": function(assert) {
      assert.equal(this.mr.method, this.br.method);
    },
    "test load data": function(assert, finished) {
      var sent = 'foo=bar&baz%5Bquux%5D=asdf&baz%5Boof%5D=rab&boo%5B%5D=1';
      var parsed = {
          "foo": "bar",
          "baz": {
            "quux": "asdf",
            "oof": "rab"
          },
          "boo": [
            1
          ]
        };

      var p = this.br.loadData();
      p.addCallback(function(data) {
          assert.deepEqual(parsed, data);
          finished();
        });

      this.mr.emit('body',sent);
      this.mr.emit('complete');
    },
    "test load data -- no parse": function(assert, finished) {
      var sent = 'foo=bar&baz%5Bquux%5D=asdf&baz%5Boof%5D=rab&boo%5B%5D=1';

      var p = this.br.loadData(false);
      p.addCallback(function(data) {
          assert.equal(sent, data);
          finished();
        });

      this.mr.emit('body',sent);
      this.mr.emit('complete');
    },
    "test buffers": function(assert, finished) {
      var dataLoaded = false;

      var first = 'one',
          second = 'two';

      var p = this.br.loadData(false);
      p.addCallback(function(data) {
          assert.equal(first+second, data);
          dataLoaded = true;
        });

      assert.ok(!dataLoaded);
      this.mr.emit('body',first);
      assert.ok(!dataLoaded);
      this.mr.emit('body',second);
      assert.ok(!dataLoaded);
      this.mr.emit('complete');
      assert.ok(dataLoaded);
      process.nextTick(function() {
          finished();
        });
    },
  });

if (module === require.main) {
  async_testing.runSuites(exports);
}
