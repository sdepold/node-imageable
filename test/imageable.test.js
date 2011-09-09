var assert    = require('assert')
  , vows      = require('vows')
  , Imageable = require('../lib/Imageable')

vows.describe('Imageable').addBatch({
	'getImageProcessUrlMatch without namespacing': {
		topic: function() { return new Imageable.RequestHandler({}) },
		'returns a match array for valid urls': function(i) {
			assert.ok(i.getImageProcessUrlMatch({ originalUrl: "/resize/123/foo.jpg" }) != null)
		},
		'returns no match array for invalid urls': function(i) {
			assert.ok(i.getImageProcessUrlMatch({ originalUrl: "/foo/123/foo.jpg" }) == null)
		},
	},

	'getImageProcessUrlMatch with namespacing': {
		topic: function() { return new Imageable.RequestHandler({namespace: 'foo'}) },
		'with namespacing': {
			'returns a match array for valid urls': function(i) {
				assert.ok(i.getImageProcessUrlMatch({ originalUrl: "/foo/resize/123/foo.jpg" }) != null)
			},
			'returns no match array for invalid urls': function(i) {
				assert.ok(i.getImageProcessUrlMatch({ originalUrl: "/foo/bar/123/foo.jpg" }) == null)
			}
		}
	},
	'isImageProcessUrl without namespacing': {
		topic: function() { return new Imageable.RequestHandler({}) },
		'returns a match array for valid urls': function(i) {
			assert.ok(i.isImageProcessUrl({ originalUrl: "/resize/123/foo.jpg" }))
		},
		'returns no match array for invalid urls': function(i) {
			assert.ok(i.isImageProcessUrl({ originalUrl: "/foo/123/foo.jpg" }) == false)
		}
	},
	'isImageProcessUrl with namespacing': {
		topic: function() { return new Imageable.RequestHandler({namespace: 'foo'}) },
		'returns a match array for valid urls': function(i) {
			assert.ok(i.isImageProcessUrl({ originalUrl: "/foo/resize/123/foo.jpg" }))
		},
		'returns no match array for invalid urls': function(i) {
			assert.ok(i.isImageProcessUrl({ originalUrl: "/foo/bar/123/foo.jpg" }) == false)
		}
	},
	'getImageProcessUrlRegExp without namespacing': {
		topic: function(){ return new Imageable.RequestHandler({}) },
		'returns the default url match regexp': function(i) {
			assert.equal(i.getImageProcessUrlRegExp(), "/^/(resize|crop|fit)(/([^/?]+))?/")
		}
	},
	'getImageProcessUrlRegExp with namespacing': {
		topic: function(){ return new Imageable.RequestHandler({namespace: 'foo'}) },
		'returns namespaced url match regexp': function(i) {
			assert.equal(i.getImageProcessUrlRegExp(), "/^/foo/(resize|crop|fit)(/([^/?]+))?/")
		}
	}
}).exportTo(module)
