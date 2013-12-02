window.PActivityScheduler = Object.subClass({
  init: function (frameRate) {
    this.pollingRate = frameRate;
    this.nextCallTime = 0;
    this.activities = [];
    this.intervalID = null;
    this.globalTime = new Date().getTime();
  },

  schedule: function (activity, startTime) {
    startTime = startTime || new Date().getTime();
    activity.startTime = startTime;
    this.activities.push(activity);
    this._start();
  },

  step: function () {
    var activity, keepers = [];

    this.globalTime = new Date().getTime();

    for (var i = 0; i < this.activities.length; i += 1) {
      activity = this.activities[i];

      if (activity.startTime > this.globalTime) {
        keepers.push(activity);
      } else {
        if (!activity.stepping) {
          activity.stepping = true;
          activity.started();
        }

        if (activity.step(this.globalTime - activity.startTime) !== false) {
          keepers.push(activity);
        } else {
          activity.finished();
        }
      }
    }

    this.activities = keepers;

    if (!this.activities) {
      this._stop();
    }
  },

  _start: function () {
    if (!this.intervalID) {
      var _this = this;
      this.intervalID = setInterval(function () {
        _this.currentTime = new Date().getTime();
        _this.step();
      }, this.pollingRate);
    }
  },

  _stop: function () {
    if (this.intervalID) {
      clearInterval(this.intervalID);
      this.intervalID = null;
    }
  }
});
