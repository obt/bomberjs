var sys = require('sys');
var TestSuite = require('../dependencies/node-async-testing/async_testing').TestSuite;
var Promise = require('../lib/promise').Promise;

var BomberResponse = require('../lib/response').Response;
var BomberRequest = require('../lib/request').Request;
var processAction = require('../lib/action').processAction;

var MockRequest = require('./mocks/request').MockRequest;
var MockResponse = require('./mocks/response').MockResponse;

(new TestSuite('Action Tests')).runTests({
  "test return string": function(test) {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new BomberResponse(mresponse);

    var action = function(req, res) {
      return "hi";
    }
    processAction(request, response, action);

    test.assert.equal(200, mresponse.status);
    test.assert.equal('text/html; charset=UTF-8', mresponse.headers['Content-Type']);
    test.assert.equal('hi', mresponse.bodyText);
  },
  "test return object": function(test) {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new BomberResponse(mresponse);

    var obj = { a: 1, b: 2 };
    var action = function(req, res) {
      return obj;
    }
    processAction(request, response, action);

    test.assert.equal(200, mresponse.status);
    test.assert.equal('application/json', mresponse.headers['Content-Type']);
    test.assert.deepEqual(obj, JSON.parse(mresponse.bodyText));
  },
  "test return http response": function(test) {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new BomberResponse(mresponse);

    var action = function(req, res) {
      return new res.build.HTTP301MovedPermanently('http://google.com');
    }
    processAction(request, response, action);

    test.assert.equal(301, mresponse.status);
    test.assert.equal('', mresponse.bodyText);
  },
  "test return promise": function(test) {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new BomberResponse(mresponse);

    var promise = new Promise();
    var action = function(req, res) {
      return promise;
    }
    processAction(request, response, action);

    promise.callback('hey');

    test.assert.equal(200, mresponse.status);
    test.assert.equal('hey', mresponse.bodyText);
  },
  "test throw http response": function(test) {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new BomberResponse(mresponse);

    var action = function(req, res) {
      throw new res.build.redirect('http://google.com');
    }
    processAction(request, response, action);

    test.assert.equal(301, mresponse.status);
    test.assert.equal('http://google.com', mresponse.headers['Location']);
    test.assert.equal('', mresponse.bodyText);
  },
  "test return promise return response": function(test) {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new BomberResponse(mresponse);

    var promise = new Promise();
    var action = function(req, res) {
      promise.addCallback(function(arg) {
          return new res.build.redirect('http://google.com',303);
        });
      return promise;
    }
    processAction(request, response, action);

    promise.callback('hey');

    test.assert.equal(303, mresponse.status);
    test.assert.equal('http://google.com', mresponse.headers['Location']);
    test.assert.equal('', mresponse.bodyText);
  },
  "test return promise throw response": function(test) {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new BomberResponse(mresponse);

    var promise = new Promise();
    var gotHere1 = false;
    var gotHere2 = false;
    var didntGetHere = true;
    var action = function(req, res) {
      promise.addCallback(function(arg) {
          gotHere1 = true;
          return new res.build.redirect('http://google.com',303);
        });
      promise.addCallback(function(arg) {
          gotHere2 = true;
          throw new res.build.redirect('http://www.google.com',301);
        });
      promise.addCallback(function(arg) {
          didntGetHere = false;
          return "hi";
        });
      return promise;
    }
    processAction(request, response, action);

    promise.callback('hey');

    test.assert.ok(gotHere1);
    test.assert.ok(gotHere2);
    test.assert.ok(didntGetHere);

    test.assert.equal(301, mresponse.status);
    test.assert.equal('http://www.google.com', mresponse.headers['Location']);
    test.assert.equal('', mresponse.bodyText);
  },
  "test throw error": function(test) {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new BomberResponse(mresponse);

    var action = function(req, res) {
      throw new Error();
    }
    processAction(request, response, action);

    test.assert.equal(500, mresponse.status);
  },
  "test throw error from promise": function(test) {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new BomberResponse(mresponse);

    var promise = new Promise();
    var action = function(req, res) {
      promise.addCallback(function(arg) {
          throw new Error();
        });
      return promise;
    }
    processAction(request, response, action);

    promise.callback('hey');

    test.assert.equal(500, mresponse.status);
  },
  "test httpresponse": function(test) {
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

    test.assert.equal(101, mresponse.status);
    test.assert.equal('text', mresponse.headers['Content-Type']);
    test.assert.equal('response', mresponse.bodyText);
  },
});
