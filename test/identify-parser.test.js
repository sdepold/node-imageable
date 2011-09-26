var assert         = require('assert')
  , vows           = require('vows')
  , IdentifyParser = require('../lib/identify-parser')

vows.describe('identify-parser').addBatch({
  "#parse": {
    "should return json": function() {
      assert.deepEqual(IdentifyParser.parse("head: line\n  a: b"), {a:'b'})
    },
    "should parse keys with colons": function() {
      assert.deepEqual(IdentifyParser.parse("head: line\n  foo:bar: bar"), {'foo:bar': 'bar'})
    },
    "should parse values with colons": function() {
      assert.deepEqual(IdentifyParser.parse("head: line\n  foo: hello:world"), {foo: 'hello:world'})
    },
    "should parse nested values": function() {
      assert.deepEqual(IdentifyParser.parse("head: line\n  parent:\n    foo: bar"), {parent: {foo: 'bar'}})
    },
    "should parse super awesome constructs": function() {
      var nested = "head: line\n  parent:\n    foo: bar\n    hello: world\n    child:\n      bla: blubb\n  parent2: normal"
      var object = {
        parent: {
          foo: 'bar',
          hello: 'world',
          child: {
            bla: 'blubb'
          }
        },
        parent2: 'normal'
      }

      assert.deepEqual(IdentifyParser.parse(nested), object)
    }
  }
}).exportTo(module)
