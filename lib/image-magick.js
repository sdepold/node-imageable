var exec    = require('child_process').exec
  , path    = require('path')

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

var ImageMagick = module.exports = function(config) {
  if(!config) throw new Error('Where is my config?')
}

ImageMagick.prototype.resize = function(params, callback) {
  if(!params.hasOwnProperty('size'))
    throw new Error('Resize needs size-param with format <width>x<height>!')

  this._convert(templates.get('resizeCmd', { size: params.size }), params, callback)
}

ImageMagick.prototype.fit = function(params, callback) {
  if(!params.hasOwnProperty('size'))
    throw new Error('Fit needs size-parameter with format <width>x<height>!')

  this._convert(templates.get('fitCmd', { size: params.size }), params, callback)
}

ImageMagick.prototype.crop = function(params, callback) {
  if(!params.hasOwnProperty('crop'))
    throw new Error('Crop needs crop-param with format <width>x<height>+<x>+<y>!')

  var cmd = templates.get('cropCmd', {
    crop: params.crop,
    size: params.size || params.crop.split('+')[0]
  })

  this._convert(cmd, params, callback)
}

  // private

ImageMagick.prototype._random = function(number) {
  return parseInt(Math.random() * number)
}

ImageMagick.prototype._downloadSource = function(source, target, callback) {
  exec(templates.get('downloadCmd', {source: source, target: target}), callback)
}

ImageMagick.prototype._localizeSource = function(source, callback) {
  var checkSourceExists = function(_path) {
    path.exists(_path, function(exists) {
      callback(exists, _path)
    })
  }

  if(source.indexOf("http") == 0) {
    var tmpfile = templates.get('tmpPath', { dir: Date.now(), file: this._random(9999) })

    this._downloadSource(source, tmpfile, function(err, stdout, stderr) {
      checkSourceExists(tmpfile)
    })
  } else {
    checkSourceExists(source)
  }
}

ImageMagick.prototype._getTempfile = function(source, callback) {
  var self = this

  this._getMimeType(source, function(mimeType) {
    var tmpfile = templates.get('tmpPath', { dir: Date.now(), file: self._random(9999) + '.' + mimeType })
    exec("mkdir -p " + path.dirname(tmpfile), function() { callback(tmpfile) })
  })
}

ImageMagick.prototype._getMimeType = function(file, callback) {
  exec(templates.get('identifyCmd', { file: file }), function(_, stdout, _) {
    var mimeType = stdout.toLowerCase().replace("\n", "")
    callback(mimeType == "" ? "jpeg" : mimeType)
  })
}

ImageMagick.prototype._getFallbackImageCommand = function(_size, tmpfile) {
  var size = _size.split('x').map(function(num){
    return (num == "") ? "" : (parseInt(num) - 2)
  }).join("x")

  return templates.get('createBlankImageCmd', { size : size, tmpfile: tmpfile})
}

ImageMagick.prototype._convert = function(_command, params, callback) {
  var source = decodeURIComponent(params.url)
    , self   = this

  this._localizeSource(source, function(exists, localizedSource) {
    self._getTempfile(localizedSource, function(tmpfile) {
      var size    = params.size || params.crop.split('+')[0]
        , command = "convert '" + localizedSource + "' " + _command + " " + tmpfile

      if(!exists)
        command = self._getFallbackImageCommand(size, tmpfile)

      console.log(new Date().toUTCString(), '-', "EXECUTING:", command)

      exec(command, function (err, stdout, stderr) {
        callback(err, tmpfile)
      })
    })
  })
}
