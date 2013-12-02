window.PActivity = Object.subClass({
  init: function (options) {
    this.stepping = false;
    if (typeof options !== "undefined") {
      if (options.init) {
        options.init.call(this);
      }

      if (options.started) {
        this.started = options.started;
      }

      if (options.step) {
        this.step = options.step;
      }

      if (options.finished) {
        this.finished = options.finished;
      }
    }
  },

  started: function () {
  },

  step: function (/*ellapsedMillis*/) {
  },

  finished: function () {
  }
});
