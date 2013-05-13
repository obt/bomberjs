var testing = require('async_testing');

var routing = require('../routing');

exports.routing = new testing.TestSuite()
  .addTests(
    { 'matching': function(assert) {
        routing.init(this);
        this.route(
          [ ['/',             'A']
          , ['/B',            'B']
          , ['/C/:a',         'C']
          , ['/D/:a/:b',      'D']
          , ['/E/*',          'E']
          , ['/F*',           'F']
          , ['/G/*/*',        'G']
          , ['/H/*.*',        'H']
          , ['/I/:a/*',       'I']
          , ['/J/*/:a/*/:b',  'J']
          ]);

        assert.deepEqual(this.findRoute('GET', '/'),  { action: 'A' });
        assert.deepEqual(this.findRoute('GET', '/B'), { action: 'B' });
        assert.equal(this.findRoute('GET', '/Bextra'), null);
        assert.deepEqual(this.findRoute('GET', '/C/1'), { action: 'C', params: {a: 1} });
        assert.equal(this.findRoute('GET', '/C'), null);
        assert.equal(this.findRoute('GET', '/C/'), null);
        assert.deepEqual(this.findRoute('GET', '/D/1/2'), { action: 'D', params: {a: 1, b: 2} });
        assert.equal(this.findRoute('GET', '/D/1'), null);
        assert.equal(this.findRoute('GET', '/D/1/'), null);
        assert.deepEqual(this.findRoute('GET', '/E/1'), { action: 'E', args: ['1'] });
        assert.deepEqual(this.findRoute('GET', '/E/1.2'), { action: 'E', args: ['1.2'] });
        assert.deepEqual(this.findRoute('GET', '/E/1/2'), { action: 'E', args: ['1/2'] });
        assert.deepEqual(this.findRoute('GET', '/F1'), { action: 'F', args: ['1'] });
        assert.deepEqual(this.findRoute('GET', '/G/1/2'), { action: 'G', args: ['1','2'] });
        assert.deepEqual(this.findRoute('GET', '/H/1.2'), { action: 'H', args: ['1','2'] });
        assert.deepEqual(this.findRoute('GET', '/I/1/2'), { action: 'I', params: {a: 1}, args: ['2'] });
        assert.deepEqual(this.findRoute('GET', '/J/1/2/33/4'), { action: 'J', params: {a: 2, b: 4}, args: ['1','33'] });
      }
    , 'regexs': function(assert) {
        routing.init(this);
        this.route(
          [ ['~ ^\/$',                   'A']
          , ['~ ^\/(a)$',                'B']
          , ['~ ^\/(a)\/(b)$',           'C']
          , ['~ ^\/(a)\.(txt|html)$',     'D']
          ]);

      require('sys').p(this._routes);

      assert.deepEqual(this.findRoute('GET', '/'), { action: 'A' });
      assert.deepEqual(this.findRoute('GET', '/a'), { action: 'B', args: ['a'] });
      assert.deepEqual(this.findRoute('GET', '/a/b'), { action: 'C', args: ['a','b'] });
      assert.deepEqual(this.findRoute('GET', '/a.txt'), { action: 'D', args: ['a','txt'] });
    }
  });

if (module === require.main) {
  testing.runSuites(exports);
}
