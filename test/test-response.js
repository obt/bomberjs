var sys = require('sys');
var assert = require('assert');
var path = require('path');

var BomberResponse = require('../lib/response').Response;
var MockResponse = require('./mocks/response').MockResponse;

var tests = {
  "test simple": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);

    br.send('Hi there');

    assert.equal(200, mr.status);
    assert.ok(mr.finished);
    assert.equal(1, mr.body.length);
    assert.equal('Hi there', mr.bodyText);
  },
  "test finish on send": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);

    br.finishOnSend = false;

    br.send('Hi there');
    assert.ok(!mr.finished);

    br.send('Hello');
    assert.ok(!mr.finished);

    br.finish();
    assert.ok(mr.finished);
  },
  "test can't finish twice": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);

    br.send('Hi there');
    assert.throws(function() {
        br.finish();
      });
  },
  "test can't send after finishing": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);

    br.send('Hi there');
    assert.throws(function() {
        br.send('');
      });
  },
  "test can't send header twice": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);

    br.sendHeaders();
    assert.throws(function() {
        br.sendHeaders();
      });
  },
  "test header isn't sent twice if manually sent": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);

    //headers haven't been sent
    assert.ok(!mr.headers);
    br.sendHeaders();

    // now they have
    assert.ok(mr.headers);
    
    // no problem!
    assert.doesNotThrow(function() {
        br.send('hi there');
      });
  },
  "test Content-Type set automatically": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.send('Hi there');

    assert.equal('text/html; charset=UTF-8', mr.headers['Content-Type']);
  },
  "test Content-Type set through variable": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.mimeType = 'something';
    br.send('Hi there');

    assert.equal('something', mr.headers['Content-Type']);
  },
  "test Content-Type set through setHeader": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.setHeader('Content-Type', 'something');
    br.send('Hi there');

    assert.equal('something', mr.headers['Content-Type']);
  },
  "test Content-Type set through headers": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.headers['Content-Type'] = 'something';
    br.send('Hi there');

    assert.equal('something', mr.headers['Content-Type']);
  },
  "test Content-Type gets overriden by explicitly set header": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.mimeType = 'text/something else';
    br.headers['Content-Type'] = 'something';
    br.send('Hi there');

    assert.equal('something', mr.headers['Content-Type']);
  },
  "test charset set automatically if known Content-Type": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.mimeType = 'text/html';
    br.send('Hi there');

    assert.equal('text/html; charset=UTF-8', mr.headers['Content-Type']);
  },
  "test charset not set automatically if unknown Content-Type": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.mimeType = 'unknown';
    br.send('Hi there');

    assert.equal('unknown', mr.headers['Content-Type']);
  },
  "test charset can be explicitly set": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.mimeType = 'unknown';
    br.charset = 'CHARSET';
    br.send('Hi there');

    assert.equal('unknown; charset=CHARSET', mr.headers['Content-Type']);
  },
  "test status can be set": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.status = 404;
    br.send('Hi there');

    assert.equal(404, mr.status);
  },
  "test send file": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();

    assert.equal(200, mr.status);
    assert.equal('this is a fake image\n', mr.bodyText);

    assert.ok(mr.finished);
  },
  "test send file doesn't exist": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    assert.throws(function() {
        br.sendFile('non-existant').wait();
      });
  },
  "test send file will set Content-Type": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();
    assert.equal('image/png', mr.headers['Content-Type']);
  },
  "test send file will not override Content-Type": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.mimeType = 'not/image';
    br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();
    assert.equal('not/image', mr.headers['Content-Type']);
  },
  "test send file with finishOnSend false": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);

    br.finishOnSend = false;
    
    br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();

    assert.ok(!mr.finished);
  },
  "test send file with other sends": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);

    br.finishOnSend = false;
    
    br.send('one');
    br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();
    br.send('two');

    assert.equal('onethis is a fake image\ntwo', mr.bodyText);
  },
  "test send file doesn't resend headers": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);

    br.sendHeaders();
    assert.ok(mr.headers);
    mr.headers = null;
    assert.ok(!mr.headers);
    br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();
    assert.ok(!mr.headers);
  },
  "test send file resets encoding after it is finished": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);

    br.sendFile(path.dirname(__filename)+'/fixtures/testApp/resources/image.png').wait();
    assert.equal(BomberResponse.__defaultEncoding, br.encoding);
  },
};

for( var test in tests) {
  tests[test]();
}
