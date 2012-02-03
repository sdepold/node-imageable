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

  describe('isImageSourceHostAllowed', function() {
    describe('with allowedHosts', function() {
      beforeEach(function() {
        handler = new RequestHandler({
          'whitelist': { 'allowedHosts': [/^.*\.example\.com$/] }
        })
      })

      it('returns true if image source is allowed', function() {
        var req = { query: {url: 'http://www.example.com/foo.jpg'} }
        handler.isImageSourceHostAllowed(req).should.exist
      })

      it('returns false if image source is not allowed', function() {
        var req = { query: {url: 'http://www.google.com/foo.jpg'} }
        handler.isImageSourceHostAllowed(req).should.not.be.ok
      })
    })

    describe('without allowedHosts', function() {
      beforeEach(function() {
        handler = new RequestHandler({})
      })

      it("returns true for every url", function() {
        var req1 = { query: {url: 'http://www.google.com/foo.jpg'} }
          , req2 = { query: {url: 'http://www.example.com/foo.jpg'} }

        handler.isImageSourceHostAllowed(req1).should.be.ok
        handler.isImageSourceHostAllowed(req2).should.be.ok
      })
    })
  })

  describe('isImageSourceHostTrusted', function() {
    describe('with trustedHosts', function() {
      beforeEach(function() {
        handler = new RequestHandler({
          'whitelist': { 'trustedHosts': [/^.*\.example\.com$/] }
        })
      })

      it('returns true if image source is trusted', function() {
        var req = { query: {url: 'http://www.example.com/foo.jpg'} }
        handler.isImageSourceHostTrusted(req).should.be.ok
      })

      it('returns false if image source is not trusted', function() {
        var req = { query: {url: 'http://www.google.com/foo.jpg'} }
        handler.isImageSourceHostTrusted(req).should.not.be.ok
      })
    })

    describe('with trustedHosts as string', function() {
      beforeEach(function() {
        handler = new RequestHandler({
          'whitelist': {'trustedHosts': ["^.*\.example\.com$"]}
        })
      })

      it('returns true if image source is trusted', function() {
        var req = { query: {url: 'http://www.example.com/foo.jpg'} }
        handler.isImageSourceHostTrusted(req).should.be.ok
      })

      it('returns false if image source is not trusted', function() {
        var req = { query: {url: 'http://www.google.com/foo.jpg'} }
        handler.isImageSourceHostTrusted(req).should.not.be.ok
      })
    })

    describe('without trustedHosts', function() {
      beforeEach(function() {
        handler = new RequestHandler({})
      })

      it('returns false for every url', function() {
        var req1 = { query: {url: 'http://www.google.com/foo.jpg'} }
          , req2 = { query: {url: 'http://www.example.com/foo.jpg'} }

        handler.isImageSourceHostTrusted(req1).should.not.be.ok
        handler.isImageSourceHostTrusted(req2).should.not.be.ok
      })
    })
  })

  describe('_isValidHash', function() {
    beforeEach(function() {
      handler = new RequestHandler({
        secret:       "my-very-secret-secret",
        magicHash:    "magic",
        whitelist: { trustedHosts: [/^.*\.google\.com$/] }
      })
    })

    it('returns true for the magic hash', function() {
      var imgUrl = encodeURIComponent("http://www.example.com/intl/en_ALL/images/logo.gif")
        , hash   = handler.config.magicHash
        , reqUrl = "http://host.com/resize/" + hash + "/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      handler._isValidHash(req).should.be.ok
    })

    it('returns true for the correct hash', function() {
      var imgUrl = encodeURIComponent("http://www.example.com/intl/en_ALL/images/logo.gif")
        , hash   = handler.utils.hash("url=" + imgUrl)
        , reqUrl = "http://host.com/resize/" + hash + "/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      handler._isValidHash(req).should.be.ok
    })

    it('returns false for the incorrect hash', function() {
      var imgUrl = encodeURIComponent("http://www.example.com/intl/en_ALL/images/logo.gif")
        , hash   = "xxx"
        , reqUrl = "http://host.com/resize/" + hash + "/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      handler._isValidHash(req).should.not.be.ok
    })

    it('returns true for trusted hosts', function() {
      var imgUrl = encodeURIComponent("http://www.google.com/intl/en_ALL/images/logo.gif")
        , hash   = "xxx"
        , reqUrl = "http://host.com/resize/" + hash + "/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      handler._isValidHash(req).should.be.ok
    })

    it('returns true for trusted hosts without hash', function() {
      var imgUrl = encodeURIComponent("http://www.google.com/intl/en_ALL/images/logo.gif")
        , reqUrl = "http://host.com/resize/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      handler._isValidHash(req).should.be.ok
    })

  })
})
