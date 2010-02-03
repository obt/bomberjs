var sys = require('sys');
var TestSuite = require('../dependencies/node-async-testing/async_testing').TestSuite;
var path = require('path');

var BomberResponse = require('../lib/response').Response;
var MockResponse = require('./mocks/response').MockResponse;

(new TestSuite('Response Tests'))
  .setup(function() {
      this.mr = new MockResponse();
      this.br = new BomberResponse(this.mr);
    })
  .runTests({
    "test simple": function(test) {
      test.br.send('Hi there');

      test.assert.equal(200, test.mr.status);
      test.assert.ok(test.mr.finished);
      test.assert.equal(1, test.mr.body.length);
      test.assert.equal('Hi there', test.mr.bodyText);
    },
    "test finish on send": function(test) {
      test.br.finishOnSend = false;

      test.br.send('Hi there');
      test.assert.ok(!test.mr.finished);

      test.br.send('Hello');
      test.assert.ok(!test.mr.finished);

      test.br.finish();
      test.assert.ok(test.mr.finished);
    },
    "test can't finish twice": function(test) {
      test.br.send('Hi there');
      test.assert.throws(function() {
          test.br.finish();
        });
    },
    "test can't send after finishing": function(test) {
      test.br.send('Hi there');
      test.assert.throws(function() {
          test.br.send('');
        });
    },
    "test can't send header twice": function(test) {
      test.br.sendHeaders();
      test.assert.throws(function() {
          test.br.sendHeaders();
        });
    },
    "test header isn't sent twice if manually sent": function(test) {
      //headers haven't been sent
      test.assert.ok(!test.mr.headers);
      test.br.sendHeaders();

      // now they have
      test.assert.ok(test.mr.headers);
      
      // no problem!
      test.assert.doesNotThrow(function() {
          test.br.send('hi there');
        });
    },
    "test Content-Type set automatically": function(test) {
      test.br.send('Hi there');

      test.assert.equal('text/html; charset=UTF-8', test.mr.headers['Content-Type']);
    },
    "test Content-Type set through variable": function(test) {
      test.br.mimeType = 'something';
      test.br.send('Hi there');

      test.assert.equal('something', test.mr.headers['Content-Type']);
    },
    "test Content-Type set through setHeader": function(test) {
      test.br.setHeader('Content-Type', 'something');
      test.br.send('Hi there');

      test.assert.equal('something', test.mr.headers['Content-Type']);
    },
    "test Content-Type set through headers": function(test) {
      test.br.headers['Content-Type'] = 'something';
      test.br.send('Hi there');

      test.assert.equal('something', test.mr.headers['Content-Type']);
    },
    "test Content-Type gets overriden by explicitly set header": function(test) {
      test.br.mimeType = 'text/something else';
      test.br.headers['Content-Type'] = 'something';
      test.br.send('Hi there');

      test.assert.equal('something', test.mr.headers['Content-Type']);
    },
    "test charset set automatically if known Content-Type": function(test) {
      test.br.mimeType = 'text/html';
      test.br.send('Hi there');

      test.assert.equal('text/html; charset=UTF-8', test.mr.headers['Content-Type']);
    },
    "test charset not set automatically if unknown Content-Type": function(test) {
      test.br.mimeType = 'unknown';
      test.br.send('Hi there');

      test.assert.equal('unknown', test.mr.headers['Content-Type']);
    },
    "test charset can be explicitly set": function(test) {
      test.br.mimeType = 'unknown';
      test.br.charset = 'CHARSET';
      test.br.send('Hi there');

      test.assert.equal('unknown; charset=CHARSET', test.mr.headers['Content-Type']);
    },
    "test status can be set": function(test) {
      test.br.status = 404;
      test.br.send('Hi there');

      test.assert.equal(404, test.mr.status);
    },
    "test send file": function(test) {
      test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();

      test.assert.equal(200, test.mr.status);
      test.assert.equal('this is a fake image\n', test.mr.bodyText);

      test.assert.ok(test.mr.finished);
    },
    "test send file doesn't exist": function(test) {
      test.assert.throws(function() {
          test.br.sendFile('non-existant').wait();
        });
    },
    "test send file will set Content-Type": function(test) {
      test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();
      test.assert.equal('image/png', test.mr.headers['Content-Type']);
    },
    "test send file will not override Content-Type": function(test) {
      test.br.mimeType = 'not/image';
      test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();
      test.assert.equal('not/image', test.mr.headers['Content-Type']);
    },
    "test send file with finishOnSend false": function(test) {
      test.br.finishOnSend = false;
      
      test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();

      test.assert.ok(!test.mr.finished);
    },
    "test send file with other sends": function(test) {
      test.br.finishOnSend = false;
      
      test.br.send('one');
      test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();
      test.br.send('two');

      test.assert.equal('onethis is a fake image\ntwo', test.mr.bodyText);
    },
    "test send file doesn't resend headers": function(test) {
      test.br.sendHeaders();
      test.assert.ok(test.mr.headers);
      test.mr.headers = null;
      test.assert.ok(!test.mr.headers);
      test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();
      test.assert.ok(!test.mr.headers);
    },
    "test send file resets encoding after it is finished": function(test) {
      test.br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();
      test.assert.equal(BomberResponse.__defaultEncoding, test.br.encoding);
    },
  });
