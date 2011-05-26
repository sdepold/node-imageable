var modifyRoute     = /^\/(resize|crop|fit)(\/([^\/\?]+))?/
  , Utils           = require("./utils")
  , ImageProcessing = require("./image-processing")

var Imageable = function(config, options) {
  options = options || {}
  
  return function(req, res, next) {
    if (Imageable.isImageProcessUrl(req)) {
      options.before && options.before()
      Imageable.processImage(config, req, res, function() {
        options.after && options.after()
      })
    } else {
      next && next()
    }
  }
}

Imageable.isImageProcessUrl = function(req) {
  return !!Imageable.getImageProcessUrlMatch(req)
}

Imageable.getImageProcessUrlMatch = function(req) {
  return req.originalUrl.match(modifyRoute)
}

Imageable.processImage = function(config, req, res, callback) {
  var match  = Imageable.getImageProcessUrlMatch(req)
    , method = match[1]
    , hash   = match[3]
    , query  = req.originalUrl.match(/\?(.*)/)[1]
    , utils  = new Utils(config)
  
  if (utils.hashMatches(hash, query)) {
    ImageProcessing.convert(method, req.query['url'], req.query, function(err, path) {
      Imageable.afterResize(err, path, res, callback)
    })
  } else {
    res.send("Hash mismatch")
  }
}

Imageable.afterResize = function(err, path, res, callback) {
  if (err) {
    res.send(500)
  } else {
    res.contentType(path)
    res.sendfile(path, function() {
      Imageable.deleteTempfile(path)
      callback && callback()
    })
  }
}

Imageable.deleteTempfile = function(path) {
  require("child_process").exec('rm ' + path)
}

module.exports = Imageable