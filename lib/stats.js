var Stats = module.exports = function() {
  this.data = {
    requests: []
  }
}

Stats.prototype.record = function(time) {
  this.data.requests.push(time)
}

Stats.prototype.format = function() {
  return {
    count: this.data.requests.length,
    avg:   (this.data.requests.length > 0) ? (this.data.requests.reduce(function(a,b){ return a + b }, 0) / this.data.requests.length) : 0
  }
}

Stats.prototype.reset = function() {
  this.data = []
}