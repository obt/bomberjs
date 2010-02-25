var sys = require('sys');
var promise = require('../bundled/promise');

var async_testing = require('../bundled/async-testing/async_testing');

var BomberResponse = require('../lib/response').Response;
var BomberRequest = require('../lib/request').Request;
var processAction = require('../lib/action').processAction;
var MockRequest = require('./mocks/request').MockRequest;
var MockResponse = require('./mocks/response').MockResponse;

exports['Action Tests'] = (new async_testing.TestSuite())
  .addTests({
    "test return string": function(assert) {
      var mrequest = new MockRequest('GET', '/');
      var mresponse = new MockResponse();
      var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
      var response = new BomberResponse(mresponse);

      var action = function(req, res) {
        return "hi";
      }
      processAction(request, response, action);

      assert.equal(200, mresponse.status);
      assert.equal('text/html; charset=UTF-8', mresponse.headers['Content-Type']);
      assert.equal('hi', mresponse.bodyText);
    },
    "test return object": function(assert) {
      var mrequest = new MockRequest('GET', '/');
      var mresponse = new MockResponse();
      var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
      var response = new BomberResponse(mresponse);

      var obj = { a: 1, b: 2 };
      var action = function(req, res) {
        return obj;
      }
      processAction(request, response, action);

      assert.equal(200, mresponse.status);
      assert.equal('application/json', mresponse.headers['Content-Type']);
      assert.deepEqual(obj, JSON.parse(mresponse.bodyText));
    },
    "test return http response": function(assert) {
      var mrequest = new MockRequest('GET', '/');
      var mresponse = new MockResponse();
      var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
      var response = new BomberResponse(mresponse);

      var action = function(req, res) {
        return new res.build.HTTP301MovedPermanently('http://google.com');
      }
      processAction(request, response, action);

      assert.equal(301, mresponse.status);
      assert.equal('', mresponse.bodyText);
    },
    "test return promise": function(assert, finished) {
      var mrequest = new MockRequest('GET', '/');
      var mresponse = new MockResponse();
      var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
      var response = new BomberResponse(mresponse);

      var p = new promise.Promise();
      var action = function(req, res) {
        return p;
      }
      processAction(request, response, action)
        .then(function() {
            assert.equal(200, mresponse.status);
            assert.equal('hey', mresponse.bodyText);
            finished();
          });

      p.resolve('hey');
    },
    "test throw http response": function(assert, finished) {
      this.numAssertionsExpected = 1;

      var mrequest = new MockRequest('GET', '/');
      var mresponse = new MockResponse();
      var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
      var response = new BomberResponse(mresponse);

      var r = null
      var action = function(req, res) {
        r = new res.build.redirect('http://google.com');
        throw r;
      }
      processAction(request, response, action)
        .then(null, function(err) {
            assert.equal(r, err);
            finished();
          });
    },
    "test return promise return response": function(assert, finished) {
      var mrequest = new MockRequest('GET', '/');
      var mresponse = new MockResponse();
      var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
      var response = new BomberResponse(mresponse);

      var p = new promise.Promise();
      var action = function(req, res) {
        return p.then(function(arg) {
            return new res.build.redirect('http://google.com',303);
          });
      }
      processAction(request, response, action)
        .then(function() {
            assert.equal(303, mresponse.status);
            assert.equal('http://google.com', mresponse.headers['Location']);
            assert.equal('', mresponse.bodyText);
            finished();
          });

      p.resolve('hey');
    },
    "test return promise throw response": function(assert, finished) {
      this.numAssertionsExpected = 3;

      var mrequest = new MockRequest('GET', '/');
      var mresponse = new MockResponse();
      var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
      var response = new BomberResponse(mresponse);

      var p = new promise.Promise();
      var r = null;
      var action = function(req, res) {
        return p
          .then(function(arg) {
              assert.ok(true);
              return new res.build.redirect('http://google.com',303);
            })
          .then(function(arg) {
              assert.ok(true);
              r = new res.build.redirect('http://www.google.com',301);
              throw r;
            })
          .then(function(arg) {
              assert.ok(false);
            });
      }
      processAction(request, response, action)
        .then(null, function(err) {
            assert.equal(r, err);
            finished();
          });

      p.resolve('hey');
    },
    "test throw error": function(assert, finished) {
      var mrequest = new MockRequest('GET', '/');
      var mresponse = new MockResponse();
      var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
      var response = new BomberResponse(mresponse);

      var err = new Error();
      var action = function(req, res) {
        throw err;
      }
      processAction(request, response, action)
        .then(null, function(e) {
            assert.equal(err, e);
            finished();
          });
    },
    "test throw error from promise": function(assert, finished) {
      var mrequest = new MockRequest('GET', '/');
      var mresponse = new MockResponse();
      var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
      var response = new BomberResponse(mresponse);

      var p = new promise.Promise();
      var err = new Error();
      var action = function(req, res) {
        return p.then(function(arg) {
            throw err;
          });
      }
      processAction(request, response, action)
        .then(null, function(e) {
            assert.equal(err, e);
            finished();
          });

      p.resolve('hey');
    },
    "test httpresponse": function(assert) {
      var mrequest = new MockRequest('GET', '/');
      var mresponse = new MockResponse();
      var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
      var response = new BomberResponse(mresponse);

      var action = function(req, res) {
        var r = new res.build.HTTPResponse('response');
        r.status = 101;
        r.mimeType = 'text';
        return r;
      }
      processAction(request, response, action);

      assert.equal(101, mresponse.status);
      assert.equal('text', mresponse.headers['Content-Type']);
      assert.equal('response', mresponse.bodyText);
    },
  });

if (module === require.main) {
  async_testing.runSuites(exports);
}
