var sys = require('sys');
var assert = require('assert');

var BomberResponse = require('../lib/response').Response;

var MockResponse = function() {
  this.status = null;
  this.headers = null;
  this.body = [];
  this.finished = false;
};
MockResponse.prototype.sendHeader = function(status, headers) {
  if( this.finished ) {
    throw "Already finished";
  }
  this.status = status;
  this.headers = headers;
};
MockResponse.prototype.sendBody = function(chunk, encoding) {
  if( this.finished ) {
    throw "Already finished";
  }
  this.body.push([chunk, encoding]);
};
MockResponse.prototype.finish = function() {
  if( this.finished ) {
    throw "Already finished";
  }
  this.finished = true;
};

var tests = {
  "test simple": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);

    br.send('Hi there');

    assert.equal(200, mr.status);
    assert.equal("text/html; utf8", mr.headers['Content-Type']);
    assert.ok(mr.finished);
    assert.equal(1, mr.body.length);
  },
  "test finish on send": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);

    br._finishOnSend = false;

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
  "test set content type through variable": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.contentType = 'something';
    br.send('Hi there');

    assert.equal('something', mr.headers['Content-Type']);
  },
  "test set content type through setHeader": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.setHeader('Content-Type', 'something');
    br.send('Hi there');

    assert.equal('something', mr.headers['Content-Type']);
  },
  "test set content type through headers": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.headers['Content-Type'] = 'something';
    br.send('Hi there');

    assert.equal('something', mr.headers['Content-Type']);
  },
  "test encoding gets added to contenttype if contenttype is text/something": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.contentType = 'text/something';
    br.send('Hi there');

    assert.equal('text/something; utf8', mr.headers['Content-Type']);
  },
  "test content type gets overriden by explicitly set header": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.contentType = 'text/something else';
    br.headers['Content-Type'] = 'something';
    br.send('Hi there');

    assert.equal('something', mr.headers['Content-Type']);
  },
  "test status can be set": function() {
    var mr = new MockResponse();
    var br = new BomberResponse(mr);
    
    br.status = 404;
    br.send('Hi there');

    assert.equal(404, mr.status);
  }
};

for( var test in tests) {
  tests[test]();
}
