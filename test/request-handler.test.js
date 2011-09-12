var assert          = require('assert')
  , vows            = require('vows')
  , RequestHandler  = require('../lib/request-handler')

vows.describe('RequestHandler').addBatch({

  'getImageProcessUrlMatch': {
    'without namespacing': {
      topic: function() { return new RequestHandler({}) },
      'returns a match array for valid urls': function(i) {
        assert.ok(i.getImageProcessUrlMatch({ originalUrl: "/resize/123/foo.jpg" }) != null)
      },
      'returns no match array for invalid urls': function(i) {
        assert.ok(i.getImageProcessUrlMatch({ originalUrl: "/foo/123/foo.jpg" }) == null)
      },
    },

    'with namespacing': {
      topic: function() { return new RequestHandler({namespace: 'foo'}) },
      'with namespacing': {
        'returns a match array for valid urls': function(i) {
          assert.ok(i.getImageProcessUrlMatch({ originalUrl: "/foo/resize/123/foo.jpg" }) != null)
        },
        'returns no match array for invalid urls': function(i) {
          assert.ok(i.getImageProcessUrlMatch({ originalUrl: "/foo/bar/123/foo.jpg" }) == null)
        }
      }
    }
  },

  'isImageProcessUrl': {
    'without namespacing': {
      topic: function() { return new RequestHandler({}) },
      'returns a match array for valid urls': function(i) {
        assert.ok(i.isImageProcessUrl({ originalUrl: "/resize/123/foo.jpg" }))
      },
      'returns no match array for invalid urls': function(i) {
        assert.ok(i.isImageProcessUrl({ originalUrl: "/foo/123/foo.jpg" }) == false)
      }
    },

    'with namespacing': {
      topic: function() { return new RequestHandler({namespace: 'foo'}) },
      'returns a match array for valid urls': function(i) {
        assert.ok(i.isImageProcessUrl({ originalUrl: "/foo/resize/123/foo.jpg" }))
      },
      'returns no match array for invalid urls': function(i) {
        assert.ok(i.isImageProcessUrl({ originalUrl: "/foo/bar/123/foo.jpg" }) == false)
      }
    },
  },

  'getImageProcessUrlRegExp': {
    'without namespacing': {
      topic: function(){ return new RequestHandler({}) },
      'returns the default url match regexp': function(i) {
        assert.equal(i.getImageProcessUrlRegExp(), "/^/(resize|crop|fit)(/([^/?]+))?/")
      }
    },

    'with namespacing': {
      topic: function(){ return new RequestHandler({namespace: 'foo'}) },
      'returns namespaced url match regexp': function(i) {
        assert.equal(i.getImageProcessUrlRegExp(), "/^/foo/(resize|crop|fit)(/([^/?]+))?/")
      }
    }
  },

  'isImageSourceHostAllowed': {
    'with allowedHosts': {
      topic: function(){
        return new RequestHandler({
          'whitelist': { 'allowedHosts': [/^.*\.example\.com$/] }
        })
      },
      'returns true if image source is allowed': function(i) {
        var req = {query: {url: 'http://www.example.com/foo.jpg'}}
        assert.ok(i.isImageSourceHostAllowed(req))
      },
      'returns false if image source is not allowed': function(i) {
        var req = {query: {url: 'http://www.google.com/foo.jpg'}}
        assert.equal(i.isImageSourceHostAllowed(req), false)
      }
    },

    'without allowedHosts': {
      topic: function() { return new RequestHandler({}) },
      'returns true for every url': function(i) {
        var req1 = {query: {url: 'http://www.google.com/foo.jpg'}}
          , req2 = {query: {url: 'http://www.example.com/foo.jpg'}}

        assert.ok(i.isImageSourceHostAllowed(req1))
        assert.ok(i.isImageSourceHostAllowed(req2))
      }
    }
  },

  'isImageSourceHostTrusted': {
    'with trustedHosts': {
      topic: function(){
        return new RequestHandler({
          'whitelist': { 'trustedHosts': [/^.*\.example\.com$/] }
        })
      },
      'returns true if image source is trusted': function(i) {
        var req = {query: {url: 'http://www.example.com/foo.jpg'}}
        assert.ok(i.isImageSourceHostTrusted(req))
      },
      'returns false if image source is not trusted': function(i) {
        var req = {query: {url: 'http://www.google.com/foo.jpg'}}
        assert.equal(i.isImageSourceHostTrusted(req), false)
      }
    },

    'with trustedHosts as string': {
      topic: function() {
        return new RequestHandler({'whitelist': {'trustedHosts': ["^.*\.example\.com$"]}})
      },
      'returns true if image source is trusted': function(i) {
        var req = {query: {url: 'http://www.example.com/foo.jpg'}}
        assert.ok(i.isImageSourceHostTrusted(req))
      },
      'returns false if image source is not trusted': function(i) {
        var req = {query: {url: 'http://www.google.com/foo.jpg'}}
        assert.equal(i.isImageSourceHostTrusted(req), false)
      }
    },

    'without trustedHosts': {
      topic: function() { return new RequestHandler({}) },
      'returns false for every url': function(i) {
        var req1 = {query: {url: 'http://www.google.com/foo.jpg'}}
          , req2 = {query: {url: 'http://www.example.com/foo.jpg'}}

        assert.equal(i.isImageSourceHostTrusted(req1), false)
        assert.equal(i.isImageSourceHostTrusted(req2), false)
      }
    }
  },

  '_isValidHash': {
    topic: function() {
      return new RequestHandler({
        secret:       "my-very-secret-secret",
        magicHash:    "magic",
        whitelist: { trustedHosts: [/^.*\.google\.com$/] }
      })
    },
    'returns true for the magic hash': function(i) {
      var imgUrl = encodeURIComponent("http://www.example.com/intl/en_ALL/images/logo.gif")
        , hash   = i.config.magicHash
        , reqUrl = "http://host.com/resize/" + hash + "/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      assert.ok(i._isValidHash(req))
    },
    'returns true for the correct hash': function(i) {
      var imgUrl = encodeURIComponent("http://www.example.com/intl/en_ALL/images/logo.gif")
        , hash   = i.utils.hash("url=" + imgUrl)
        , reqUrl = "http://host.com/resize/" + hash + "/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      assert.ok(i._isValidHash(req))
    },
    'returns false for the incorrect hash': function(i) {
      var imgUrl = encodeURIComponent("http://www.example.com/intl/en_ALL/images/logo.gif")
        , hash   = "xxx"
        , reqUrl = "http://host.com/resize/" + hash + "/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      assert.equal(i._isValidHash(req), false)
    },
    'returns true for trusted hosts': function(i) {
      var imgUrl = encodeURIComponent("http://www.google.com/intl/en_ALL/images/logo.gif")
        , hash   = "xxx"
        , reqUrl = "http://host.com/resize/" + hash + "/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      assert.ok(i._isValidHash(req))
    },
    'returns true for trusted hosts without hash': function(i) {
      var imgUrl = encodeURIComponent("http://www.google.com/intl/en_ALL/images/logo.gif")
        , reqUrl = "http://host.com/resize/foo.jpg?url=" + imgUrl
        , parsed = require("url").parse(reqUrl, true)
        , req    = { originalUrl: parsed.pathname + parsed.search, query: parsed.query }

      assert.ok(i._isValidHash(req))
    }
  }

}).exportTo(module)
