var sys = require('sys');
var TestSuite = require('../dependencies/node-async-testing/async_testing').TestSuite;

var BomberRequest = require('../lib/request').Request;
var MockRequest = require('./mocks/request').MockRequest;
var BomberResponse = require('../lib/response').Response;
var MockResponse = require('./mocks/response').MockResponse;
var Cookie = require('../lib/cookie').Cookie;

(new TestSuite('Cookie Tests'))
  .setup(function() {
      var mrequest = new MockRequest('POST', '/');
      mrequest.headers = {
          Cookie: 'one=1;two=2;three=3'
        };
      var brequest = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});

      this.mresponse = new MockResponse();
      this.bresponse = new BomberResponse(this.mresponse);

      this.cookie = new Cookie(brequest, this.bresponse, {options: { signing_secret: 'secret' }});
    })
  .runTests({
    "test read": function() {
      this.assert.equal(1, this.cookie.get('one'));
      this.assert.equal(2, this.cookie.get('two'));
      this.assert.equal(3, this.cookie.get('three'));
    },
    "test set and read": function() {
      this.cookie.set('one', 'I');
      this.assert.equal('I', this.cookie.get('one'));
    },
    "test header is set simple": function() {
      this.cookie.set('one', 'I');
      this.assert.equal('one=I;', this.bresponse.headers['Set-Cookie']);
    },
    "test header is set complicated": function() {
      var d = new Date();
      d.setTime(1);
      this.cookie.set('one', 'I', {expires: d, path: '/path', domain: 'example.com', secure: true});
      this.assert.equal('one=I; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/path; domain=example.com; secure', this.bresponse.headers['Set-Cookie']);
    },
    "test header with multiple cookies": function() {
      this.cookie.set('one', 'I');
      this.cookie.set('two', 'II');
      this.assert.equal('one=I;, two=II;', this.bresponse.headers['Set-Cookie']);
    },
  });
