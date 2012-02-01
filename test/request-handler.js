const RequestHandler = require('../lib/request-handler')

describe('RequestHandler', function() {
  describe('getImageProcessUrlMatch', function() {
    describe('without namespace', function() {
      var handler = null

      beforeEach(function() {
        handler = new RequestHandler({})
      })

      it("returns a match array for valid urls", function() {
        handler.getImageProcessUrlMatch({ originalUrl: "/resize/123/foo.jpg" }).should.exist
      })
    })
  })
})
