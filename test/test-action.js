var sys = require('sys');
var assert = require('assert');
var Promise = require('../lib/promise').Promise;

var MockRequest = require('./mocks').MockRequest;
var MockResponse = require('./mocks').MockResponse;

var Response = require('../lib/response').Response;
var Request = require('../lib/request').Request;
var processAction = require('../lib/action').processAction;

var HTTP301MovedPermanently = require('../lib/http_responses').HTTP301MovedPermanently;
var HTTP303SeeOther = require('../lib/http_responses').HTTP303SeeOther;

var tests = {
  "test return string": function() {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new Request(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new Response(mresponse);

    var action = function(req, request) {
      return "hi";
    }
    processAction(request, response, action);

    assert.equal(200, mresponse.status);
    assert.equal('text/html; utf8', mresponse.headers['Content-Type']);
    assert.equal('hi', mresponse.bodyText);
  },
  "test return object": function() {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new Request(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new Response(mresponse);

    var obj = { a: 1, b: 2 };
    var action = function(req, request) {
      return obj;
    }
    processAction(request, response, action);

    assert.equal(200, mresponse.status);
    assert.equal('text/json; utf8', mresponse.headers['Content-Type']);
    assert.deepEqual(obj, JSON.parse(mresponse.bodyText));
  },
  "test return http response": function() {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new Request(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new Response(mresponse);

    var action = function(req, request) {
      return new HTTP301MovedPermanently('http://google.com');
    }
    processAction(request, response, action);

    assert.equal(301, mresponse.status);
    assert.equal('', mresponse.bodyText);
  },
  "test return promise": function() {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new Request(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new Response(mresponse);

    var promise = new Promise();
    var action = function(req, request) {
      return promise;
    }
    processAction(request, response, action);

    promise.callback('hey');

    assert.equal(200, mresponse.status);
    assert.equal('hey', mresponse.bodyText);
  },
  "test throw http response": function() {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new Request(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new Response(mresponse);

    var action = function(req, request) {
      throw new HTTP301MovedPermanently('http://google.com');
    }
    processAction(request, response, action);

    assert.equal(301, mresponse.status);
    assert.equal('http://google.com', mresponse.headers['Location']);
    assert.equal('', mresponse.bodyText);
  },
  "test return promise return response": function() {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new Request(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new Response(mresponse);

    var promise = new Promise();
    var action = function(req, request) {
      promise.addCallback(function(arg) {
          return new HTTP303SeeOther('http://google.com');
        });
      return promise;
    }
    processAction(request, response, action);

    promise.callback('hey');

    assert.equal(303, mresponse.status);
    assert.equal('http://google.com', mresponse.headers['Location']);
    assert.equal('', mresponse.bodyText);
  },
  "test return promise throw response": function() {
    var mrequest = new MockRequest('GET', '/');
    var mresponse = new MockResponse();
    var request = new Request(mrequest, {"href": "/", "pathname": "/"}, {});
    var response = new Response(mresponse);

    var promise = new Promise();
    var gotHere1 = false;
    var gotHere2 = false;
    var didntGetHere = true;
    var action = function(req, request) {
      promise.addCallback(function(arg) {
          gotHere1 = true;
          return new HTTP303SeeOther('http://google.com');
        });
      promise.addCallback(function(arg) {
          gotHere2 = true;
          throw new HTTP301MovedPermanently('http://www.google.com');
        });
      promise.addCallback(function(arg) {
          didntGetHere = false;
          return "hi";
        });
      return promise;
    }
    processAction(request, response, action);

    promise.callback('hey');

    assert.ok(gotHere1);
    assert.ok(gotHere2);
    assert.ok(didntGetHere);

    assert.equal(301, mresponse.status);
    assert.equal('http://www.google.com', mresponse.headers['Location']);
    assert.equal('', mresponse.bodyText);
  }
};

for( var test in tests) {
  tests[test]();
}
