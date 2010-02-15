var sys = require('sys'),
    path = require('path'),
    continuables = require('continuables');

var TestSuite = require('../dependencies/node-async-testing/async_testing').TestSuite,
    httpclient = require('../dependencies/node-httpclient/lib/httpclient'),
    responses = require('../lib/http_responses');

// the testing apps assume that bomberjs is on the path.
require.paths.push(path.dirname(__filename)+'/../..');
var BomberServer = require('bomberjs/lib/server').Server;
var App = require('bomberjs/lib/app').App;

(new TestSuite('Server Tests -- over HTTP'))
  .setup(function() {
    this.project = {config:{}};
    this.project.base_app = new App('bomberjs/test/fixtures/testApp', this.project);
    this.server = new BomberServer(this.project);

    this.url_base = 'http://192.168.56.101:'+this.project.config.server.port+'/server-tests/';

    this.client = new httpclient.httpclient();
  })
  .waitForTests()
  .runTests({
    "test server emits start event": function(test) {
      test.numAssertionsExpected = 2;
      test.server.listen('start', function() {
          test.assert.ok(true);
        });
      test.server.listen('start', function() {
          test.assert.ok(true);
        });
      test.server.start();
      test.server.stop();
      test.finish();
    },
    "test start event can return error": function(test) {
      test.numAssertionsExpected = 0;
      test.server.listen('start', function() {
          return new Error('This error in test results is expected output');
        });
      test.server.listen('start', function() {
          // should not be called
          test.assert.ok(false);
        });
      test.server.start();
      test.finish();
    },
    "test server emits stop event": function(test) {
      test.numAssertionsExpected = 2;
      test.server.listen('stop', function() {
          test.assert.ok(true);
        });
      test.server.listen('stop', function() {
          test.assert.ok(true);
        });
      test.server.start();
      test.server.stop();
      test.finish();
    },
    "test server emits request event": function(test) {
      test.numAssertionsExpected = 2;
      test.server.listen('request', function(rr) {
          test.assert.ok(true);
          return rr;
        });
      test.server.listen('request', function(rr) {
          test.assert.ok(true);
          return rr;
        });
      test.server.start();
      test.client.perform(test.url_base+'index', "GET", function(result) {
          test.server.stop();
          test.finish();
        }, null);
    },
    "test request listener can manipulate response": function(test) {
      test.numAssertionsExpected = 1;
      test.server.listen('request', function(rr) {
          rr.response.send('response');
        });
      test.server.listen('request', function(rr) {
          // this shouldn't be called
          test.assert.ok(false);
        });
      test.server.start();
      test.client.perform(test.url_base+'index', "GET", function(result) {
          test.assert.equal('response', result.response.body);
          test.server.stop();
          test.finish();
        }, null);
    },
    "test request listener can return HTTPResponse": function(test) {
      test.numAssertionsExpected = 1;
      test.server.listen('request', function(rr) {
          return new rr.response.build.forbidden();
        });
      test.server.listen('request', function(rr) {
          // this shouldn't be called
          test.assert.ok(false);
        });
      test.server.start();
      test.client.perform(test.url_base+'index', "GET", function(result) {
          test.assert.equal(403, result.response.status);
          test.server.stop();
          test.finish();
        }, null);
    },
    "test request listener can return Error": function(test) {
      test.numAssertionsExpected = 1;
      test.server.listen('request', function(rr) {
          return new Error();
        });
      test.server.listen('request', function(rr) {
          // this shouldn't be called
          test.assert.ok(false);
        });
      test.server.start();
      test.client.perform(test.url_base+'index', "GET", function(result) {
          test.assert.equal(500, result.response.status);
          test.server.stop();
          test.finish();
        }, null);
    },
    "test request listener can manipulate request": function(test) {
      test.numAssertionsExpected = 1;
      test.server.listen('request', function(rr) {
          rr.request.raw_url = '/server-tests/show';

          return rr;
        });
      test.server.start();
      test.client.perform(test.url_base+'index', "GET", function(result) {
          test.assert.equal('show', result.response.body);
          test.server.stop();
          test.finish();
        }, null);
    },
    "test error listener can return Response": function(test) {
      test.numAssertionsExpected = 2;
      var err = new Error();
      var response = null;
      test.server.listen('request', function(rr) {
          response = new rr.response.build.forbidden();
          return err;
        });
      test.server.listen('error', function(error) {
          test.assert.equal(err, error);
          return response;
        });
      test.server.start();
      test.client.perform(test.url_base+'index', "GET", function(result) {
          test.assert.equal(403, result.response.status);
          test.server.stop();
          test.finish();
        }, null);
    },
    "test server sends 404 if route can't be found": function(test) {
      test.numAssertionsExpected = 1;
      test.server.start();
      test.client.perform(test.url_base+'../NOTFOUND', "GET", function(result) {
          test.assert.equal(404, result.response.status);
          test.server.stop();
          test.finish();
        }, null);
    },
  });

