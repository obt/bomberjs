var sys = require('sys'),
    path = require('path');

var TestSuite = require('../dependencies/node-async-testing/async_testing').TestSuite,
    httpclient = require('../dependencies/node-httpclient/lib/httpclient');

// the testing apps assume that bomberjs is on the path.
require.paths.push(path.dirname(__filename)+'/../..');
var BomberServer = require('bomberjs/lib/server').Server;
var App = require('bomberjs/lib/app').App;

(new TestSuite('Cookie Tests -- over HTTP'))
  .setup(function() {
    var app = new App('bomberjs/test/fixtures/testApp');
    this.server = new BomberServer(app);
    this.server.start();

    this.url_base = 'http://localhost:'+this.server.options.port+'/cookie-tests/';

    this.client = new httpclient.httpclient();
  })
  .teardown(function() {
    this.server.stop();
  })
  .waitForTests()
  .runTests({
    "test set cookie": function(test) {
      test.client.perform(test.url_base+'set?name1=value1&name2=value2', "GET", function(result) {
          // client reads them fine
          test.assert.equal('value1', test.client.getCookie('localhost','name1'));
          test.assert.equal('value2', test.client.getCookie('localhost','name2'));

          // the action can immediately read them after setting them
          test.assert.equal('value1,value2',result.response.body);
          test.finish();
        }, null);
    },
    "test read cookie": function(test) {
      test.client.perform(test.url_base+'read?name', "GET", function(result) {
          //cookie doesn't exist
          test.assert.equal('', result.response.body);
          //set it
          test.client.perform(test.url_base+'set?name=value', "GET", function(result) {
              // now read it out
              test.client.perform(test.url_base+'read?name', "GET", function(result) {
                  test.assert.equal('value', result.response.body);
                  test.finish();
                }, null);
            }, null);
        }, null);
    },
    "test read cookie default value": function(test) {
      test.client.perform(test.url_base+'read?name&_default=4', "GET", function(result) {
          test.assert.equal('4', result.response.body);
          test.finish();
        }, null);
    },
    "test set secure cookie": function(test) {
      test.client.perform(test.url_base+'setSecure?name1=value1&name2=value2', "GET", function(result) {
          // can't read it in client
          test.assert.notEqual('value1', test.client.getCookie('localhost','name1'));
          test.assert.notEqual('value2', test.client.getCookie('localhost','name2'));
          test.finish();
        }, null);
    },
    "test read secure cookie": function(test) {
      test.client.perform(test.url_base+'readSecure?name', "GET", function(result) {
          //cookie doesn't exist
          test.assert.equal('', result.response.body);
          //set it
          test.client.perform(test.url_base+'setSecure?name=value', "GET", function(result) {
              // can't read it normally
              test.client.perform(test.url_base+'read?name', "GET", function(result) {
                  test.assert.notEqual('value', result.response.body);
                  // can read it using secure function
                  test.client.perform(test.url_base+'readSecure?name', "GET", function(result) {
                      test.assert.equal('value', result.response.body);
                      test.finish();
                    }, null);
                }, null);
            }, null);
        }, null);
    },
    "test read secure cookie default value": function(test) {
      test.client.perform(test.url_base+'readSecure?name&_default=4', "GET", function(result) {
          test.assert.equal('4', result.response.body);
          test.finish();
        }, null);
    },
    "test read secure cookie with mangled secret": function(test) {
      test.client.perform(test.url_base+'setSecure?name=value', "GET", function(result) {
          test.server.options.security.signing_secret = 'mangled';
          test.client.perform(test.url_base+'readSecure?name', "GET", function(result) {
              test.assert.equal('', result.response.body);
              test.finish();
            }, null);
        }, null);
    },
    "test unset cookie": function(test) {
      // first set the cookies
      test.client.perform(test.url_base+'set?name1=value1&name2=value2', "GET", function(result) {
          // now unset one
          test.client.perform(test.url_base+'unset?name2', "GET", function(result) {
              // the client no longer has the cookie
              test.assert.equal('value1', test.client.getCookie('localhost','name1'));
              test.assert.equal('', test.client.getCookie('localhost','name2'));

              // if the action tries to read the unset cookie it gets nothing
              test.assert.equal('', result.response.body);
              test.finish();
          }, null);
        }, null);
    },
    "test keys()": function(test) {
      // first set the cookies
      test.client.perform(test.url_base+'set?session_key=1&name1=value1&name2=value2', "GET", function(result) {
          // now read the keys
          test.client.perform(test.url_base+'keys', "GET", function(result) {
              test.assert.equal('session_key,name1,name2', result.response.body);
              test.finish();
          }, null);
        }, null);
    },
    "test keys()": function(test) {
      // first set the cookies
      test.client.perform(test.url_base+'set?name1=value1', "GET", function(result) {
          // now read the keys
          test.client.perform(test.url_base+'exists?name1&name2', "GET", function(result) {
              test.assert.equal('1,0', result.response.body);
              test.finish();
          }, null);
        }, null);
    },
    "test reset cookies": function(test) {
        //set cookie
        test.client.perform(test.url_base+'set?name1=value1&name2=value2', "GET", function(result) {
            // now reset them
            test.client.perform(test.url_base+'reset', "GET", function(result) {
                test.assert.equal('', test.client.getCookie('localhost','name1'));
                test.assert.equal('', test.client.getCookie('localhost','name2'));

                test.client.perform(test.url_base+'read?name1&name2', "GET", function(result) {
                    test.assert.equal('', result.response.body);
                    test.finish();
                  }, null);
              }, null);
          }, null);
    },
  });

