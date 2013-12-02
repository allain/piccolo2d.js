PLayer = window.PNode.subClass({
  init: function (arg) {
    this._super(arg);

    this.cameras = [];
  },

  addCamera: function (camera) {
    if (this.cameras.indexOf(camera) === -1) {
      this.cameras.push(camera);
    }
  },

  removeCamera: function (camera) {
    camera.removeLayer(this);

    this.cameras = this.cameras.remove(camera);
  }
});
