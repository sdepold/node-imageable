var assert      = require('assert')
  , vows        = require('vows')
  , Helpers     = require("./helpers")
  , ImageMagick = require('../lib/image-magick')
  , im          = new ImageMagick({})

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
      assert.throws( function(){
        im.resize({ url: Helpers.testImagePath }, function(){})
      }, /size-param/ )
    }
  },
  "#resize with url": {
    topic: function() {
      var cb = this.callback
      im.resize({size: '100x100', url: "http://www.google.com/intl/en_ALL/images/logo.gif"}, function(err, path){
        Helpers.exec("identify " + path, cb)
      })
    },
    "resizes images when size is passed": function(err, stdout, stderr) {
      assert.ok(typeof stdout != 'undefined')
      assert.includes(stdout, '100x40')
    }
  },
  "#resize with french url": {
    topic: function() {
      var cb = this.callback
      im.resize({size: '100x100', url: "http://blog-fr.dawanda.com/wp-content/uploads/2012/01/Capture-d’écran-2012-01-19-à-11.27.07.png"}, function(err, path){
        Helpers.exec("identify " + path, cb)
      })
    },
    "resizes images when size is passed": function(err, stdout, stderr) {
      assert.ok(typeof stdout != 'undefined')
      assert.includes(stdout, '83x100')
    }
  },
  "#resize with big image": {
    'without configured timeouts': {
      topic: function() {
        var cb = this.callback
        im.resize({size: '640x480', url: "http://s31.dawandastatic.com/PressReleaseItem/0/818/1264780823-785.jpg"}, function(err, path){
          Helpers.exec("identify " + path, cb)
        })
      },
      "resizes images when size is passed": function(err, stdout, stderr) {
        assert.ok(typeof stdout != 'undefined')
        assert.includes(stdout, '640x427')
      }
    },
    'with configured timeouts': {
      'for convert': {
        topic: function() {
          var cb = this.callback
            , im = new ImageMagick({timeouts: {convert: 200}})

          im.resize({size: '640x480', url: "http://s31.dawandastatic.com/PressReleaseItem/0/818/1264780823-785.jpg"}, cb)
        },
        "resizes images when size is passed": function(err, stdout, stderr) {
          assert.ok(err.killed)
        }
      },
      'for download': {
        topic: function() {
          var cb = this.callback
            , im = new ImageMagick({timeouts: {download: 800}})

          im.resize({size: '640x480', url: "http://s31.dawandastatic.com/PressReleaseItem/0/818/1264780823-785.jpg"}, cb)
        },
        "resizes images when size is passed": function(err, stdout, stderr) {
          assert.ok(err.killed)
        }

      }
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
  },
  '#resize with size and config': {
    topic: function() {
      return new ImageMagick({imageSizeLimit: 1000})
    },
    'should work when size is below limit': function(im) {
      assert.doesNotThrow(function () {
        im.resize({url: Helpers.testImagePath, size: '100x200'})
      }, Error);
    },
    'should throw an error when size is above limit': function(im) {
      assert.throws(function () {
        im.resize({url: Helpers.testImagePath, size: '1100x200'})
      }, Error);
    }
  },
  'templates': {
    topic: ImageMagick.Templates,
    'get': {
      'throws error if evil commands characters are detected': function(t) {
        assert.throws(function() { t.get('resizeCmd', {size: '300x200"; rm -rf /'}) }, Error)
      },
      'works nicely if no evil commands characters are detected': function(t) {
        assert.doesNotThrow(function() { t.get('resizeCmd', {size: '300x200'}) }, Error)
      }
    }
  },
  '#_scaleCropInfo': {
    'scales the passed cropping info according to source size': function() {
      assert.equal(im._scaleCropInfo('200x300+10+10', ['375', ''], ['800', '600']), '426x640+21+21')
    }
  }
}).addBatch(Helpers.clearTmpFolderBatch).exportTo(module)
