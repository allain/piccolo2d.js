PTransform = Object.subClass({
  init: function (values) {
    this.values = values || [1, 0, 0, 1, 0, 0];
  },

  scale: function (ratio) {
    this.values[0] *= ratio;
    this.values[3] *= ratio;

    return this;
  },

  translate: function (dx, dy) {
    this.values[4] += dx;
    this.values[5] += dy;

    return this;
  },

  rotate: function (theta) {
    var c = Math.cos(theta),
      s = Math.sin(theta);

    this.transformBy([c, s, -s, c, 0, 0]);

    return this;
  },

  transformBy: function (t2) {
    var m1 = this.values,
      m2 = t2;

    if (t2 instanceof PTransform) {
      m2 = t2.values;
    }

    this.values = [];

    this.values[0] = m1[0] * m2[0] + m1[2] * m2[1];
    this.values[1] = m1[1] * m2[0] + m1[3] * m2[1];
    this.values[2] = m1[0] * m2[2] + m1[2] * m2[3];
    this.values[3] = m1[1] * m2[2] + m1[3] * m2[3];
    this.values[4] = m1[0] * m2[4] + m1[2] * m2[5] + m1[4];
    this.values[5] = m1[1] * m2[4] + m1[3] * m2[5] + m1[5];

    return this;
  },

  applyTo: function (ctx) {
    var m = this.values;
    ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
  },

  equals: function (t) {
    if (t instanceof PTransform) {
      t = t.values;
    }

    for (var i = 0; i < 6; i += 1) {
      if (t[i] !== this.values[i]) {
        return false;
      }
    }

    return true;
  },

  transform: function (target) {
    if (target instanceof PPoint) {
      var m = this.values;
      return new PPoint(target.x * m[0] + target.y * m[2] + m[4], target.x * m[1] + target.y * m[3] + m[5]);
    } else if (target instanceof PBounds) {
      var topLeft = new PPoint(target.x, target.y),
        tPos = this.transform(topLeft),
        bottomRight = new PPoint(target.x + target.width, target.y + target.height),
        tBottomRight = this.transform(bottomRight);

      return new PBounds(
        Math.min(tPos.x, tBottomRight.x),
        Math.min(tPos.y, tBottomRight.y),
        Math.abs(tPos.x - tBottomRight.x),
        Math.abs(tPos.y - tBottomRight.y)
      );
    } else if (target instanceof PTransform) {
      var transform = new PTransform(this.values);
      transform.transformBy(target);
      return transform;
    }

    throw "Invalid argument to transform method";
  },

  /** Returns the inverse matrix for this Transform */
  getInverse: function () {
    var m = this.values,
      det = m[0] * m[3] - m[1] * m[2],
      values = [];

    values[0] = m[3] / det;
    values[1] = -m[1] / det;
    values[2] = -m[2] / det;
    values[3] = m[0] / det;
    values[4] = (m[2] * m[5] - m[3] * m[4]) / det;
    values[5] = -(m[0] * m[5] - m[1] * m[4]) / det;

    return new PTransform(values);
  },

  getScale: function () {
    var p = new PPoint(0, 1);
    var tp = this.transform(p);
    tp.x -= this.values[4];
    tp.y -= this.values[5];
    return Math.sqrt(tp.x * tp.x + tp.y * tp.y);
  }
});

PTransform.lerp = function (t1, t2, zeroToOne) {
  var dest = [];

  for (var i = 0; i < 6; i += 1) {
    dest[i] = t1.values[i] + zeroToOne * (t2.values[i] - t1.values[i]);
  }

  return new PTransform(dest);
};
