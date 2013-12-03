window.PCamera = window.PNode.subClass({
  init: function () {
    this._super();
    this.layers = [];

    this.viewTransform = new PTransform();
  },

  paint: function (ctx) {
    this._super(ctx);

    ctx.save();

    this.viewTransform.applyTo(ctx);
    ctx.displayScale = this.viewTransform.getScale();

    var viewInverse = this.viewTransform.getInverse();
    ctx.clipBounds = viewInverse.transform(this.bounds);

    for (var i = 0; i < this.layers.length; i += 1) {
      this.layers[i].fullPaint(ctx);
    }

    ctx.restore();
  },

  addLayer: function (layer) {
    // bail if layer already added
    if (this.layers.indexOf(layer) === -1) {
      this.layers.push(layer);
      layer.addCamera(this);
    }

    this.invalidatePaint();
  },

  removeLayer: function (layer) {
    this.layers = this.layers.remove(layer);

    this.invalidatePaint();
  },

  getPickedNodes: function (x, y) {
    var viewInverse = this.viewTransform.getInverse(),
      mousePoint = new PPoint(x, y),
      globalPoint = viewInverse.transform(mousePoint),
      pickedNodes = [],
      layerPoint;

    pickedNodes.pushAll(this._getPickedNodes(this, mousePoint));

    for (var i = 0; i < this.layers.length; i += 1) {
      layerPoint = this.layers[i].transform.getInverse().transform(globalPoint);
      pickedNodes.pushAll(this._getPickedNodes(this.layers[i], layerPoint));
    }

    return pickedNodes;
  },

  _getPickedNodes: function (parent, parentPoint) {
    var pickedChildren = [],
      childBounds,
      childPoint;

    for (var i = 0; i < parent.children.length; i += 1) {
      childBounds = parent.children[i].getFullBounds();
      childPoint = parent.children[i].parentToLocal(parentPoint);
      if (childBounds.contains(childPoint)) {
        pickedChildren.pushAll(this._getPickedNodes(parent.children[i], childPoint));
      }
    }

    return (pickedChildren.length === 0 && !(parent instanceof PCamera)) ? [parent] : pickedChildren;
  },

  animateViewToTransform: function (transform, duration) {
    this.getRoot().scheduler.schedule(new window.PViewTransformActivity(this, transform, duration));
  },

  setViewTransform: function (transform) {
    this.viewTransform = transform;

    this.invalidatePaint();
  }
});
