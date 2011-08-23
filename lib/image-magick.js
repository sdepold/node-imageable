var exec    = require('child_process').exec
  , path    = require('path')

/*
  downloadCmd:
    -s => silent
    -f => fail if source doesn't exist
    -o => output file
 */
var templates = {
  tmpPath: "/tmp/node-image-magick/%{dir}/%{file}",

  downloadCmd: "curl --create-dirs -sf '%{source}' -o '%{target}'",
  identifyCmd: "identify -format %m '%{file}'",
  createBlankImageCmd: "convert -bordercolor '#B1B1B1' -background '#eee' -border 1 -size %{size} -fill '#900' -font '/Library/Fonts/Arial Bold.ttf' -pointsize 16 label:' x' '%{tmpfile}'",
  resizeCmd: "-resize '%{size}'",
  fitCmd: "-gravity center -resize '%{size}'^ -extent %{size}",
  cropCmd: "-crop %{crop} +repage -thumbnail '%{size}'",

  get: function(key, replacements) {
    var result = templates[key]
    
    for(var k in replacements)
      result = result.replace(new RegExp("%{" + k + "}", "g"), replacements[k])

    return result
  }
}

var ImageMagick = module.exports = {
  _random: function(number) {
    return parseInt(Math.random() * number)
  },

  _downloadSource: function(source, target, callback) {
    exec(templates.get('downloadCmd', {source: source, target: target}), callback)
  },

  _localizeSource: function(source, callback) {
    var checkSourceExists = function(_path) {
      path.exists(_path, function(exists) {
        callback(exists, _path)
      })
    }

    if(source.indexOf("http") == 0) {
      var tmpfile = templates.get('tmpPath', { dir: Date.now(), file: ImageMagick._random(9999) })

      ImageMagick._downloadSource(source, tmpfile, function(err, stdout, stderr) {
        checkSourceExists(tmpfile)
      })
    } else {
      checkSourceExists(source)
    }
  },

  _getTempfile: function(source, callback) {
    ImageMagick._getMimeType(source, function(mimeType) {
      var tmpfile = templates.get('tmpPath', { dir: Date.now(), file: ImageMagick._random(9999) + '.' + mimeType })
      exec("mkdir -p " + path.dirname(tmpfile), function() { callback(tmpfile) })
    })
  },

  _getMimeType: function(file, callback) {
    exec(templates.get('identifyCmd', { file: file }), function(_, stdout, _) {
      var mimeType = stdout.toLowerCase().replace("\n", "")
      callback(mimeType == "" ? "jpeg" : mimeType)
    })
  },

  _getFallbackImageCommand: function(_size, tmpfile) {
    var size = _size.split('x').map(function(num){
      return (num == "") ? "" : (parseInt(num) - 2)
    }).join("x")

    return templates.get('createBlankImageCmd', { size : size, tmpfile: tmpfile})
  },

  convert: function(_command, params, callback) {
    var source = decodeURIComponent(params.url)

    ImageMagick._localizeSource(source, function(exists, localizedSource) {
      ImageMagick._getTempfile(localizedSource, function(tmpfile) {
        var size    = params.size || params.crop.split('+')[0]
          , command = "convert '" + localizedSource + "' " + _command + " " + tmpfile

        if(!exists)
          command = ImageMagick._getFallbackImageCommand(size, tmpfile)

        console.log(new Date().toUTCString(), '-', "EXECUTING:", command)

        exec(command, function (err, stdout, stderr) {
          callback(err, tmpfile)
        })
      })
    })
  },

  resize: function(params, callback) {
    if(!params.hasOwnProperty('size'))
      throw new Error('Resize needs size-param with format <width>x<height>!')

    ImageMagick.convert(templates.get('resizeCmd', { size: params.size }), params, callback)
  },

  fit: function(params, callback) {
    if(!params.hasOwnProperty('size'))
      throw new Error('Fit needs size-parameter with format <width>x<height>!')
    
    ImageMagick.convert(templates.get('fitCmd', { size: params.size }), params, callback)
  },

  crop: function(params, callback) {
    if(!params.hasOwnProperty('crop'))
      throw new Error('Crop needs crop-param with format <width>x<height>+<x>+<y>!')

    var cmd = templates.get('cropCmd', {
      crop: params.crop,
      size: params.size || params.crop.split('+')[0]
    })

    ImageMagick.convert(cmd, params, callback)
  }
}
