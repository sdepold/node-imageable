var IdentifyParser = module.exports = {
  parse: function(s) {
    var lines  = s.split('\n').slice(1)
      , result = {}

    lines.forEach(function(line) {
      var split = line.split(': ')
        , key   = split[0].replace(/^\s+/, '')
        , value = split.slice(1).join(", ")

      result[key] = value
    })

    return result
  }
}
