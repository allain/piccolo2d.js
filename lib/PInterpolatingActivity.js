window.PInterpolatingActivity = PActivity.subClass({
  init: function (options) {
    this.stepping = false;
    if (typeof options !== "undefined") {
      this._super(options);

      if (options.duration) {
        this.duration = options.duration;
      } else {
        this.duration = 1000;
      }
    }
  },

  step: function (ellapsedMillis) {
    if (ellapsedMillis >= this.duration) {
      return false;
    }

    this.interpolate(ellapsedMillis / this.duration);

    return true;
  },

  interpolate: function (/*zeroToOne*/) {
  }
});
