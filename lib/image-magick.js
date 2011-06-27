var exec = require('child_process').exec
  , path = require('path')

var ImageMagick = module.exports = {
  _random: function(number) {
    return parseInt(Math.random() * number)
  },

  _getTempfile: function(url, callback) {
    exec(['identify', '-format', "%m", "'" + url + "'"].join(" "), function(err, stdout, stderr) {
      var mime    = stdout.toLowerCase().replace("\n", "")
        , tmpfile = [process.cwd(), "tmp", ImageMagick._random(99999999).toString() + '.' + mime].join('/')
        
      callback && callback(tmpfile)
    })
  },

  convert: function(_command, source, callback){
    ImageMagick._getTempfile(source, function(tmpfile) {
      var command  = ['convert', "'" + source + "'", _command, tmpfile].join(" ")
      
      console.log("EXECUTING:", command)
      
      exec(command, function (err, stdout, stderr) {
        callback(err, tmpfile)
      })
    })
  },

  resize: function(params, callback) {
    if(!params.hasOwnProperty('size'))
      throw new Error('Resize needs size-param with format <width>x<height>!')
    
    var command = ['-resize', "'" + params.size + "'"].join(" ")
      , source  = decodeURIComponent(params.url)
    
    ImageMagick.convert(command, source, callback)
  },

  fit: function(params, callback) {
    if(!params.hasOwnProperty('size'))
      throw new Error('Fit needs size-parameter with format <width>x<height>!')
    
    var command = ['-gravity center -resize', "'" + params.size + "'" + '^', '-extent', params.size].join(" ")
      , source  = decodeURIComponent(params.url)
    
    ImageMagick.convert(command, source, callback)
  },

  crop: function(params, callback) {
    if(!params.hasOwnProperty('crop'))
      throw new Error('Crop needs crop-param with format <width>x<height>+<x>+<y>!')

    var size    = params.size || params.crop.split('+')[0]
      , command = ['-crop', params.crop, '+repage', '-thumbnail', "'" + size + "'"].join(" ")
      , source  = decodeURIComponent(params.url)

    ImageMagick.convert(command, source, callback)
  }
}
