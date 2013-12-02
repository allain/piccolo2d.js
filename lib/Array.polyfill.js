Array.prototype.pushAll = function (x) {
  for (var i = 0; i < x.length; i += 1) {
    this.push(x[i]);
  }
};

Array.prototype.remove = function (x) {
  var keepers = [];

  for (var i = 0; i < this.length; i += 1) {
    if (this[i] !== x) {
      keepers.push(this[i]);
    }
  }

  return keepers;
};
