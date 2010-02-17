var sys = require('sys');

var async_testing = require('../dependencies/node-async-testing/async_testing');

var responses = require('../lib/http_responses'),
    BomberResponse = require('../lib/response').Response,
    MockResponse = require('./mocks/response').MockResponse;

exports['Default HTTPResponse tests'] = (new async_testing.TestSuite())
  .setup(function() {
      this.mr = new MockResponse();
      this.br = new BomberResponse(this.mr);
    })
  .addTests({
    "test a default response": function(assert) {
      var r = new responses.HTTP200OK();
      r.respond(this.br);

      assert.equal(200, this.mr.status);
      assert.equal('HTTP200OK', this.mr.bodyText);
      assert.ok(this.mr.closed);
    },
    "test can set body in constructor": function(assert) {
      var r = new responses.HTTP200OK('body');

      r.respond(this.br);
      assert.equal('body', this.mr.bodyText);
    },
    "test can set body explicitly": function(assert) {
      var r = new responses.HTTP200OK();
      r.body = 'body';

      r.respond(this.br);
      assert.equal('body', this.mr.bodyText);
    },
    "test can set Content-Type": function(assert) {
      var r = new responses.HTTP200OK();
      r.mimeType = 'mimetype';
      r.respond(this.br);

      assert.equal('mimetype', this.mr.headers['Content-Type']);
    },
    "test can set status": function(assert) {
      var r = new responses.HTTP200OK();
      r.status = 200;
      r.respond(this.br);

      assert.equal(200, this.mr.status);
    },
  });

exports['HTTPResponse Redirect tests'] = (new async_testing.TestSuite())
  .setup(function() {
      this.mr = new MockResponse();
      this.br = new BomberResponse(this.mr);
    })
  .addTests({
    "test redirect with no status": function(assert) {
      var r = new responses.redirect('url');
      r.respond(this.br);

      assert.equal(301, this.mr.status);
      assert.equal('url', this.mr.headers.Location);
      assert.equal('', this.mr.bodyText);
      assert.ok(this.mr.closed);
    },
    "test redirect with status": function(assert) {
      var r = new responses.redirect('url', 1);
      r.respond(this.br);

      assert.equal(1, this.mr.status);
      assert.equal('url', this.mr.headers.Location);
      assert.equal('', this.mr.bodyText);
      assert.ok(this.mr.closed);
    },
  });

if (module === require.main) {
  async_testing.runSuites(exports);
}
