var sys = require('sys');
var TestSuite = require('../dependencies/node-async-testing/async_testing').TestSuite;

var responses = require('../lib/http_responses');
var BomberResponse = require('../lib/response').Response;
var MockResponse = require('./mocks/response').MockResponse;

(new TestSuite('Default HTTPResponse tests'))
  .setup(function(test) {
      test.mr = new MockResponse();
      test.br = new BomberResponse(test.mr);
    })
  .runTests({
    "test a default response": function(test) {
      var r = new responses.HTTP200OK();
      r.respond(test.br);

      test.assert.equal(200, test.mr.status);
      test.assert.equal('HTTP200OK', test.mr.bodyText);
      test.assert.ok(test.mr.finished);
    },
    "test can set body in constructor": function(test) {
      var r = new responses.HTTP200OK('body');

      r.respond(test.br);
      test.assert.equal('body', test.mr.bodyText);
    },
    "test can set body explicitly": function(test) {
      var r = new responses.HTTP200OK();
      r.body = 'body';

      r.respond(test.br);
      test.assert.equal('body', test.mr.bodyText);
    },
    "test can set Content-Type": function(test) {
      var r = new responses.HTTP200OK();
      r.mimeType = 'mimetype';
      r.respond(test.br);

      test.assert.equal('mimetype', test.mr.headers['Content-Type']);
    },
    "test can set status": function(test) {
      var r = new responses.HTTP200OK();
      r.status = 200;
      r.respond(test.br);

      test.assert.equal(200, test.mr.status);
    },
  });

(new TestSuite('HTTPResponse Redirect tests'))
  .setup(function() {
      this.mr = new MockResponse();
      this.br = new BomberResponse(this.mr);
    })
  .runTests({
    "test redirect with no status": function(test) {
      var r = new responses.redirect('url');
      r.respond(test.br);

      test.assert.equal(301, test.mr.status);
      test.assert.equal('url', test.mr.headers.Location);
      test.assert.equal('', test.mr.bodyText);
      test.assert.ok(test.mr.finished);
    },
    "test redirect with status": function(test) {
      var r = new responses.redirect('url', 1);
      r.respond(test.br);

      test.assert.equal(1, test.mr.status);
      test.assert.equal('url', test.mr.headers.Location);
      test.assert.equal('', test.mr.bodyText);
      test.assert.ok(test.mr.finished);
    },
  });
