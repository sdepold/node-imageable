var IdentifyParser = module.exports = {
  leadingWhitespaces: function(line) {
    return line.match(/^\s*/)[0].length
  },

  parse: function(s) {
    var lines = s.split('\n').slice(1)
    return IdentifyParser.parseLines(lines)
  },

  parseLines: function(lines) {
    var result = {}

    for(var i = 0; i < lines.length; i++) {
      var line = lines[i]
        , next = lines[i+1] || ''
        , currentIdentation = IdentifyParser.leadingWhitespaces(line)
        , nextIdentation = IdentifyParser.leadingWhitespaces(next)
        , value = null

      if(nextIdentation <= currentIdentation) {
        var split = line.split(': ')
          , key   = split[0].replace(/^\s+/, '')

        value = split.slice(1).join(", ")
      } else {
        var key = line.split(':')[0].replace(/^\s+/, '')
          , j = i
          , nestedLine = next
          , selection = []

        do {
          selection.push(nestedLine)
          nestedLine = lines[++j] || ''
        } while(IdentifyParser.leadingWhitespaces(nestedLine) > currentIdentation)

        i = j-1
        value = IdentifyParser.parseLines(selection)
      }

      result[key] = value
    }

    return result
  }
}
