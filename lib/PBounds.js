window.PBounds = Object.subClass({
  init: function () {
    if (arguments.length === 1) {
      this.x = arguments[0].x;
      this.y = arguments[0].y;
      this.width = arguments[0].width;
      this.height = arguments[0].height;
      this.touched = true;
    } else {
      this.x = arguments[0] || 0;
      this.y = arguments[1] || 0;
      this.width = arguments[2] || 0;
      this.height = arguments[3] || 0;
      this.touched = arguments.length > 0;
    }
  },

  equals: function (bounds) {
    return bounds.x === this.x && bounds.y === this.y && bounds.width === this.width && bounds.height === this.height;
  },

  isEmpty: function () {
    return this.width === 0 && this.height === 0;
  },

  add: function () {
    var x, y, width, height;

    if (arguments.length === 1) {
      var src = arguments[0];
      x = src.x;
      y = src.y;
      width = src.width || 0;
      height = src.height || 0;
    } else {
      x = arguments[0];
      y = arguments[1];
      width = arguments[2] || 0;
      height = arguments[3] || 0;
    }

    if (this.touched) {
      var newX = Math.min(x, this.x),
        newY = Math.min(y, this.y);

      var newBounds = {
        x: newX,
        y: newY,
        width: Math.max(this.x + this.width, x + width) - newX,
        height: Math.max(this.y + this.height, y + height) - newY
      };

      this.x = newBounds.x;
      this.y = newBounds.y;
      this.width = newBounds.width;
      this.height = newBounds.height;
    } else {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }

    this.touched = true;
  },

  contains: function () {
    var x, y;
    if (arguments.length === 1) {
      x = arguments[0].x;
      y = arguments[0].y;
    } else if (arguments.length === 2) {
      x = arguments[0];
      y = arguments[1];
    } else {
      throw "Invalid arguments";
    }

    return x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height;
  },

  intersects: function (bounds) {
    return !(bounds.x + bounds.width < this.x || bounds.x > this.x + this.width || bounds.y + bounds.height < this.y || bounds.y > this.y + this.height);
  }
});
