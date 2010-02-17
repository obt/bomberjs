var sys = require('sys');
var path = require('path');

var async_testing = require('../dependencies/node-async-testing/async_testing');

var BomberResponse = require('../lib/response').Response;
var MockResponse = require('./mocks/response').MockResponse;

exports['Response Tests'] = (new async_testing.TestSuite())
  .setup(function() {
      this.mr = new MockResponse();
      this.br = new BomberResponse(this.mr);
    })
  .addTests({
    "test simple": function(assert) {
      this.br.send('Hi there');

      assert.equal(200, this.mr.status);
      assert.ok(this.mr.closed);
      assert.equal(1, this.mr.body.length);
      assert.equal('Hi there', this.mr.bodyText);
    },
    "test finish on send": function(assert) {
      this.br.finishOnSend = false;

      this.br.send('Hi there');
      assert.ok(!this.mr.closed);

      this.br.send('Hello');
      assert.ok(!this.mr.closed);

      this.br.finish();
      assert.ok(this.mr.closed);
    },
    "test can't finish twice": function(assert) {
      var br = this.br;

      br.send('Hi there');
      assert.throws(function() {
          br.finish();
        });
    },
    "test can't send after finishing": function(assert) {
      var br = this.br;

      br.send('Hi there');
      assert.throws(function() {
          br.send('');
        });
    },
    "test can't send header twice": function(assert) {
      var br = this.br;

      br.sendHeaders();
      assert.throws(function() {
          br.sendHeaders();
        });
    },
    "test header isn't sent twice if manually sent": function(assert) {
      //headers haven't been sent
      assert.ok(!this.mr.headers);
      this.br.sendHeaders();

      // now they have
      assert.ok(this.mr.headers);
      
      // no problem!
      var br = this.br;
      assert.doesNotThrow(function() {
          br.send('hi there');
        });
    },
    "test Content-Type set automatically": function(assert) {
      this.br.send('Hi there');

      assert.equal('text/html; charset=UTF-8', this.mr.headers['Content-Type']);
    },
    "test Content-Type set through variable": function(assert) {
      this.br.mimeType = 'something';
      this.br.send('Hi there');

      assert.equal('something', this.mr.headers['Content-Type']);
    },
    "test Content-Type set through setHeader": function(assert) {
      this.br.setHeader('Content-Type', 'something');
      this.br.send('Hi there');

      assert.equal('something', this.mr.headers['Content-Type']);
    },
    "test Content-Type set through headers": function(assert) {
      this.br.headers['Content-Type'] = 'something';
      this.br.send('Hi there');

      assert.equal('something', this.mr.headers['Content-Type']);
    },
    "test Content-Type gets overriden by explicitly set header": function(assert) {
      this.br.mimeType = 'text/something else';
      this.br.headers['Content-Type'] = 'something';
      this.br.send('Hi there');

      assert.equal('something', this.mr.headers['Content-Type']);
    },
    "test charset set automatically if known Content-Type": function(assert) {
      this.br.mimeType = 'text/html';
      this.br.send('Hi there');

      assert.equal('text/html; charset=UTF-8', this.mr.headers['Content-Type']);
    },
    "test charset not set automatically if unknown Content-Type": function(assert) {
      this.br.mimeType = 'unknown';
      this.br.send('Hi there');

      assert.equal('unknown', this.mr.headers['Content-Type']);
    },
    "test charset can be explicitly set": function(assert) {
      this.br.mimeType = 'unknown';
      this.br.charset = 'CHARSET';
      this.br.send('Hi there');

      assert.equal('unknown; charset=CHARSET', this.mr.headers['Content-Type']);
    },
    "test status can be set": function(assert) {
      this.br.status = 404;
      this.br.send('Hi there');

      assert.equal(404, this.mr.status);
    },
    "test send file": function(assert, finished, test) {
      var p = test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png');
      p.addCallback(function() {
          assert.equal(200, test.mr.status);
          assert.equal('this is a fake image\n', test.mr.bodyText);
          assert.ok(test.mr.closed);
          finished();
        });

    },
    "test send file doesn't exist": function(assert) {
      assert.throws(function() {
          test.br.sendFile('non-existant');
        });
    },
    "test send file will set Content-Type": function(assert, finished, test) {
      var p = test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png');
      p.addCallback(function() {
          assert.equal('image/png', test.mr.headers['Content-Type']);
          finished();
        });
    },
    "test send file will not override Content-Type": function(assert, finished, test) {
      test.br.mimeType = 'not/image';
      var p = test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png');
      p.addCallback(function() {
          assert.equal('not/image', test.mr.headers['Content-Type']);
          finished();
        });
    },
    "test send file with finishOnSend false": function(assert, finished, test) {
      test.br.finishOnSend = false;
      
      var p = test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png');
      p.addCallback(function() {
          assert.ok(!test.mr.closed);
          finished();
        });
    },
    "test send file with other sends": function(assert, finished, test) {
      test.br.finishOnSend = false;
      
      test.br.send('one');
      var p = test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png');
      p.addCallback(function() {
          test.br.send('two');
          assert.equal('onethis is a fake image\ntwo', test.mr.bodyText);
          finished();
        });
    },
    "test send file doesn't resend headers": function(assert, finished, test) {
      test.br.sendHeaders();
      assert.ok(test.mr.headers);
      test.mr.headers = null;
      assert.ok(!test.mr.headers);
      var p = test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png');
      p.addCallback(function() {
          assert.ok(!test.mr.headers);
          finished();
        });
    },
    "test send file resets encoding after it is finished": function(assert, finished, test) {
      var p = test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png');
      p.addCallback(function() {
          assert.equal(BomberResponse.__defaultEncoding, test.br.encoding);
          finished();
        });
    },
  });

if (module === require.main) {
  async_testing.runSuites(exports);
}
