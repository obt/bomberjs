var sys = require('sys');
var TestSuite = require('../dependencies/node-async-testing/async_testing').TestSuite;

var BomberRequest = require('../lib/request').Request;
var MockRequest = require('./mocks/request').MockRequest;

(new TestSuite('Request Tests'))
  .setup(function() {
      this.mr = new MockRequest('POST', '/');
      this.br = new BomberRequest(this.mr, {"href": "/", "pathname": "/"}, {});
    })
  .runTests({
    "test simple": function(test) {
      this.assert.equal(this.mr.method, this.br.method);
    },
    "test load data": function(test) {
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

      var p = test.br.loadData();
      p.addCallback(function(data) {
          test.assert.deepEqual(parsed, data);
        });

      test.mr.emit('body',sent);
      test.mr.emit('complete');
    },
    "test load data -- no parse": function(test) {
      var sent = 'foo=bar&baz%5Bquux%5D=asdf&baz%5Boof%5D=rab&boo%5B%5D=1';

      var p = test.br.loadData(false);
      p.addCallback(function(data) {
          test.assert.equal(sent, data);
        });

      test.mr.emit('body',sent);
      test.mr.emit('complete');
    },
    "test buffers": function(test) {
      var dataLoaded = false;

      var first = 'one',
          second = 'two';

      var p = test.br.loadData(false);
      p.addCallback(function(data) {
          test.assert.equal(first+second, data);
          dataLoaded = true;
        });

      test.assert.ok(!dataLoaded);
      test.mr.emit('body',first);
      test.assert.ok(!dataLoaded);
      test.mr.emit('body',second);
      test.assert.ok(!dataLoaded);
      test.mr.emit('complete');
      test.assert.ok(dataLoaded);
    },
  });
