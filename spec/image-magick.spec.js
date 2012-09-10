var buster      = require('buster')
  , ImageMagick = require(__dirname + '/../lib/image-magick.js')
  , Helper      = require(__dirname + '/helper.js')
  , exec        = require('child_process').exec

buster.spec.expose()

describe('ImageMagick', function() {
  before(function() {
    this.imageMagick = new ImageMagick({})

    this.crop = function(options, callback) {
      this.imageMagick.crop(options, function(err, path) {
        exec("identify " + path, callback)
      })
    }.bind(this)

    this.resize = function(options, callback) {
      this.imageMagick.resize(options, function(err, path) {
        exec("identify " + path, callback)
      })
    }.bind(this)

    this.fit = function(options, callback) {
      this.imageMagick.fit(options, function(err, path) {
        exec("identify " + path, callback)
      })
    }.bind(this)

    this.moreDetailsPlease = function(smth) {
      exec('npm list buster|grep buster@', function(err, stdout, stderr) {
        if(stdout.indexOf('@0.7') !== -1) {
          throw Error('Please add a more detailed error message! We checked for ' + smth + ' before.')
        }
      })
    }
  })

  after(function() {
    Helper.clearTmpFolder()
  })

  describe('resize', function() {
    describe('with local path', function() {
      it("resizes images when size is passed", function(done) {
        this.resize({ size: '100x100', url: Helper.images.local }, function(err, stdout, stderr) {
          expect(stdout).toBeDefined()
          expect(stdout).toMatch('100x67')
          done()
        })
      })

      it("throws an error if size is not passed", function() {
        expect(function() {
          this.imageMagick.resize({ url: Helper.images.local }, function(){})
        }.bind(this)).toThrow()

        this.moreDetailsPlease(/size-param/)
      })
    })
  })
})
