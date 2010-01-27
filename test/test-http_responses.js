var sys = require('sys');
var assert = require('assert');

var responses = require('../lib/http_responses');
var BomberResponse = require('../lib/response').Response;
var MockResponse = require('./mocks/response').MockResponse;

var default_response_tests = {
  "test a default response": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    var r = new responses.HTTP200OK();

    r.respond(br);

    assert.equal(200, mr.status);
    assert.equal('HTTP200OK', mr.bodyText);
    assert.ok(mr.finished);
  },
  "test can set body in constructor": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    var r = new responses.HTTP200OK('body');

    r.respond(br);
    assert.equal('body', mr.bodyText);
  },
  "test can set body explicitly": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    var r = new responses.HTTP200OK();
    r.body = 'body';

    r.respond(br);
    assert.equal('body', mr.bodyText);
  },
  "test can set Content-Type": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    var r = new responses.HTTP200OK();
    r.mimeType = 'mimetype';

    r.respond(br);

    assert.equal('mimetype', mr.headers['Content-Type']);
  },
  "test can set status": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    var r = new responses.HTTP200OK();
    r.status = 200;

    r.respond(br);

    assert.equal(200, mr.status);
  },
};

for( var test in default_response_tests) {
  default_response_tests[test]();
}

var redirect_tests = {
  "test redirect with no status": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    var r = new responses.redirect('url');

    r.respond(br);

    assert.equal(301, mr.status);
    assert.equal('url', mr.headers.Location);
    assert.equal('', mr.bodyText);
    assert.ok(mr.finished);
  },
  "test redirect with status": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    var r = new responses.redirect('url', 1);

    r.respond(br);

    assert.equal(1, mr.status);
    assert.equal('url', mr.headers.Location);
    assert.equal('', mr.bodyText);
    assert.ok(mr.finished);
  },
};

for( var test in redirect_tests) {
  redirect_tests[test]();
}
