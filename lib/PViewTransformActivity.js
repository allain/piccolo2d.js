window.PViewTransformActivity = PInterpolatingActivity.subClass({
  init: function (camera, targetTransform, duration) {
    this._super();
    this.duration = duration;
    this.camera = camera;
    this.source = camera.viewTransform;
    this.target = targetTransform;
  },

  interpolate: function (zeroToOne) {
    var dest = PTransform.lerp(this.source, this.target, zeroToOne);
    this.camera.setViewTransform(dest);
  },

  finished: function () {
    this.camera.setViewTransform(this.target);
  }
});
