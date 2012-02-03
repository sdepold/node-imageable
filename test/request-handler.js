const RequestHandler = require('../lib/request-handler')
    , should         = require("should")

describe('RequestHandler', function() {
  var handler = null

  describe('getImageProcessUrlMatch', function() {
    describe('without namespace', function() {
      beforeEach(function() {
        handler = new RequestHandler({})
      })

      it("returns a match array for valid urls", function() {
        handler.getImageProcessUrlMatch({ originalUrl: "/resize/123/foo.jpg" }).should.exist
      })

      it("returns no match array for invalid urls", function() {
        should.not.exist(handler.getImageProcessUrlMatch({ originalUrl: "/foo/123/foo.jpg" }))
      })
    })

    describe('with namespacing', function() {
      beforeEach(function() {
        handler = new RequestHandler({ namespace: 'foo' })
      })

      it("returns a match array for valid urls", function() {
        handler.getImageProcessUrlMatch({ originalUrl: "/foo/resize/123/foo.jpg" }).should.exist
      })

      it("returns no match array for invalid urls", function() {
        should.not.exist(handler.getImageProcessUrlMatch({ originalUrl: "/foo/bar/123/foo.jpg" }))
      })
    })
  })

  describe("isImageProcessUrl", function() {
    describe('without namespace', function() {
      beforeEach(function() {
        handler = new RequestHandler({})
      })

      it('returns a match array for valid urls', function() {
        handler.isImageProcessUrl({ originalUrl: "/resize/123/foo.jpg" }).should.exist
      })

      it('returns no match array for invalid urls', function() {
        handler.isImageProcessUrl({ originalUrl: "/foo/123/foo.jpg" }).should.not.be.ok
      })
    })

    describe('with namespace', function() {
      beforeEach(function() {
        handler = new RequestHandler({ namespace: 'foo' })
      })

      it('returns a match array for valid urls', function() {
        handler.isImageProcessUrl({ originalUrl: "/foo/resize/123/foo.jpg" }).should.exist
      })

      it('returns no match array for invalid urls', function() {
        handler.isImageProcessUrl({ originalUrl: "/foo/bar/123/foo.jpg" }).should.not.be.ok
      })
    })
  })
})
