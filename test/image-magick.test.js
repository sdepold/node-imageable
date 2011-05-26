var assert    = require('assert')
  , vows      = require('vows')
  , Helpers   = require("./helpers")
  , srcImgUrl = encodeURIComponent("http://www.google.com/intl/en_ALL/images/logo.gif")
  , im        = require('../lib/image-magick')

vows.describe('image-processing').addBatch({
  "convert with resize": {
    topic: function() {
      var cb = this.callback
      im.convert('resize', Helpers.testImagePath, {size: '100x100'}, function(err, path){
        Helpers.exec("identify " + path, cb)
      })
    },
    "resizes images when size is passed": function(err, stdout, stderr) {
      console.log(err, stdout)
      assert.ok(typeof stdout != 'undefined')
      assert.includes(stdout, '100x35')
    }
  },
  "convert with fit": {
    topic: function() {
      var cb = this.callback
      im.convert('fit', Helpers.testImagePath, {size: '100x100'}, function(err, path) {
        Helpers.exec("identify " + path, cb)
      })
    },
    "resizes images when size is passed": function(err, stdout, stderr) {
      assert.ok(typeof stdout != 'undefined')
      assert.includes(stdout, '100x100')
    }
  },
  "convert with crop": {
    topic: function() {
      var cb = this.callback
      im.convert('crop', Helpers.testImagePath, {crop: '10x15+20+25'}, function(err, path){
        Helpers.exec("identify " + path, cb)
      })
    },
    "resizes images when size is passed": function(err, stdout, stderr) {
      assert.ok(typeof stdout != 'undefined')
      assert.includes(stdout, '10x15')
    }
  },
  "convert with crop and size": {
    topic: function() {
      var cb = this.callback
      im.convert('crop', Helpers.testImagePath, {crop: '10x15+20+25', size: '100x20'}, function(err, path){
        Helpers.exec("identify " + path, cb)
      })
    },
    "resizes images when size is passed": function(err, stdout, stderr) {
      assert.ok(typeof stdout != 'undefined')
      assert.includes(stdout, '100x20')
    }
  }
}).addBatch(Helpers.clearTmpFolderBatch).exportTo(module)