var Utils       = require("./utils")
  , ImageMagick = require("./image-magick")
  , Logger      = require("./logger")
  , URL         = require("url")
  , oneYear     = 31557600000

var RequestHandler = module.exports = function(config, options) {
  this.stats   = new RequestHandler.Stats(config.reporting)
  this.config  = config || {}
  this.options = options || {}
  this.utils   = new Utils(this.config)
  this.logger  = new Logger(this.config)
}

RequestHandler.Stats = require("./stats")

// will get called via connect
RequestHandler.prototype.handle = function(req, res, next) {
  req.socket.setMaxListeners(this.config.maxListeners || 50)

  var start            = Date.now()
    , beforeHookResult = null
    , self             = this

  this.logger.log('Received request')

  if (this.isImageProcessUrl(req) && this.isImageSourceHostAllowed(req)) {
    this.logger.log('Image processing request')

    if(this.options.before) beforeHookResult = this.options.before(this.stats)

    this.processImage(req, res, function() {
      self.logger.log('Image processing done')
      self.stats.record(Date.now() - start)

      if(self.stats.reportNeeded()) {
        self.logger.log('Reporting stats')
        self.stats.report()
        self.stats.reset()
      }

      self.logger.log('Triggering after hook')
      self.logger.log('Request handling took ' + (Date.now() - start) + 'ms')
      self.options.after && self.options.after(self.stats, beforeHookResult)
    })
  } else {
    this.logger.log("No image processing request")
    next && next()
  }
}

RequestHandler.prototype.processImage = function(req, res, callback) {
  var method = this.getImageProcessUrlMatch(req)[1]
    , self   = this

  this.logger.log("Starting image processing")

  if (this._isValidHash(req)) {
    var imageMagick = new ImageMagick(this.config, this.logger)

    this.logger.log('Hash is valid')

    imageMagick[method](req.query, function(err, result) {
      var afterMethodName = (method == 'identify') ? '_afterIdentify' : '_afterResize'

      self.logger.log('Finished image processing')
      self[afterMethodName](err, result, res, callback)
    })
  } else {
    this.logger.log('Hash is invalid')
    res.send("Hash mismatch")
  }
}

RequestHandler.prototype.deleteTempfile = function(path) {
  require("child_process").exec('rm ' + path)
}

// request checks

RequestHandler.prototype.isImageSourceHostAllowed = function(req) {
  return this._isUrlWhitelisted(req.query.url, 'allowedHosts', true)
}

RequestHandler.prototype.isImageSourceHostTrusted = function(req) {
  return this._isUrlWhitelisted(req.query.url, 'trustedHosts', false)
}

RequestHandler.prototype.isImageProcessUrl = function(req) {
  return !!this.getImageProcessUrlMatch(req)
}

RequestHandler.prototype.getImageProcessUrlRegExp = function() {
  var template = "^\/(identify|resize|crop|fit)(\/([^\/\?]+))?"

  if (this.config.hasOwnProperty('namespace') && (this.config.namespace != ''))
    template = template.replace("^", "^\/" + this.config.namespace)

  return new RegExp(template)
}

RequestHandler.prototype.getImageProcessUrlMatch = function(req) {
  var urlRegExp = this.getImageProcessUrlRegExp()
  return req.originalUrl.match(urlRegExp)
}

// private

RequestHandler.prototype._isUrlWhitelisted = function(url, whitelistType, defaultValue) {
  if(arguments.length != 3) throw new Error('params are not optional!')

  if(this.config && this.config.whitelist && this.config.whitelist.hasOwnProperty(whitelistType)) {
    var requestedHost = URL.parse(url).host
      , matches       = this.config.whitelist[whitelistType].map(function(allowedHost) {
                          allowedHost = ((allowedHost instanceof RegExp) ? allowedHost : new RegExp(allowedHost))
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
    this.logger.log('Image processing failed')
    res.send(500)
  } else {
    this.logger.log('Sending processed image')

    res.contentType(path.replace(/\?(.*)/, ""))
    res.sendfile(path, { maxAge: oneYear }, function() {
      self.logger.log('File sent')
      self.deleteTempfile(path)
      callback && callback()
    })
  }
}

RequestHandler.prototype._afterIdentify = function(err, content, res, callback) {
  if(err) {
    this.logger.log('Identify failed')
    res.send(500)
  } else {
    this.logger.log('Identify succeeded')
    res.send(content, callback)
  }
}

RequestHandler.prototype._isValidHash = function(req) {
  var hash   = this.getImageProcessUrlMatch(req)[3]
    , query  = req.originalUrl.match(/\?(.*)/)[1]

  return (this.isImageSourceHostTrusted(req) || this.utils.hashMatches(hash, query))
}
