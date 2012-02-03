const should   = require("should")
    , fs       = require("fs")
    , path     = require("path")
    , testfile = __dirname + '/tmp/testfile'
    , Stats    = require('../lib/stats')
    , config   = {
        "interval": 10,
        "commands": [ "echo %{avg} >> " + testfile ]
      }

describe('stats', function() {
  var stats = null

  beforeEach(function() {
    stats = new Stats(config)
  })

  describe('record', function() {
    it("adds a new record", function() {
      stats.data.requests.length.should.equal(0)
      stats.record(100)
      stats.data.requests.length.should.equal(1)
    })
  })

  describe('format', function() {
    it("returns valid object for no data", function() {
      stats.format().should.eql({ count: 0, avg: 0 })
    })

    it("returns formatted object for a single record", function() {
      stats.record(100)
      stats.format().should.eql({ count: 1, avg: 100 })
    })

    it("returns formatted object for many record", function() {
      stats.record(100)
      stats.record(50)
      stats.format().should.eql({ count: 2, avg: 75 })
    })
  })

  describe('reset', function() {
    it("resets the records", function() {
      stats.record(100)
      stats.data.requests.should.have.lengthOf(1)
      stats.reset()
      stats.data.requests.should.have.lengthOf(0)
    })
  })

  describe('reportNeeded', function() {
    it('returns false if interval is not passed', function() {
      stats.reportedAt = Date.now() - 9*1000
      stats.reportNeeded().should.be.false
    })

    it("returns true if interval is passed", function() {
      stats.reportedAt = Date.now() - 11*1000
      stats.reportNeeded().should.be.true
    })
  })

  describe('report', function() {
    var buildStats = function() {
      var testfile = __dirname + '/tmp/testfile-' + Math.floor(Math.random() * 9999)

      return new Stats({
        "interval": 10,
        "commands": [ "echo %{avg} >> " + testfile ],
        "testfile": testfile
      })
    }

    it("it executes all commands", function() {
      var stats = buildStats()

      stats.report(function() {
        fs.readFileSync(stats.config.testfile).toString().should.equal('0\n')
        try { fs.unlinkSync(stats.config.testfile) } catch(e) { }
      })
    })

    it("it executes all commands and inserts values", function() {
      var stats = buildStats()

      stats.record(100)
      stats.record(50)

      stats.report(function() {
        fs.readFileSync(stats.config.testfile).toString().should.equal('75\n')
        try { fs.unlinkSync(stats.config.testfile) } catch(e) { }
      })
    })
  })
})
