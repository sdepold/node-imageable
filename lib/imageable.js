var RequestHandler = require("./request-handler")

var Imageable = module.exports = function(config, options) {
  var imageable = null

  return function(req, res, next) {
    imageable = imageable || new RequestHandler(config, options)
    imageable.handle(req, res, next)
  }
}

