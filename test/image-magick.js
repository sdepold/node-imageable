const ImageMagick    = require("../lib/image-magick")
    , exec           = require('child_process').exec
    , googleImage    = "http://www.google.de/images/logos/ps_logo2.png"
    , frenchImage    = 'http://blog-fr.dawanda.com/wp-content/uploads/2012/01/Capture-d’écran-2012-01-19-à-11.27.07.png'
    , bigImage       = 'http://s31.dawandastatic.com/PressReleaseItem/0/818/1264780823-785.jpg'
    , localImage     = process.cwd() + "/test/fixtures/test.jpg"
    , testTmpRoot    = process.cwd() + "/test/tmp"
    , clearTmpFolder = function() {
//        exec('rm -rf ' + testTmpRoot + "/*")
        exec('rm ' + process.cwd() + "/../tmp/*")
      }

describe('ImageMagick', function() {
  var imageMagick = null

  var crop = function(options, callback) {
    imageMagick.crop(options, function(err, path) {
      exec("identify " + path, callback)
    })
  }

  var resize = function(options, callback) {
    imageMagick.resize(options, function(err, path) {
      exec("identify " + path, callback)
    })
  }

  var fit = function(options, callback) {
    imageMagick.fit(options, function(err, path) {
      exec("identify " + path, callback)
    })
  }

  beforeEach(function() {
    imageMagick = new ImageMagick({"tmpPathRoot": testTmpRoot})
  })

  after(function() {
    clearTmpFolder()
  })

  describe('resize', function() {
    describe('with local path', function() {
      it("resizes images when size is passed", function(done) {
        resize({ size: '100x100', url: localImage }, function(err, stdout, stderr) {
          stdout.should.exist
          stdout.should.include('100x67')
          done()
        })
      })

      it("throws an error if size is not passed", function() {
        (function() {
          imageMagick.resize({ url: localImage }, function(){})
        }).should.throw(/size-param/)
      })
    })

    describe('with url', function() {
      it('resizes images when size is passed', function(done) {
        resize({ size: '100x100', url: googleImage }, function(err, stdout, stderr) {
          stdout.should.exist
          stdout.should.include('100x35')
          done()
        })
      })
    })

    describe('with french url', function() {
      it('resizes images when size is passed', function(done) {
        resize({ size: '100x100', url: frenchImage }, function(err, stdout, stderr) {
          stdout.should.exist
          stdout.should.include('83x100')
          done()
        })
      })
    })

    describe('with a big image', function() {
      describe('without configured timeouts', function() {
        it('resizes images when size is passed', function(done) {
          resize({ size: '640x480', url: bigImage }, function(err, stdout, stderr) {
            stdout.should.exist
            stdout.should.include('640x427')
            done()
          })
        })
      })

      describe('with configured timeouts for convert', function() {
        beforeEach(function() {
          imageMagick = new ImageMagick({ timeouts: { convert: 100 }, tmpPathRoot: testTmpRoot })
        })

        it('resizes images when size is passed', function(done) {
          imageMagick.resize({ size: '640x480', url: bigImage }, function(err, path) {
            err.killed.should.be.true
            done()
          })
        })
      })

      describe('with configured timeouts for resize', function() {
        beforeEach(function() {
          imageMagick = new ImageMagick({ timeouts: { download: 100 }, tmpPathRoot: testTmpRoot })
        })

        it('resizes images when size is passed', function(done) {
          imageMagick.resize({ size: '640x480', url: bigImage }, function(err, path) {
            err.killed.should.be.true
            done()
          })
        })
      })
    })

    describe('with size limit', function() {
      beforeEach(function() {
        imageMagick = new ImageMagick({ imageSizeLimit: 1000, tmpPathRoot: testTmpRoot })
      })

      it('works when size is below limit', function(done) {
        (function() {
          resize({ url: localImage, size: '100x200' }, done)
        }).should.not.throw()
      })

      it('throws an error when size is above limit', function() {
        (function() {
          resize({ url: localImage, size: '1100x200' }, function(){})
        }).should.throw()
      })
    })
  })

  describe('fit', function() {
    it('resizes images to the passed size', function(done) {
      fit({ size: '100x100', url: localImage }, function(err, stdout, stderr) {
        stdout.should.exist
        stdout.should.include('100x100')
        done()
      })
    })
  })

  describe('crop', function() {
    describe('without size', function() {
      it('throws an error if no crop param is passed', function() {
        (function() {
          imageMagick.crop({ url: localImage }, function(){})
        }).should.throw(/crop-param/)
      })

      it('resizes images to the size defined in crop param', function() {
        crop({ crop: '200x100+20+25', url: localImage }, function(err, stdout, stderr) {
          stdout.should.exist
          stdout.should.include('200x100')
        })
      })
    })

    describe('with size', function() {
      it('resizes images to passed size', function() {
        crop({ crop: '200x400+20+25', size: '100x200', url: localImage }, function(err, stdout, stderr) {
          stdout.should.exist
          stdout.should.include('100x200')
        })
      })
    })
  })

  describe('missing image', function() {
    it('is generated for invalid sources', function(done) {
      crop({ crop: '200x400+20+25', size: '100x200', url: "http://foo.bar" }, function(err, stdout, stderr) {
        stdout.should.exist
        stdout.should.include('100x200')
        done()
      })
    })
  })

  describe('_scaleCropInfo', function() {
    it('scales the passed cropping info according to source size', function() {
      imageMagick._scaleCropInfo('200x300+10+10', ['375', ''], ['800', '600']).should.equal('426x640+21+21')
    })
  })
})

describe('ImageMagick.Templates', function() {
  describe('checkValue', function() {
    var checkForInvalidity = function(value) {
      (function() {
        ImageMagick.Templates.checkValue(value)
      }).should.throw()
    }

    var checkForValidity = function(value) {
      (function() {
        ImageMagick.Templates.checkValue(value)
      }).should.not.throw()
    }

    it("doesn't allow semicolons", function() {
      checkForInvalidity('foo;bar')
    })

    it("doesn't allow single or double quotes", function() {
      checkForInvalidity('"')
      checkForInvalidity("'")
    })

    it("allows normal urls", function() {
      checkForValidity('http://blog.dawanda.com/wp-content/uploads/2012/01/354x264_c_0548c68b981.jpg')
    })

    it("allows french urls", function() {
      checkForValidity('http://blog.dawanda.com/wp-content/uploads/2012/01/àçèá.jpg')
      checkForValidity('http://blog-fr.dawanda.com/wp-content/uploads/2012/01/Capture-d’écran-2012-01-19-à-11.27.07.png')
    })

    it("allows queries", function() {
      checkForValidity('http://s31.dawandastatic.com/Product/22564/22564177/1315733897-155.jpg?20110911090949')
    })

    it("allows local paths", function() {
      checkForValidity('/tmp/node-image-magick/1328090704763/4453')
    })

    it("allows dimensions", function() {
      checkForValidity('40x20')
      checkForValidity('950>x200>')
      checkForValidity('1576x1182+0+0')
    })

    it("allows numbers", function() {
      checkForValidity('1328090785983')
    })

    it("allows filenames", function() {
      checkForValidity('2763.jpeg')
    })
  })

  describe('get', function() {
    it('throws error if evil commands characters are detected', function() {
      (function() {
        ImageMagick.Templates.get('resizeCmd', {size: '300x200"; rm -rf /'})
      }).should.throw()
    })

    it("doesn't throw an error if no evil characters are detected", function() {
      (function() {
        ImageMagick.Templates.get('resizeCmd', { size: '300x200' })
      }).should.not.throw()
    })
  })
})
