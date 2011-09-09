var Utils       = require("./utils")
  , ImageMagick = require("./image-magick")
  , oneYear     = 31557600000

module.exports = function(config, options) {
  var imageable = null

  return function(req, res, next) {
    imageable = imageable || new RequestHandler(config, options)
    imageable.handle(req, res, next)
  }
}

var RequestHandler = module.exports.RequestHandler = function(config, options) {
  this.stats   = new RequestHandler.Stats(config.reporting)
  this.config  = config
  this.options = options || {}
}

RequestHandler.Stats = require("./stats")

RequestHandler.prototype.handle = function(req, res, next) {
  req.socket.setMaxListeners(this.config.maxListeners || 50)
  req.socket.setTimeout(1000)

  var start            = Date.now()
    , beforeHookResult = null
    , self             = this

  if (this.isImageProcessUrl(req)) {
    if(this.options.before) beforeHookResult = this.options.before(this.stats)

    this.processImage(req, res, function() {
      self.stats.record(Date.now() - start)

      if(self.stats.reportNeeded()) {
        self.stats.report()
        self.stats.reset()
      }

      self.options.after && self.options.after(self.stats, beforeHookResult)
    })
  } else {
    next && next()
  }
}

RequestHandler.prototype.isImageProcessUrl = function(req) {
  return !!this.getImageProcessUrlMatch(req)
}

RequestHandler.prototype.isImageProcessUrlWhitelisted = function(req) {

}

RequestHandler.prototype.getImageProcessUrlRegExp = function() {
  var template = "^\/(resize|crop|fit)(\/([^\/\?]+))?"

  if (this.config.hasOwnProperty('namespace') && (this.config.namespace != ''))
    template = template.replace("^", "^\/" + this.config.namespace)

  return new RegExp(template)
}

RequestHandler.prototype.getImageProcessUrlMatch = function(req) {
  var urlRegExp = this.getImageProcessUrlRegExp()

  return req.originalUrl.match(urlRegExp)
}

RequestHandler.prototype.processImage = function(req, res, callback) {
  var match  = this.getImageProcessUrlMatch(req)
    , method = match[1]
    , hash   = match[3]
    , query  = req.originalUrl.match(/\?(.*)/)[1]
    , utils  = new Utils(this.config)
    , self   = this

  if (utils.hashMatches(hash, query)) {
    ImageMagick[method](req.query, function(err, path) {
      self.afterResize(err, path, res, callback)
    })
  } else {
    res.send("Hash mismatch")
  }
}

RequestHandler.prototype.afterResize = function(err, path, res, callback) {
  var self = this

  if (err) {
    res.send(500)
  } else {
    res.contentType(path.replace(/\?(.*)/, ""))
    res.sendfile(path, { maxAge: oneYear }, function() {
      self.deleteTempfile(path)
      callback && callback()
    })
  }
}

RequestHandler.prototype.deleteTempfile = function(path) {
  require("child_process").exec('rm ' + path)
}
