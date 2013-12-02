window.PText = window.PNode.subClass({
  init: function (arg) {
    if (typeof arg === "string") {
      this._super();
      this.text = arg;
      this.recomputeBounds();
    } else if (arg) {
      this.text = arg.text;
      this._super(arg);
      this.recomputeBounds();
    } else {
      throw "Invalid argument for PText constructor";
    }
  },

  paint: function (ctx) {
    if (this.getGlobalFullBounds().height * ctx.displayScale < 3) {
      return;
    }

    if (this.fillStyle) {
      ctx.fillStyle = this.fillStyle;
    } else {
      ctx.fillStyle = "rgb(0,0,0)";
    }
    ctx.textBaseline = "top";
    ctx.fillText(this.text, this.bounds.x, this.bounds.y);
  },

  recomputeBounds: function () {
    var metric = PText.hiddenContext.measureText(this.text);
    this.bounds.width = metric.width;
    this.bounds.height = this.text ? PText.fontSize : 0;
    this.invalidateBounds();
  }
});

window.PText.fontSize = 20;

window.PText.hiddenContext = document.createElement("canvas").getContext("2d");
window.PText.hiddenContext.font = PText.fontSize + "px Arial";
window.PText.hiddenContext.textBaseline = "top";
