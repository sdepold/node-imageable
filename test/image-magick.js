var assert = require("assert")

describe('ImageMagick', function() {
  var ImageMagick = require("../lib/image-magick")

  describe('Templates', function() {
    describe('checkValue', function() {
      var checkForInvalidity = function(value) {
        assert.throws(function() {
          ImageMagick.Templates.checkValue(value)
        }, "Invalid values was accepted! Not good! Value: " + value)
      }

      var checkForValidity = function(value) {
        assert.doesNotThrow(function() {
          ImageMagick.Templates.checkValue(value)
        }, "Valid values was not accepted! Not good! Value: " + value)
      }

      it("doesn't allow semicolons", function() {
        checkForInvalidity('foo;bar')
      })

      it("doesn't allow single or double quotes", function() {
        checkForInvalidity('"')
        checkForInvalidity("'")
      })

      it("allows normal urls", function() {
        ImageMagick.Templates.checkValue('http://blog.dawanda.com/wp-content/uploads/2012/01/354x264_c_0548c68b981.jpg')
      })

      it("it allows french urls", function() {
        ImageMagick.Templates.checkValue('http://blog.dawanda.com/wp-content/uploads/2012/01/àçèá.jpg')
      })
    })
  })
})
