var Utils  = require(__dirname + "/../lib/utils")

var Helpers = module.exports = {
  exec:   require('child_process').exec,
  fs:     require('fs'),
  utils:  new Utils({
    secret : "my-very-secret-secret",
    magicHash : "magic",
    port : 3000
  }),
  
  serverRequests: 0,
 
  clearTmpFolders: function() {
    Helpers.exec('rm ' + process.cwd() + "/test/tmp/*")
    Helpers.exec('rm ' + process.cwd() + "/../tmp/*")
  },
  clearTmpFolderBatch: {
    'clear': {
      topic: function() {
        Helpers.clearTmpFolders()
        this.callback()
      },
      'make it so': function(){}
    }
  },
  
  /*
    path: the path you want to request
    _options: a hash with options, possible options:
                - toFile: will write the response into a file (e.g. for binary stuff)
    _callback: a function to call after everything is done
  */
  requestServer: function(path, _options, _callback) {
    var app      = require('../app')
      , port     = !!app.fd ? app.address().port : (~~(Math.random() * 5000) + 2000)
      , url      = "http://localhost:" + port + path
      , options  = (typeof _options == 'function') ? {} : _options
      , callback = (typeof _options == 'function') ? _options : _callback
      , cmd      = "curl --silent '" + url + "'" + (options.toFile ? " > " + options.toFile : '')

    Helpers.serverRequests++

    if (!app.fd) {
      app.listen(port)
      console.log("Express server listening on port %d", app.address().port)
    }
    
    Helpers.exec(cmd, function(err, stdout, stderr) {
      callback && callback(err, stdout, stderr)
      if(--Helpers.serverRequests == 0) {
        app.close()
        app.__listening = false
      }
    })
  }
}

Helpers.__defineGetter__('random', function() {
  return ~~(Math.random() * 999999)
})

Helpers.__defineGetter__('testImageTargetPath', function() {
  return process.cwd() + "/test/tmp/test" + Helpers.random +".gif"
})

Helpers.__defineGetter__('testImagePath', function() {
  return process.cwd() + "/test/assets/test.gif"
})