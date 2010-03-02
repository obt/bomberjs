var sys = require('sys'),
    path = require('path');

var async_testing = require('../bundled/async-testing/async_testing'),
    httpclient = require('../bundled/httpclient/lib/httpclient');

// the testing apps assume that bomberjs is on the path.
require.paths.push(path.dirname(__filename)+'/../..');
var BomberServer = require('bomberjs/lib/server').Server;
var App = require('bomberjs/lib/app').App;

exports['Cookie Tests -- over HTTP'] = (new async_testing.TestSuite())
  .setup(function(finished) {
    this.project = {config:{}};
    this.project.base_app = new App('bomberjs/test/fixtures/testApp', this.project);
    this.server = new BomberServer(this.project);

    this.url_base = 'http://localhost:'+this.project.config.server.port+'/cookie-tests/';

    this.client = new httpclient.httpclient();

    this.server.start(finished);
  })
  .teardown(function() {
    this.server.stop();
  })
  .addTests({
    "test set cookie": function(assert, finished, test) {
      test.client.perform(test.url_base+'set?name1=value1&name2=value2', "GET", function(result) {
          assert.equal(200, result.response.status);
          // client reads them fine
          assert.equal('value1', test.client.getCookie('localhost','name1'));
          assert.equal('value2', test.client.getCookie('localhost','name2'));

          // the action can immediately read them after setting them
          assert.equal('value1,value2',result.response.body);
          finished();
        }, null);
    },
    "test read cookie": function(assert, finished, test) {
      test.client.perform(test.url_base+'read?name', "GET", function(result) {
          //cookie doesn't exist
          assert.equal('', result.response.body);
          //set it
          test.client.perform(test.url_base+'set?name=value', "GET", function(result) {
              // now read it out
              test.client.perform(test.url_base+'read?name', "GET", function(result) {
                  assert.equal('value', result.response.body);
                  finished();
                }, null);
            }, null);
        }, null);
    },
    "test read cookie default value": function(assert, finished, test) {
      test.client.perform(test.url_base+'read?name&_default=4', "GET", function(result) {
          assert.equal('4', result.response.body);
          finished();
        }, null);
    },
    "test set secure cookie": function(assert, finished, test) {
      test.client.perform(test.url_base+'setSecure?name1=value1&name2=value2', "GET", function(result) {
          // can't read it in client
          assert.notEqual('value1', test.client.getCookie('localhost','name1'));
          assert.notEqual('value2', test.client.getCookie('localhost','name2'));
          finished();
        }, null);
    },
    "test read secure cookie": function(assert, finished, test) {
      test.client.perform(test.url_base+'readSecure?name', "GET", function(result) {
          //cookie doesn't exist
          assert.equal('', result.response.body);
          //set it
          test.client.perform(test.url_base+'setSecure?name=value', "GET", function(result) {
              // can't read it normally
              test.client.perform(test.url_base+'read?name', "GET", function(result) {
                  assert.notEqual('value', result.response.body);
                  // can read it using secure function
                  test.client.perform(test.url_base+'readSecure?name', "GET", function(result) {
                      assert.equal('value', result.response.body);
                      finished();
                    }, null);
                }, null);
            }, null);
        }, null);
    },
    "test read secure cookie default value": function(assert, finished, test) {
      test.client.perform(test.url_base+'readSecure?name&_default=4', "GET", function(result) {
          assert.equal('4', result.response.body);
          finished();
        }, null);
    },
    "test read secure cookie with mangled secret": function(assert, finished, test) {
      test.client.perform(test.url_base+'setSecure?name=value', "GET", function(result) {
          test.project.config.security.signing_secret = 'mangled';
          test.client.perform(test.url_base+'readSecure?name', "GET", function(result) {
              assert.equal('', result.response.body);
              finished();
            }, null);
        }, null);
    },
    "test unset cookie": function(assert, finished, test) {
      // first set the cookies
      test.client.perform(test.url_base+'set?name1=value1&name2=value2', "GET", function(result) {
          // now unset one
          test.client.perform(test.url_base+'unset?name2', "GET", function(result) {
              // the client no longer has the cookie
              assert.equal('value1', test.client.getCookie('localhost','name1'));
              assert.equal('', test.client.getCookie('localhost','name2'));

              // if the action tries to read the unset cookie it gets nothing
              assert.equal('', result.response.body);
              finished();
          }, null);
        }, null);
    },
    "test keys()": function(assert, finished, test) {
      // first set the cookies
      test.client.perform(test.url_base+'set?session_key=1&name1=value1&name2=value2', "GET", function(result) {
          // now read the keys
          test.client.perform(test.url_base+'keys', "GET", function(result) {
              assert.equal('session_key,name1,name2', result.response.body);
              finished();
          }, null);
        }, null);
    },
    "test keys()": function(assert, finished, test) {
      // first set the cookies
      test.client.perform(test.url_base+'set?name1=value1', "GET", function(result) {
          // now read the keys
          test.client.perform(test.url_base+'exists?name1&name2', "GET", function(result) {
              assert.equal('1,0', result.response.body);
              finished();
          }, null);
        }, null);
    },
    "test reset cookies": function(assert, finished, test) {
        //set cookie
        test.client.perform(test.url_base+'set?name1=value1&name2=value2', "GET", function(result) {
            // now reset them
            test.client.perform(test.url_base+'reset', "GET", function(result) {
                assert.equal('', test.client.getCookie('localhost','name1'));
                assert.equal('', test.client.getCookie('localhost','name2'));

                test.client.perform(test.url_base+'read?name1&name2', "GET", function(result) {
                    assert.equal('', result.response.body);
                    finished();
                  }, null);
              }, null);
          }, null);
    },
  });

if (module === require.main) {
  async_testing.runSuites(exports);
}
