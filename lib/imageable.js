var modifyRoute = "^\/(resize|crop|fit)(\/([^\/\?]+))?"
  , Utils       = require("./utils")
  , ImageMagick = require("./image-magick")
  , Stats       = require("./stats")
  , stats       = new Stats()
  , oneYear     = 31557600000

var Imageable = function(config, options) {
  options = options || {}
  
  return function(req, res, next) {
    req.socket.setMaxListeners(config.maxListeners || 50)
    req.socket.setTimeout(1000)

    var start            = Date.now()
      , beforeHookResult = null

    if (Imageable.isImageProcessUrl(config, req)) {
      if(options.before) beforeHookResult = options.before(stats)
      
      Imageable.processImage(config, req, res, function() {
        stats.record(Date.now() - start)
        options.after && options.after(stats, beforeHookResult)
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
  var route = modifyRoute
  
  if ((config.namespace != '') && (typeof config.namespace != 'undefined'))
    route = route.replace("^", "^\/" + config.namespace)

  return req.originalUrl.match(new RegExp(route))
}

Imageable.processImage = function(config, req, res, callback) {
  var match  = Imageable.getImageProcessUrlMatch(config, req)
    , method = match[1]
    , hash   = match[3]
    , query  = req.originalUrl.match(/\?(.*)/)[1]
    , utils  = new Utils(config)
    
  if (utils.hashMatches(hash, query)) {
    ImageMagick[method](req.query, function(err, path) {
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
    res.contentType(path.replace(/\?(.*)/, ""))
    res.sendfile(path, { maxAge: oneYear }, function() {
      Imageable.deleteTempfile(path)
      callback && callback()
    })
  }
}

Imageable.deleteTempfile = function(path) {
  require("child_process").exec('rm ' + path)
}

module.exports = Imageable