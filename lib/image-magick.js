var exec = require('child_process').exec
var path = require('path')

var rand = function(number){
  return parseInt(Math.random() * number);
}

var ImageMagic = module.exports = {
  convert: function(action, url, params, callback){
    function fitParams(size){
      return ["-gravity center -resize", size+'^', " -extent", size].join(" ")
    }

    var tempfile = [process.cwd(), "tmp", rand(99999999).toString() + path.extname(url)].join('/')

    if(action == 'resize'){
      var command = ["convert -resize", params['size'], url, tempfile].join(" ")
    } else if(action == 'fit'){
      var command = ["convert", fitParams(params['size']), url, tempfile].join(" ")
    } else if(action == 'crop'){
      var resize = (params['size'] ? fitParams(params['size']) : "")
      var command = ["convert -crop", params['crop'], resize, url, tempfile].join(" ")
    } else {
      throw new Error('Wrong!')
    }

    console.log(command)
    exec(command, function (err, stdout, stderr) {
      callback(err, tempfile)
    })
  }
}
