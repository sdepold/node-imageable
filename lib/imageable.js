var modifyRouteString = "^\/(resize|crop|fit)(\/([^\/\?]+))?"
  , Utils             = require("./utils")
  , ImageMagick       = require("./image-magick")

var Imageable = function(config, options) {
  options = options || {}
  
  return function(req, res, next) {
    if (Imageable.isImageProcessUrl(config, req)) {
      options.before && options.before()
      Imageable.processImage(config, req, res, function() {
        options.after && options.after()
      })
    } else {
      next && next()
    }
  }
}

Imageable.isImageProcessUrl = function(config, req) {
  return !!Imageable.getImageProcessUrlMatch(config, req)
}

Imageable.getImageProcessUrlMatch = function(config, req) {
  var routeString = modifyRouteString
  
  console.log(config)
  
  console.log(routeString)

  if ((config.namespace != '') && (typeof config.namespace != 'undefined'))
    routeString = routeString.replace("^", "^\/" + config.namespace)

  console.log(routeString)  

  return req.originalUrl.match(new RegExp(routeString))
}

Imageable.processImage = function(config, req, res, callback) {
  var match  = Imageable.getImageProcessUrlMatch(config, req)
    , method = match[1]
    , hash   = match[3]
    , query  = req.originalUrl.match(/\?(.*)/)[1]
    , utils  = new Utils(config)
  
  if (utils.hashMatches(hash, query)) {
    ImageMagick.convert(method, req.query['url'], req.query, function(err, path) {
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