var exec = require('child_process').exec
  , path = require('path')

var ImageMagick = module.exports = {
  _random: function(number) {
    return parseInt(Math.random() * number)
  },

  _getTempfile: function(url, callback, mime) {
    var onFinish = function(mime) {
      var tmpfile = [process.cwd(), "tmp", ImageMagick._random(99999999).toString() + '.' + mime].join('/')
      callback && callback(tmpfile)
    }
    
    if(mime) {
      onFinish(mime)
    } else {
      exec(['identify', '-format', "%m", "'" + url + "'"].join(" "), function(err, stdout, stderr) {
        onFinish(stdout.toLowerCase().replace("\n", ""))
      })
    }
  },

  convert: function(_command, source, params, callback){
    exec('curl --head ' + source, function(err, stdout, stderr) {
      var mimetype = (stdout.indexOf('200 OK') > -1) ? null : null//'jpg' //curl is broken 
      
      ImageMagick._getTempfile(source, function(tmpfile) {
        var size    = params.size || params.crop.split('+')[0]
        var command = mimetype 
          ? ["convert -bordercolor '#B1B1B1' -background '#eee' -border 1 -size", size, "-fill '#900' -font '/Library/Fonts/Arial Bold.ttf' -pointsize 16 label:' x' " + tmpfile].join(" ")
          : ['convert', "'" + source + "'", _command, tmpfile].join(" ")

        console.log("EXECUTING:", command)

        exec(command, function (err, stdout, stderr) {
          callback(err, tmpfile)
        })
      }, mimetype)
    })
  },

  resize: function(params, callback) {
    if(!params.hasOwnProperty('size'))
      throw new Error('Resize needs size-param with format <width>x<height>!')
    
    var command = ['-resize', "'" + params.size + "'"].join(" ")
      , source  = decodeURIComponent(params.url)
    
    ImageMagick.convert(command, source, params, callback)
  },

  fit: function(params, callback) {
    if(!params.hasOwnProperty('size'))
      throw new Error('Fit needs size-parameter with format <width>x<height>!')
    
    var command = ['-gravity center -resize', "'" + params.size + "'" + '^', '-extent', params.size].join(" ")
      , source  = decodeURIComponent(params.url)
    
    ImageMagick.convert(command, source, params, callback)
  },

  crop: function(params, callback) {
    if(!params.hasOwnProperty('crop'))
      throw new Error('Crop needs crop-param with format <width>x<height>+<x>+<y>!')

    var size    = params.size || params.crop.split('+')[0]
      , command = ['-crop', params.crop, '+repage', '-thumbnail', "'" + size + "'"].join(" ")
      , source  = decodeURIComponent(params.url)

    ImageMagick.convert(command, source, params, callback)
  }
}
