const ImageMagick = require("../lib/image-magick")

describe('ImageMagick', function() {
  describe('Templates', function() {
    describe('checkValue', function() {
      var checkForInvalidity = function(value) {
        (function() {
          ImageMagick.Templates.checkValue(value)
        }).should.throw()
      }

      var checkForValidity = function(value) {
        (function() {
          ImageMagick.Templates.checkValue(value)
        }).should.not.throw()
      }

      it("doesn't allow semicolons", function() {
        checkForInvalidity('foo;bar')
      })

      it("doesn't allow single or double quotes", function() {
        checkForInvalidity('"')
        checkForInvalidity("'")
      })

      it("allows normal urls", function() {
        checkForValidity('http://blog.dawanda.com/wp-content/uploads/2012/01/354x264_c_0548c68b981.jpg')
      })

      it("allows french urls", function() {
        checkForValidity('http://blog.dawanda.com/wp-content/uploads/2012/01/àçèá.jpg')
        checkForValidity('http://blog-fr.dawanda.com/wp-content/uploads/2012/01/Capture-d’écran-2012-01-19-à-11.27.07.png')
      })

      it("allows queries", function() {
        checkForValidity('http://s31.dawandastatic.com/Product/22564/22564177/1315733897-155.jpg?20110911090949')
      })

      it("allows local paths", function() {
        checkForValidity('/tmp/node-image-magick/1328090704763/4453')
      })

      it("allows dimensions", function() {
        checkForValidity('40x20')
        checkForValidity('950>x200>')
        checkForValidity('1576x1182+0+0')
      })

      it("allows numbers", function() {
        checkForValidity('1328090785983')
      })

      it("allows filenames", function() {
        checkForValidity('2763.jpeg')
      })
    })
  })
})
