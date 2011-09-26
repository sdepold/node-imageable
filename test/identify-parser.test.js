var assert         = require('assert')
  , vows           = require('vows')
  , IdentifyParser = require('../lib/identify-parser')

vows.describe('identify-parser').addBatch({
  "#parse": {
    "should return json": function() {
      assert.deepEqual(IdentifyParser.parse("foo: bar\n  a: b"), {a:'b'})
    },
    "should parse keys with colons": function() {
      assert.deepEqual(IdentifyParser.parse("foo: bar\n  foo:bar: bar"), {'foo:bar': 'bar'})
    },
    "should parse values with colons": function() {
      assert.deepEqual(IdentifyParser.parse("foo: bar\n  foo: hello:world"), {foo: 'hello:world'})
    }
  }
}).exportTo(module)
