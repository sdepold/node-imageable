# What is imageable doing?

You can put imageable into your express application, where it acts as middleware.
Calling specific URLs (look below) will return resized and cropped images. 

# How to get it run.

In your express app you will find a section like this:

    app.configure(function(){
      app.use(express.bodyParser())
      app.use(express.methodOverride())
      //...
      app.use(app.router)
    })

To plug imageable into your app, just add the following ABOVE the router:

    app.use(imageable({
      "secret":       "my-very-secret-secret"
    , "magicHash":    "magic"
    , "namespace":    ""
    , "maxListeners": 512
    }, {
      before: function(stats) { console.log('before') },
      after: function(stats, returnValueOfBefore) { console.log('after') }
    }))

Notice that the after-callback will have the returned value of the before-callback as
first parameter. Using that mechanism, you can for example track the image processing
duration. The middleware will automatically track some statistics, such as request,
average processing time etc.

Here is what an app should look like:

    # app.js
    var fs     = require("fs")
      , config = JSON.parse(fs.readFileSync(__dirname + "/config/config.json"))
    
    app.configure(function(){
      app.use(express.bodyParser())
      app.use(express.methodOverride())
      app.use(imageable(config, {
        before: function(stats) { console.log('before') },
        after: function(stats, returnValueOfBefore) { console.log('after') }
      }))
      app.use(app.router)
    })

    # config/config.json
    {
      "secret":       "my-very-secret-secret"
    , "magicHash":    "magic"
    , "namespace":    ""
    , "maxListeners": 512
    }

You can also take a look at https://github.com/dawanda/node-imageable-server to get a further clue.

# Routes and namespacing

Here you can see the routes, imageable reacts on.

    # resize an image with keeping ratio
    http://localhost:3000/resize?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&size=200x200

    # resize an image to given size without keeping the ratio
    http://localhost:3000/fit?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&size=200x200

    # crop a specific area of an image
    http://localhost:3000/crop?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&crop=200x200%2B20%2B40

    # crop a specific area and resize it with keeping the ratio
    http://localhost:3000/crop?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&crop=200x200%2B20%2B40&size=100x50

    # if secret is provided in config/config.json, all urls must have a hash following the resize method (see Hashing)
    http://localhost:3000/fit/-hash-?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&size=200x200

    # use the magic hash code that is valid for all requests, e.g. for testing
    http://localhost:3000/fit/-magic-hash-?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&size=200x200

    # append any fancy name for nice looking urls and image downloads
    http://localhost:3000/fit/-hash-/Fancy-Ignored-Name.gif?url=http%3A%2F%2Fwww.google.com%2Fintl%2Fen_ALL%2Fimages%2Flogo.gif&size=200x200

If you specify the namespace in your config (let's say to 'imageable'), all routes will be scoped to /imageable/fit... or /imageable/crop and so on.

# Hashing
To make sure nobody missuses your image-server you can enable hashing in the config.config.json and all requests must be hashed.

    # Node
    var crypto    = require("crypto")
      , srcImgUrl = encodeURIComponent("http://www.google.com/intl/en_ALL/images/logo.gif")
      , query     = 'url=' + srcImgUrl + '&size=200x200'
      , hash      = crypto.createHash('md5').update(query + config.secret).digest("hex").slice(0,8)
      , url       = "http://localhost:3000/resize/" + hash + "/Very-Nice-Image.gif?" + query
    
    res.send('<img src="' + url + '" />')

    # RUBY
    TODO

# Running the tests
    
    node_modules/vows/bin/vows test/*.test.js

# TODO

 - add 'expand' which would add whitespace to fill missing image areas

# Authors

DaWanda Gmbh