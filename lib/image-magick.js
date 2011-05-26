var exec = require('child_process').exec
  , path = require('path')

var ImageMagick = module.exports = {
  _random: function(number) {
    return parseInt(Math.random() * number)
  },
  
  _fitParams: function(size){
    return ["-gravity center -resize", size+'^', " -extent", size].join(" ")
  },
  
  _getTempfile: function(url) {
    return [process.cwd(), "tmp", ImageMagick._random(99999999).toString() + path.extname(url)].join('/')
  },
  
  convert: function(action, url, params, callback){
    var tempfile = ImageMagick._getTempfile(url)

    if(action == 'resize'){
      var command = ["convert -resize", params['size'], url, tempfile].join(" ")
    } else if(action == 'fit'){
      var command = ["convert", ImageMagick._fitParams(params['size']), url, tempfile].join(" ")
    } else if(action == 'crop'){
      var resize = (params['size'] ? ImageMagick._fitParams(params['size']) : "")
      var command = ["convert -crop", params['crop'], resize, url, tempfile].join(" ")
    } else {
      throw new Error('Wrong!')
    }

    exec(command, function (err, stdout, stderr) {
      callback(err, tempfile)
    })
  }
}
