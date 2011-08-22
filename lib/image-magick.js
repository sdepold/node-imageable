var exec = require('child_process').exec
  , path = require('path')

var ImageMagick = module.exports = {
  _random: function(number) {
    return parseInt(Math.random() * number)
  },

  _downloadSource: function(source, target, callback) {
    // -s => silent
    // -f => fail if source doesn't exist
    // -o => output file
    var downloadCommand = "curl --create-dirs -sf '%{source}' -o '%{target}'"
    exec(downloadCommand.replace("%{source}", source).replace("%{target}", target), callback)
  },

  _sourceExists: function(source, callback) {
    var checkExistence = function(src) {
      path.exists(src, callback)
    }

    if(source.indexOf("http") == 0) {
      var tmpfile         = "/tmp/node-image-magick/" + Date.now() + "/" + ImageMagick._random(999)
        , identifyCommand = "curl --head -s '%{source}'|grep HTTP"

      ImageMagick._downloadSource(source, tmpfile, function(err, stdout, stderr) { checkExistence(tmpfile) })
    } else {
      checkExistence(source)
    }
  },

  _getTempfile: function(url, callback, mime) {
    var onFinish = function(mime) {
      var tmpfile = [process.cwd(), "tmp", ImageMagick._random(99999999).toString() + '.' + mime].join('/')
      callback && callback(tmpfile)
    }
    
    if(mime) {
      onFinish(mime)
    } else {
      exec("identify -format %m '" + url + "'", function(err, stdout, stderr) {
        onFinish(stdout.toLowerCase().replace("\n", ""))
      })
    }
  },

  getFallbackImageCommand: function(_size, tmpfile) {
    var size    = _size.split('x').map(function(num){ return (num == "") ? "" : (parseInt(num) - 2) }).join("x")
      , command = "convert -bordercolor '#B1B1B1' -background '#eee' -border 1 -size %{size} -fill '#900' -font '/Library/Fonts/Arial Bold.ttf' -pointsize 16 label:' x' %{tmpfile}"

    return command.replace("%{size}", size).replace("%{tmpfile}", tmpfile)
  },

  convert: function(_command, source, params, callback){
    ImageMagick._sourceExists(source, function(exists) {
      var mimetype = exists ? null : 'jpg'
      
      ImageMagick._getTempfile(source, function(tmpfile) {
        var size    = params.size || params.crop.split('+')[0]
          , command = null

        if(exists)
          command = "convert '" + source + "' " + _command + " " + tmpfile
        else
          command = ImageMagick.getFallbackImageCommand(size, tmpfile)

        console.log(new Date().toUTCString(), '-', "EXECUTING:", command)

        exec(command, function (err, stdout, stderr) {
          callback(err, tmpfile)
        })
      }, mimetype)
    })
  },

  resize: function(params, callback) {
    if(!params.hasOwnProperty('size'))
      throw new Error('Resize needs size-param with format <width>x<height>!')
    
    var command = "-resize '" + params.size + "'"
      , source  = decodeURIComponent(params.url)
    
    ImageMagick.convert(command, source, params, callback)
  },

  fit: function(params, callback) {
    if(!params.hasOwnProperty('size'))
      throw new Error('Fit needs size-parameter with format <width>x<height>!')
    
    var command = "-gravity center -resize '" + params.size + "'^ -extent " + params.size
      , source  = decodeURIComponent(params.url)
    
    ImageMagick.convert(command, source, params, callback)
  },

  crop: function(params, callback) {
    if(!params.hasOwnProperty('crop'))
      throw new Error('Crop needs crop-param with format <width>x<height>+<x>+<y>!')

    var size    = params.size || params.crop.split('+')[0]
      , command = "-crop " + params.crop + " +repage -thumbnail '" + size + "'"
      , source  = decodeURIComponent(params.url)

    ImageMagick.convert(command, source, params, callback)
  }
}
