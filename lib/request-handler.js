var Utils       = require("./utils")
  , ImageMagick = require("./image-magick")
  , URL         = require("url")
  , oneYear     = 31557600000

var RequestHandler = module.exports = function(config, options) {
  this.stats   = new RequestHandler.Stats(config.reporting)
  this.config  = config
  this.options = options || {}
}

RequestHandler.Stats = require("./stats")

// will get called via connect

RequestHandler.prototype.handle = function(req, res, next) {
  req.socket.setMaxListeners(this.config.maxListeners || 50)
  req.socket.setTimeout(1000)

  var start            = Date.now()
    , beforeHookResult = null
    , self             = this

  if (this.isImageProcessUrl(req) && this.isImageSourceHostAllowed(req)) {
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

RequestHandler.prototype.processImage = function(req, res, callback) {
  var match  = this.getImageProcessUrlMatch(req)
    , method = match[1]
    , hash   = match[3]
    , query  = req.originalUrl.match(/\?(.*)/)[1]
    , utils  = new Utils(this.config)
    , self   = this

  if (utils.hashMatches(hash, query)) {
    ImageMagick[method](req.query, function(err, path) {
      self._afterResize(err, path, res, callback)
    })
  } else {
    res.send("Hash mismatch")
  }
}

RequestHandler.prototype.deleteTempfile = function(path) {
  require("child_process").exec('rm ' + path)
}

// request checks

RequestHandler.prototype.isImageSourceHostAllowed = function(req) {
  return this._isImageSourceHostWhitelisted(req, 'allowedHosts', true)
}

RequestHandler.prototype.isImageSourceHostTrusted = function() {
  return this._isImageSourceHostWhitelisted(req, 'trustedHosts', false)
}

RequestHandler.prototype.isImageProcessUrl = function(req) {
  return !!this.getImageProcessUrlMatch(req)
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

// private

RequestHandler.prototype._isImageSourceHostWhitelisted = function(req, whitelistType, defaultValue) {
  if(arguments.length != 3) throw new Error('params are not optional!')

  if(this.config && this.config.whitelist && this.config.whitelist.hasOwnProperty(whitelistType)) {
    var requestedHost = URL.parse(req.query.url).host
      , matches       = this.config.whitelist.allowedHosts.map(function(allowedHost) {
                          return !!requestedHost.match(allowedHost)
                        })

    return (matches.indexOf(true) > -1)
  } else {
    return defaultValue
  }
}

RequestHandler.prototype._afterResize = function(err, path, res, callback) {
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
