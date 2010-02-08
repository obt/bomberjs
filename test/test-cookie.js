var sys = require('sys'),
    path = require('path');

var TestSuite = require('../dependencies/node-async-testing/async_testing').TestSuite;
var httpclient = require('../dependencies/node-httpclient/lib/httpclient');

var BomberRequest = require('../lib/request').Request,
    BomberResponse = require('../lib/response').Response,
    MockRequest = require('./mocks/request').MockRequest,
    MockResponse = require('./mocks/response').MockResponse,
    Cookie = require('../lib/cookie').Cookie;

// the testing apps assume that bomberjs is on the path.
require.paths.push(path.dirname(__filename)+'/../..');
var BomberServer = require('bomberjs/lib/server').Server;
var App = require('bomberjs/lib/app').App;


(new TestSuite('Cookie Tests'))
  .setup(function() {
    var mrequest = new MockRequest('POST', '/');
    mrequest.headers = {
      cookie: 'one=1;two=2;three=3'
    };
    var brequest = new BomberRequest(mrequest, {"href": "/", "pathname": "/"}, {});

    this.mresponse = new MockResponse();
    this.bresponse = new BomberResponse(this.mresponse);

    this.cookie = new Cookie(brequest, this.bresponse, {options: {security: {signing_secret: 'secret'}}});
  })
  .runTests({
    "test read": function() {
      this.assert.equal(1, this.cookie.get('one'));
      this.assert.equal(2, this.cookie.get('two'));
      this.assert.equal(3, this.cookie.get('three'));
    },
    "test read with fallback": function() {
      this.assert.equal('default', this.cookie.get('unset1', 'default'));
      this.assert.equal(null, this.cookie.get('unset2'));
    },
    "test set and read": function() {
      this.cookie.set('one', 'I');
      this.assert.equal('I', this.cookie.get('one'));
    },
    "test set, unset, read": function() {
      this.cookie.set('one', 'I');
      this.cookie.unset('one');
      this.assert.equal('none', this.cookie.get('one', 'none'));
    },
    "test header is set simple": function() {
      this.cookie.set('one', 'I');
      this.assert.ok(this.bresponse.headers['Set-Cookie']);
    },
    "test header is set complicated": function() {
      var d = new Date();
      d.setTime(1);
      this.cookie.set('one', 'I', {expires: d, path: '/path', domain: 'example.com', secure: true});
      this.assert.equal('one=I; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/path; domain=example.com; secure', this.bresponse.headers['Set-Cookie']);
    },
    "test secure set and read": function() {
      this.cookie.setSecure('secure_one', "I'm secure");
      this.cookie.setSecure('secure_two', "I'm also secure");
      this.assert.equal("I'm secure", this.cookie.getSecure('secure_one'));
      this.assert.equal("I'm also secure", this.cookie.getSecure('secure_two'));
    },
    "test secure read with fallback": function() {
      // no fallback
      this.assert.equal(null, this.cookie.getSecure('unset2'));
      // fallback
      this.assert.equal('default', this.cookie.getSecure('unset1', 'default'));

      // fallback is given because cookie has been tampered with and is as good
      // as non-existent
      this.cookie._secret = 'mangled';
      this.assert.equal('default', this.cookie.getSecure('secure_one', 'default'));
    },
    "test secure with mangled secret": function() {
      this.cookie.setSecure('secure_one', 'I');
      this.assert.equal('I', this.cookie.getSecure('secure_one'));
      // Mangle secret
      this.cookie._secret = 'mangled';
      this.assert.equal(null, this.cookie.getSecure('secure_one'));
    },
  });

(new TestSuite('Cookie Tests -- over HTTP'))
  .setup(function() {
    var app = new App('bomberjs/test/fixtures/testApp');
    this.server = new BomberServer(app);
    this.server.start();

    this.url_base = 'http://localhost:'+this.server.options.port+'/';

    this.client = new httpclient.httpclient();
  })
  .teardown(function() {
    this.server.stop();
  })
  .waitForTests()
  .runTests({
    "test set cookie": function(test) {
      // the action at this url sets a cookie...
      test.client.perform(test.url_base+'index', "GET", function(result) {
          test.assert.equal('value1', test.client.getCookie('localhost','name1'));
          test.assert.equal('value2', test.client.getCookie('localhost','name2'));
          test.finish();
        }, null);
    },
    "test read cookie": function(test) {
      test.client.perform(test.url_base+'show', "GET", function(result) {
          // no cookie has been set yet
          test.assert.equal('show action', result.response.body);
          test.assert.equal(null, test.client.getCookie('localhost','name'));

          //set the cookie
          test.client.perform(test.url_base+'index', "GET", function(result) {
              test.client.perform(test.url_base+'show', "GET", function(result) {
                  // the action read the cookie
                  test.assert.equal('show action with cookie name=value1', result.response.body);
                  test.finish();
                }, null);
            }, null);
        }, null);
    },
  });

