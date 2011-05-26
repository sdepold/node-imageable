var ImageMagick = require("imagemagick")
  , path        = require("path")


var ImageProcessing = module.exports = {
  _random: function(number){ return ~~(Math.random() * number) },
  getTempfilePath: function(url) {
    return [process.cwd(), "tmp", ImageProcessing._random(99999999).toString() + path.extname(url)].join('/')
  },
  convert: function(action, url, params, callback) {
    var dstPath = ImageProcessing.getTempfilePath(url)
      , command = 'resize'
      , options = {
          srcPath: url,
          dstPath: dstPath,
          quality: 1
        }
    
    switch(action) {
      case 'resize':
        options.width =  params.size.split('x')[0]
        options.height = params.size.split('x')[1]
        break
      case 'fit':
        command = 'crop'
        options.width =  params.size.split('x')[0]
        options.height = params.size.split('x')[1]
        break
      case 'crop':
      // var resize = (params['size'] ? fitParams(params['size']) : "")
      // var command = ["convert -crop", params['crop'], resize, url, tempfile].join(" ")        
        options.customArgs = ['-crop', params.crop]
        break
      default:
        throw new Error('Unable to process given params!')
    }
    // if(action == 'resize'){
    //   var command = ["convert -resize", params['size'], url, tempfile].join(" ")
    // } else if(action == 'fit'){
    //   var command = ["convert", fitParams(params['size']), url, tempfile].join(" ")
    // } else if(action == 'crop'){
    //   var resize = (params['size'] ? fitParams(params['size']) : "")
    //   var command = ["convert -crop", params['crop'], resize, url, tempfile].join(" ")
    // } else {
    //   throw new Error('Wrong!')
    // }
    // 
    
    ImageMagick[command](options, callback)
  }
}