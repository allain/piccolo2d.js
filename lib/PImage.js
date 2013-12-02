window.PImage = PNode.subClass({
  init: function (arg) {
    var _this = this;
    if (typeof arg === "string") {
      this.url = arg;
      this._super();
    } else {
      this.url = arg.url;
      this._super(arg);
    }

    this.loaded = false;

    this.image = new Image();
    this.image.onload = function () {
      _this.bounds.width = this.width;
      _this.bounds.height = this.height;

      _this.invalidateBounds();
      _this.loaded = true;

      _this.invalidatePaint();
    };

    this.image.src = this.url;
  },

  paint: function (ctx) {
    if (this.loaded) {
      ctx.drawImage(this.image, 0, 0);
    }
  }
});
