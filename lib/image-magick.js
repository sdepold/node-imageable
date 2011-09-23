var exec    = require('child_process').exec
  , path    = require('path')

var ImageMagick = module.exports = function(config, logger) {
  if(!config) throw new Error('Where is my config?')

  this.config = config
  this.config.timeouts = this.config.timeouts || {}

  this.logger = logger || { log: function(){} }
}

ImageMagick.Templates = {
  tmpPath: "/tmp/node-image-magick/%{dir}/%{file}",

  downloadCmd: "curl --create-dirs -sf '%{source}' -o '%{target}'",
  identifyCmd: "identify -format %m '%{file}'",
  createBlankImageCmd: "convert -bordercolor '#B1B1B1' -background '#eee' -border 1 -size %{size} -fill '#900' -font '/Library/Fonts/Arial Bold.ttf' -pointsize 16 label:' x' '%{tmpfile}'",
  resizeCmd: "-resize '%{size}'",
  fitCmd: "-gravity center -resize '%{size}'^ -extent %{size}",
  cropCmd: "-crop %{crop} +repage -thumbnail '%{size}'",

  checkValue: function(value) {
    if(value.toString().match(/[^\-_:\/+<>\\#%\.\^a-z0-9]/gi))
      throw new Error('Unallowed characters in replacement: ' + value)
  },

  get: function(key, replacements) {
    var result = ImageMagick.Templates[key]

    for(var k in replacements) {
      ImageMagick.Templates.checkValue(replacements[k])
      result = result.replace(new RegExp("%{" + k + "}", "g"), replacements[k])
    }

    return result
  }
}


ImageMagick.prototype.resize = function(params, callback) {
  if(!params.hasOwnProperty('size'))
    throw new Error('Resize needs size-param with format <width>x<height>!')

  this._convert(ImageMagick.Templates.get('resizeCmd', { size: params.size }), params, callback)
}

ImageMagick.prototype.fit = function(params, callback) {
  if(!params.hasOwnProperty('size'))
    throw new Error('Fit needs size-parameter with format <width>x<height>!')

  this._convert(ImageMagick.Templates.get('fitCmd', { size: params.size }), params, callback)
}

ImageMagick.prototype.crop = function(params, callback) {
  if(!params.hasOwnProperty('crop'))
    throw new Error('Crop needs crop-param with format <width>x<height>+<x>+<y>!')

  var cmd = ImageMagick.Templates.get('cropCmd', {
    crop: params.crop,
    size: params.size || params.crop.split('+')[0]
  })

  this._convert(cmd, params, callback)
}

  // private

ImageMagick.prototype.execute = function(cmd, options, callback) {
  var self = this

  this.logger.log('Executing command: ' + cmd)
  exec(cmd, options, function(err, stdout, stderr) {
    self.logger.log('Finished command: ' + cmd)
    callback && callback(err, stdout, stderr)
  })
}

ImageMagick.prototype._random = function(number) {
  return parseInt(Math.random() * number)
}

ImageMagick.prototype._downloadSource = function(source, target, callback) {
  this.logger.log('Downloading source')
  this.execute(ImageMagick.Templates.get('downloadCmd', {source: source, target: target}), { timeout: this.config.timeouts.download }, callback)
}

ImageMagick.prototype._localizeSource = function(source, callback) {
  this.logger.log('Localizing source')

  var checkSourceExists = function(_path) {
    path.exists(_path, function(exists) {
      callback(exists, _path)
    })
  }

  if(source.indexOf("http") == 0) {
    var tmpfile = ImageMagick.Templates.get('tmpPath', { dir: Date.now(), file: this._random(9999) })

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
    var tmpfile = ImageMagick.Templates.get('tmpPath', { dir: Date.now(), file: self._random(9999) + '.' + mimeType })
    self.execute("mkdir -p " + path.dirname(tmpfile), {}, function() { callback(tmpfile) })
  })
}

ImageMagick.prototype._getMimeType = function(file, callback) {
  this.execute(ImageMagick.Templates.get('identifyCmd', { file: file }), { timeout: this.config.timeouts.identify }, function(_, stdout, _) {
    var mimeType = stdout.toLowerCase().replace("\n", "")
    callback(mimeType == "" ? "jpeg" : mimeType)
  })
}

ImageMagick.prototype._getFallbackImageCommand = function(_size, tmpfile) {
  var size = _size.split('x').map(function(num){
    return (num == "") ? "" : (parseInt(num) - 2)
  }).join("x")

  return ImageMagick.Templates.get('createBlankImageCmd', { size : size, tmpfile: tmpfile})
}

ImageMagick.prototype._checkSizeLimit = function(size) {
  var sizeLimit = this.config.imageSizeLimit

  if(!sizeLimit) return

  var dimension = size.match(/(\d+).*?(\d+)/).slice(1,3)

  dimension.forEach(function(_size) {
    if(parseInt(_size) > sizeLimit)
      throw new Error('Unallowed size! Requested: ' + size + '; Match: ' + _size + '; Allowed: ' + sizeLimit)
  })
}

ImageMagick.prototype._convert = function(_command, params, callback) {
  var source = decodeURIComponent(params.url)
    , self   = this

  this._checkSizeLimit(params.size)
  this._localizeSource(source, function(exists, localizedSource) {
    self._getTempfile(localizedSource, function(tmpfile) {
      var size    = params.size || params.crop.split('+')[0]
        , command = "convert '" + localizedSource + "' " + _command + " " + tmpfile

      if(!exists)
        command = self._getFallbackImageCommand(size, tmpfile)

      self.execute(command, { timeout: self.config.timeouts.convert }, function (err, stdout, stderr) {
        callback && callback(err, tmpfile)
      })
    })
  })
}
