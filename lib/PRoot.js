window.PRoot = window.PNode.subClass({
  init: function (args) {
    this._super(args);

    this.invalidPaint = true;

    this.scheduler = new PActivityScheduler(25);
  },

  getRoot: function () {
    return this;
  }
});
