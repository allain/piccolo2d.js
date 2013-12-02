window.PPoint = Object.subClass({
  init: function () {
    if (arguments.length === 0) {
      this.x = 0;
      this.y = 0;
    } else if (arguments.length === 1 && arguments[0] instanceof PPoint) {
      this.x = arguments[0].x;
      this.y = arguments[0].y;
    } else if (arguments.length === 2) {
      this.x = arguments[0];
      this.y = arguments[1];
    } else {
      throw "Illegal argument for PPoint constructor";
    }
  }
});
