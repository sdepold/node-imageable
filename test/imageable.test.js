var assert    = require('assert')
  , vows      = require('vows')
  , Imageable = require('../lib/imageable')

vows.describe('Imageable').addBatch({

  'getImageProcessUrlMatch': {
    'without namespacing': {
      topic: function() { return new Imageable.RequestHandler({}) },
      'returns a match array for valid urls': function(i) {
        assert.ok(i.getImageProcessUrlMatch({ originalUrl: "/resize/123/foo.jpg" }) != null)
      },
      'returns no match array for invalid urls': function(i) {
        assert.ok(i.getImageProcessUrlMatch({ originalUrl: "/foo/123/foo.jpg" }) == null)
      },
    },

    'with namespacing': {
      topic: function() { return new Imageable.RequestHandler({namespace: 'foo'}) },
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
      topic: function() { return new Imageable.RequestHandler({}) },
      'returns a match array for valid urls': function(i) {
        assert.ok(i.isImageProcessUrl({ originalUrl: "/resize/123/foo.jpg" }))
      },
      'returns no match array for invalid urls': function(i) {
        assert.ok(i.isImageProcessUrl({ originalUrl: "/foo/123/foo.jpg" }) == false)
      }
    },

    'with namespacing': {
      topic: function() { return new Imageable.RequestHandler({namespace: 'foo'}) },
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
      topic: function(){ return new Imageable.RequestHandler({}) },
      'returns the default url match regexp': function(i) {
        assert.equal(i.getImageProcessUrlRegExp(), "/^/(resize|crop|fit)(/([^/?]+))?/")
      }
    },

    'with namespacing': {
      topic: function(){ return new Imageable.RequestHandler({namespace: 'foo'}) },
      'returns namespaced url match regexp': function(i) {
        assert.equal(i.getImageProcessUrlRegExp(), "/^/foo/(resize|crop|fit)(/([^/?]+))?/")
      }
    }
  },

  'isImageProcessUrlWhitelisted': {
    'with allowedHosts': {
      topic: function(){
        return new Imageable.RequestHandler({
          'whitelist': {
            'allowedHosts': [/^.*\.example\.com$/],
            'trustedHosts': []
          }
        })
      },
      'returns true if image source is allowed': function(i) {
        var req = {query: {url: 'http://www.example.com/foo.jpg'}}

        assert.ok(i.isImageProcessUrlWhitelisted(req))
      },
      'returns false if image source is not allowed': function(i) {
        var req = {query: {url: 'http://www.google.com/foo.jpg'}}

        assert.equal(i.isImageProcessUrlWhitelisted(req), false)
      }
    },

    'without allowedHosts': {
      topic: function() { return new Imageable.RequestHandler({}) },
      'returns true for every urls': function(i) {
        var req1 = {query: {url: 'http://www.google.com/foo.jpg'}}
          , req2 = {query: {url: 'http://www.example.com/foo.jpg'}}

        assert.ok(i.isImageProcessUrlWhitelisted(req1))
        assert.ok(i.isImageProcessUrlWhitelisted(req2))
      }
    }
  }

}).exportTo(module)
