PTransformActivity = PInterpolatingActivity.subClass({
  init: function (node, targetTransform, duration) {
    this._super();
    this.duration = duration;
    this.node = node;
    this.source = node.transform;
    this.target = targetTransform;
  },

  interpolate: function (zeroToOne) {
    var dest = PTransform.lerp(this.source, this.target, zeroToOne);

    this.node.setTransform(dest);
  },

  finished: function () {
    this.node.setTransform(this.target);
  }
});
