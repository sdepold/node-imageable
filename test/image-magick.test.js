var assert    = require('assert')
  , vows      = require('vows')
  , Helpers   = require("./helpers")
  , im        = require('../lib/image-magick')

vows.describe('image-magick').addBatch({
  "#resize": {
    topic: function() {
      var cb = this.callback
      im.resize({size: '100x100', url: Helpers.testImagePath}, function(err, path){
        Helpers.exec("identify " + path, cb)
      })
    },
    "resizes images when size is passed": function(err, stdout, stderr) {
      assert.ok(typeof stdout != 'undefined')
      assert.includes(stdout, '100x67')
    },
    "throws an error if size is not passed": function() {
      assert.throws( function(){ im.resize({url: Helpers.testImagePath}, function(){}) }, /size-param/ )
    }
  },
  "#fit": {
    topic: function() {
      var cb = this.callback
      im.fit({size: '100x100', url: Helpers.testImagePath}, function(err, path) {
        Helpers.exec("identify " + path, cb)
      })
    },
    "resizes images to the passed size": function(err, stdout, stderr) {
      assert.ok(typeof stdout != 'undefined')
      assert.includes(stdout, '100x100')
    }
  },
  "#crop": {
    topic: function() {
      var cb = this.callback
      im.crop({crop: '200x100+20+25', url: Helpers.testImagePath}, function(err, path){
        Helpers.exec("identify " + path, cb)
      })
    },
    "throws an error if no crop param is passed": function() {
      assert.throws(function() {
        im.crop({url: Helpers.testImagePath}, function(){})
      }, /crop-param/)
    },
    "resizes images to the size defined in crop param": function(err, stdout, stderr) {
      assert.ok(typeof stdout != 'undefined')
      assert.includes(stdout, '200x100')
    }
  },
  "#crop with size": {
    topic: function() {
      var cb = this.callback
      im.crop({crop: '200x400+20+25', size: '100x200', url: Helpers.testImagePath}, function(err, path){
        Helpers.exec("identify " + path, cb)
      })
    },
    "resizes images to passed size": function(err, stdout, stderr) {
      assert.ok(typeof stdout != 'undefined')
      assert.includes(stdout, '100x200')
    }
  },
  "missing image": {
    topic: function() {
      var cb = this.callback
      im.crop({crop: '200x400+20+25', size: '100x200', url: "http://foo.bar"}, function(err, path){
        Helpers.exec("identify " + path, cb)
      })
    },
    "is generated for invalid sources": function(err, stdout, stderr) {
      assert.ok(typeof stdout != 'undefined')
      assert.includes(stdout, '100x200')
    }
  }
}).addBatch(Helpers.clearTmpFolderBatch).exportTo(module)