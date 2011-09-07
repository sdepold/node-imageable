var assert    = require('assert')
  , vows      = require('vows')
  , imageable = require('../lib/imageable')

vows.describe('imageable').addBatch({
	'getImageProcessUrlRegExp': {
		topic: function(){ return imageable },
		'returns the default url match regexp': function(i) {
			assert.equal(i.getImageProcessUrlRegExp({}), "/^/(resize|crop|fit)(/([^/?]+))?/")
		},
		'returns namespaced url match regexp': function(i) {
			assert.equal(i.getImageProcessUrlRegExp({namespace: 'foo'}), "/^/foo/(resize|crop|fit)(/([^/?]+))?/")
		}
	}
}).exportTo(module)
