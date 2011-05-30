var exec = require('child_process').exec
  , path = require('path')

var ImageMagick = module.exports = {
  _random: function(number) {
    return parseInt(Math.random() * number)
  },

  _getTempfile: function(url) {
    return [process.cwd(), "tmp", ImageMagick._random(99999999).toString() + path.extname(url)].join('/')
  },

  convert: function(_command, source, callback){
    var tempfile = ImageMagick._getTempfile(source)
      , command  = ['convert', _command, source, tempfile].join(" ")

    exec(command, function (err, stdout, stderr) {
      callback(err, tempfile)
    })
  },

  resize: function(params, source, callback) {
    if(!params.hasOwnProperty('size'))
      throw new Error('Resize needs size-param with format <width>x<height>!')
    
    var command = ['-resize', params.size].join(" ")
    ImageMagick.convert(command, source, callback)
  },

  fit: function(params, source, callback) {
    if(!params.hasOwnProperty('size'))
      throw new Error('Fit needs size-parameter with format <width>x<height>!')
    
    var command = ['-gravity center -resize', params.size + '^', '-extent', params.size].join(" ")
    ImageMagick.convert(command, source, callback)
  },

  crop: function(params, source, callback) {
    if(!params.hasOwnProperty('crop'))
      throw new Error('Crop needs crop-param with format <width>x<height>+<x>+<y>!')

    var size    = params.size || params.crop.split('+')[0]
      , command = ['-crop', params.crop, '+repage', '-thumbnail', "'" + size + "'"].join(" ")

    ImageMagick.convert(command, source, callback)
  }
}
