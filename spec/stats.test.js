const testfile = __dirname + '/tmp/testfile'
const config = {
  "interval": 10,
  "commands": [ "echo %{avg} >> " + testfile ]
}

var assert = require('assert')
  , vows   = require('vows')
  , fs     = require("fs")
  , Stats  = require('../lib/stats')

vows.describe('stats').addBatch({
  'record': {
    topic: function(){ return function() { return new Stats(config) } },

    'adds a new record': function(init) {
      var stats = init()

      assert.equal(stats.data.requests.length, 0)
      stats.record(100)
      assert.equal(stats.data.requests.length, 1)
    }
  },

  'format': {
    topic: function(){ return function() { return new Stats(config) } },

    'returns valid object for no data': function(init) {
      var stats = init()

      assert.deepEqual(stats.format(), { count: 0, avg: 0 })
    },
    'returns formatted object for a single record': function(init) {
      var stats = init()

      stats.record(100)
      assert.deepEqual(stats.format(), { count: 1, avg: 100 })
    },
    'returns formatted object for many record': function(init) {
      var stats = init()

      stats.record(100)
      stats.record(50)
      assert.deepEqual(stats.format(), { count: 2, avg: 75 })
    }
  },

  'reset': {
    topic: function(){ return function() { return new Stats(config) } },

    'resets the records': function(init) {
      var stats = init()

      stats.record(100)
      assert.equal(stats.data.requests.length, 1)
      stats.reset()
      assert.equal(stats.data.requests.length, 0)
    }
  },

  'reportNeeded': {
    topic: function(){ return function() { return new Stats(config) } },

    'returns false if interval is not passed': function(init) {
      var stats = init()

      stats.reportedAt = Date.now() - 9*1000
      assert.equal(stats.reportNeeded(), false)
    },
    'returns true if interval is passed': function(init) {
      var stats = init()

      stats.reportedAt = Date.now() - 11*1000
      assert.equal(stats.reportNeeded(), true)
    }
  },

  'report': {
    topic: function(){
      if(require("path").existsSync(testfile)) {
        fs.unlinkSync(testfile)
      }
      return function() { return new Stats(config) }
    },

    'it executes all commands': function(init) {
      var stats = init()

      stats.report(function() {
        assert.equal(fs.readFileSync(testfile).toString(), '0\n')
      })
    },
    'it executes all commands and inserts values': function(init) {
      var stats = init()

      stats.record(100)
      stats.record(50)
      stats.report(function() {
        assert.equal(fs.readFileSync(testfile).toString(), '75\n')
      })
    },
  }
}).exportTo(module)
