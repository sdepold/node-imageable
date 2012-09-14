var buster         = require('buster')
  , RequestHandler = require(__dirname + '/../lib/request-handler.js')

buster.spec.expose()
buster.testRunner.timeout = 10000

describe('RequestHandler', function() {
  before(function() {
    this.handler = new RequestHandler({})
  })

  describe('getImageProcessUrlMatch', function() {
    describe('without namespace', function() {
      it("returns a match array for valid urls", function() {
        expect(this.handler.getImageProcessUrlMatch({ originalUrl: "/resize/123/foo.jpg" })).toBeDefined()
      })

      it("returns no match array for invalid urls", function() {
        expect(this.handler.getImageProcessUrlMatch({ originalUrl: "/foo/123/foo.jpg" })).toBeNull()
      })
    })

    describe('with namespacing', function() {
      before(function() {
        this.handler = new RequestHandler({ namespace: 'foo' })
      })

      it("returns a match array for valid urls", function() {
        expect(this.handler.getImageProcessUrlMatch({ originalUrl: "/foo/resize/123/foo.jpg" })).toBeDefined()
      })

      it("returns no match array for invalid urls", function() {
        expect(this.handler.getImageProcessUrlMatch({ originalUrl: "/foo/bar/123/foo.jpg" })).toBeNull()
      })
    })
  })

  describe("isImageProcessUrl", function() {
    describe('without namespace', function() {
      it('returns a match array for valid urls', function() {
        expect(this.handler.isImageProcessUrl({ originalUrl: "/resize/123/foo.jpg" })).toBeDefined()
      })

      it('returns no match array for invalid urls', function() {
        expect(this.handler.isImageProcessUrl({ originalUrl: "/foo/123/foo.jpg" })).toBeFalsy()
      })
    })

    describe('with namespace', function() {
      before(function() {
        this.handler = new RequestHandler({ namespace: 'foo' })
      })

      it('returns a match array for valid urls', function() {
        expect(this.handler.isImageProcessUrl({ originalUrl: "/foo/resize/123/foo.jpg" })).toBeDefined()
      })

      it('returns no match array for invalid urls', function() {
        expect(this.handler.isImageProcessUrl({ originalUrl: "/foo/bar/123/foo.jpg" })).toBeFalsy()
      })
    })
  })

  describe('isImageSourceHostAllowed', function() {
    describe('with allowedHosts', function() {
      before(function() {
        this.handler = new RequestHandler({
          'whitelist': { 'allowedHosts': [/^.*\.example\.com$/] }
        })
      })

      it('returns true if image source is allowed', function() {
        var req = { query: {url: 'http://www.example.com/foo.jpg'} }
        expect(this.handler.isImageSourceHostAllowed(req)).toBeDefined()
      })

      it('returns false if image source is not allowed', function() {
        var req = { query: {url: 'http://www.google.com/foo.jpg'} }
        expect(this.handler.isImageSourceHostAllowed(req)).toBeFalsy()
      })
    })

    describe('without allowedHosts', function() {
      it("returns true for every url", function() {
        var req1 = { query: {url: 'http://www.google.com/foo.jpg'} }
          , req2 = { query: {url: 'http://www.example.com/foo.jpg'} }

        expect(this.handler.isImageSourceHostAllowed(req1)).toBeTruthy()
        expect(this.handler.isImageSourceHostAllowed(req2)).toBeTruthy()
      })
    })
  })

  describe('isImageSourceHostTrusted', function() {
    describe('with trustedHosts', function() {
      before(function() {
        this.handler = new RequestHandler({
          'whitelist': { 'trustedHosts': [/^.*\.example\.com$/] }
        })
      })

      it('returns true if image source is trusted', function() {
        var req = { query: {url: 'http://www.example.com/foo.jpg'} }
        expect(this.handler.isImageSourceHostTrusted(req)).toBeTruthy()
      })

      it('returns false if image source is not trusted', function() {
        var req = { query: {url: 'http://www.google.com/foo.jpg'} }
        expect(this.handler.isImageSourceHostTrusted(req)).toBeFalsy()
      })
    })

    describe('with trustedHosts as string', function() {
      before(function() {
        this.handler = new RequestHandler({
          'whitelist': {'trustedHosts': ["^.*\.example\.com$"]}
        })
      })

      it('returns true if image source is trusted', function() {
        var req = { query: {url: 'http://www.example.com/foo.jpg'} }
        expect(this.handler.isImageSourceHostTrusted(req)).toBeTruthy()
      })

      it('returns false if image source is not trusted', function() {
        var req = { query: {url: 'http://www.google.com/foo.jpg'} }
        expect(this.handler.isImageSourceHostTrusted(req)).toBeFalsy()
      })
    })

    describe('without trustedHosts', function() {
      it('returns false for every url', function() {
        var req1 = { query: {url: 'http://www.google.com/foo.jpg'} }
          , req2 = { query: {url: 'http://www.example.com/foo.jpg'} }

        expect(this.handler.isImageSourceHostTrusted(req1)).toBeFalsy()
        expect(this.handler.isImageSourceHostTrusted(req2)).toBeFalsy()
      })
    })
  })

  describe('_isValidHash', function() {
    before(function() {
      this.handler = new RequestHandler({
        secret:       "my-very-secret-secret",
        magicHash:    "magic",
        whitelist: { trustedHosts: [/^.*\.google\.com$/] }
      })
    })

    it('returns true for the magic hash', function() {
      var imgUrl = encodeURIComponent("http://www.example.com/intl/en_ALL/images/logo.gif")
        , hash   = this.handler.config.magicHash
        , reqUrl = "http://host.com/resize/" + hash + "/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      expect(this.handler._isValidHash(req)).toBeTruthy()
    })

    it('returns true for the correct hash', function() {
      var imgUrl = encodeURIComponent("http://www.example.com/intl/en_ALL/images/logo.gif")
        , hash   = this.handler.utils.hash("url=" + imgUrl)
        , reqUrl = "http://host.com/resize/" + hash + "/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      expect(this.handler._isValidHash(req)).toBeTruthy()
    })

    it('returns false for the incorrect hash', function() {
      var imgUrl = encodeURIComponent("http://www.example.com/intl/en_ALL/images/logo.gif")
        , hash   = "xxx"
        , reqUrl = "http://host.com/resize/" + hash + "/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      expect(this.handler._isValidHash(req)).toBeFalsy()
    })

    it('returns true for trusted hosts', function() {
      var imgUrl = encodeURIComponent("http://www.google.com/intl/en_ALL/images/logo.gif")
        , hash   = "xxx"
        , reqUrl = "http://host.com/resize/" + hash + "/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      expect(this.handler._isValidHash(req)).toBeTruthy()
    })

    it('returns true for trusted hosts without hash', function() {
      var imgUrl = encodeURIComponent("http://www.google.com/intl/en_ALL/images/logo.gif")
        , reqUrl = "http://host.com/resize/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      expect(this.handler._isValidHash(req)).toBeTruthy()
    })
  })

  describe('_afterResize', function() {
    before(function() {
      this.res = {
        send: function() {},
        contentType: function() {},
        sendfile: function(path, options, callback) { callback && callback() }
      }
    })

    it("returns a 500 if an error has occurred", function() {
      var mock = this.mock(this.res).expects('send').withArgs(500).once()

      new RequestHandler()._afterResize(new Error('barfooz'), null, this.res)

      mock.verify()
    })

    it("calls deleteTempfile if the option keepDownloads is false or not defined", function() {
      var handler = new RequestHandler()
        , path    = 'foo'
        , mock    = this.mock(handler).expects('deleteTempfile').withArgs(path).once()

      handler._afterResize(null, path, this.res)

      mock.verify()
    })

    it("doesn't call deleteTempfile if the option keepDownloads is false or not defined", function() {
      var handler = new RequestHandler({ keepDownloads: true })
        , path    = 'foo'
        , mock    = this.mock(handler).expects('deleteTempfile').withArgs(path).never()

      handler._afterResize(null, path, this.res)

      mock.verify()
    })
  })
})
