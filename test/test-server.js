var sys = require('sys'),
    path = require('path'),
    continuables = require('continuables');

var async_testing = require('../bundled/async-testing/async_testing'),
    httpclient = require('../bundled/httpclient/lib/httpclient');

var responses = require('../lib/http_responses');

// the testing apps assume that bomberjs is on the path.
require.paths.push(path.dirname(__filename)+'/../..');
var BomberServer = require('bomberjs/lib/server').Server;
var App = require('bomberjs/lib/app').App;

exports['Server Tests -- over HTTP'] = (new async_testing.TestSuite())
  .setup(function() {
    this.project = {config:{}};
    this.project.base_app = new App('bomberjs/test/fixtures/testApp', this.project);
    this.server = new BomberServer(this.project);

    this.url_base = 'http://localhost:'+this.project.config.server.port+'/server-tests/';

    this.client = new httpclient.httpclient();
  })
  .teardown(function(finished) {
    if( this.server.running ) {
      this.server.stop(finished);
    }
    else {
      finished();
    }
  })
  .addTests({
    "test server emits start event": function(assert, finished, test) {
      test.numAssertionsExpected = 2;
      test.server.listen('start', function() {
          assert.ok(true);
        });
      test.server.listen('start', function() {
          assert.ok(true);
        });
      test.server.start(function() {
          test.server.stop(function() {
              finished();
            });
        });
    },
    "test start event can return error": function(assert) {
      this.numAssertionsExpected = 0;
      this.server.listen('start', function() {
          return new Error('This error in test results is expected output');
        });
      this.server.listen('start', function() {
          // should not be called
          assert.ok(false);
        });
    },
    "test server emits stop event": function(assert, finished, test) {
      test.numAssertionsExpected = 2;
      test.server.listen('stop', function() {
          assert.ok(true);
        });
      test.server.listen('stop', function() {
          assert.ok(true);
        });
      test.server.start(function() {
          test.server.stop(function() {
              finished();
            });
        });
    },
    "test server emits request event": function(assert, finished, test) {
      test.numAssertionsExpected = 2;
      test.server.listen('request', function(rr, cb) {
          assert.ok(true);
          return rr;
        });
      test.server.listen('request', function(rr, cb) {
          assert.ok(true);
          return rr;
        });
      test.server.start(function() {
          test.client.perform(test.url_base+'index', "GET", function(result) {
              test.server.stop(function() {
                  finished();
                });
            }, null);
        });
    },
    "test request listener can manipulate response": function(assert, finished, test) {
      test.numAssertionsExpected = 1;
      test.server.listen('request', function(rr) {
          rr.response.send('response');
        });
      test.server.listen('request', function(rr) {
          // this shouldn't be called
          assert.ok(false);
        });
      test.server.start(function() {
          test.client.perform(test.url_base+'index', "GET", function(result) {
              assert.equal('response', result.response.body);
              test.server.stop(function() {
                  finished();
                });
            }, null);
        });
    },
    "test request listener can return HTTPResponse": function(assert, finished, test) {
      test.numAssertionsExpected = 1;
      test.server.listen('request', function(rr) {
          return new rr.response.build.forbidden();
        });
      test.server.listen('request', function(rr) {
          // this shouldn't be called
          assert.ok(false);
        });
      test.server.start(function() {
          test.client.perform(test.url_base+'index', "GET", function(result) {
              assert.equal(403, result.response.status);
              test.server.stop(function() {
                  finished();
                });
            }, null);
        });
    },
    "test request listener can throw Error": function(assert, finished, test) {
      test.numAssertionsExpected = 1;
      test.server.listen('request', function(rr) {
          throw new Error('uh oh');
        });
      test.server.listen('request', function(rr) {
          // this shouldn't be called
          assert.ok(false);
        });
      test.server.start(function() {
          test.client.perform(test.url_base+'index', "GET", function(result) {
              assert.equal(500, result.response.status);
              test.server.stop(function() {
                  finished();
                });
            }, null);
        });
    },
    "test request listener can manipulate request url": function(assert, finished, test) {
      test.numAssertionsExpected = 1;
      test.server.listen('request', function(rr) {
          rr.request.raw_url = '/server-tests/show';
          return rr;
        });
      test.server.start(function() {
          test.client.perform(test.url_base+'index', "GET", function(result) {
              assert.equal('show', result.response.body);
              test.server.stop(function() {
                  finished();
                });
            }, null);
        });
    },
    "test error listener can return Response": function(assert, finished, test) {
      test.numAssertionsExpected = 2;
      var err = new Error();
      var response = null;
      test.server.listen('request', function(rr) {
          response = new rr.response.build.forbidden();
          throw err;
        });
      test.server.listen('error', function(error) {
          assert.equal(err, error);
          return response;
        });
      test.server.start(function() {
          test.client.perform(test.url_base+'index', "GET", function(result) {
              assert.equal(403, result.response.status);
              test.server.stop(function() {
                  finished();
                });
            }, null);
        });
    },
    "test server sends 404 if route can't be found": function(assert, finished, test) {
      test.numAssertionsExpected = 1;
      test.server.start(function() {
          test.client.perform(test.url_base+'../NOTFOUND', "GET", function(result) {
              assert.equal(404, result.response.status);
              test.server.stop(function() {
                  finished();
                });
            }, null);
        });
    },
  });

if (module === require.main) {
  async_testing.runSuites(exports);
}
