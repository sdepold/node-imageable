var sys = require("sys")

var Logger = module.exports = function(config) {
  this.config = config
}

Logger.prototype.log = function(s) {
  var date          = new Date()
    , months        = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    , formattedDate = [date.getDate(), months[date.getMonth()]].join(" ")
    , formattedTime = [date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()].join(":")

  if(this.config.debug)
    sys.debug('[' + [formattedDate, formattedTime].join(" ") + '] ' + s)
}
