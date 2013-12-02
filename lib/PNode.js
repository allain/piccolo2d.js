PNode = Object.subClass({
  init: function (params) {
    this.parent = null;
    this.children = [];
    this.listeners = [];
    this.fullBounds = null;
    this.globalFullBounds = null;

    this.transform = new PTransform();
    this.visible = true;

    if (params) {
      this.fillStyle = params.fillStyle || null;
      this.bounds = params.bounds || new PBounds();
    } else {
      this.bounds = new PBounds();
      this.fillStyle = null;
    }
  },

  invalidatePaint: function () {
    var root = this.getRoot();
    if (root) {
      root.invalidPaint = true;
    }
  },

  paint: function (ctx) {
    if (this.fillStyle && !this.bounds.isEmpty()) {
      ctx.fillStyle = this.fillStyle;
      ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
    }
  },

  paintAfterChildren: function (/*ctx*/) {
  },

  fullPaint: function (ctx) {
    var inViewport = !ctx.clipBounds || ctx.clipBounds.intersects(this.getGlobalFullBounds());
    if (this.visible && inViewport) {
      ctx.save();

      this.transform.applyTo(ctx);

      this.paint(ctx);

      for (var i = 0; i < this.children.length; i += 1) {
        this.children[i].fullPaint(ctx);
      }

      this.paintAfterChildren(ctx);

      ctx.restore();
    }
  },

  scale: function (ratio) {
    this.transform.scale(ratio);
    this.fullBounds = null;
    this.globalFullBounds = null;
    this.invalidatePaint();

    return this;
  },

  translate: function (dx, dy) {
    this.transform.translate(dx, dy);
    this.fullBounds = null;
    this.globalFullBounds = null;
    this.invalidatePaint();

    return this;
  },

  rotate: function (theta) {
    this.transform.rotate(theta);
    this.invalidatePaint();
    if (this.parent) {
      this.parent.invalidateBounds();
      this.globalFullBounds = null;
    }

    return this;
  },

  addChild: function (child) {
    this.children.push(child);
    child.parent = this;

    this.invalidateBounds();
    this.invalidatePaint();

    return this;
  },

  removeChild: function (child) {
    child.parent = null;

    this.children = this.children.remove(child);

    this.invalidateBounds();
    this.invalidatePaint();

    return this;
  },

  setTransform: function (transform) {
    this.transform = transform;

    if (this.parent) {
      this.parent.invalidateBounds();
      this.globalFullBounds = null;
    }

    this.invalidatePaint();

    return this;
  },

  animateToTransform: function (transform, duration) {
    if (!duration) {
      this.transform = transform;
    } else {
      this.getRoot().scheduler.schedule(new PTransformActivity(this, transform, duration));
    }
  },

  getRoot: function () {
    return this.parent ? this.parent.getRoot() : null;
  },

  getFullBounds: function () {
    if (!this.fullBounds) {
      if (this.layoutChildren) {
        this.layoutChildren();
      }

      var newFullBounds = new PBounds(this.bounds);

      var child, childFullBounds, tBounds;

      for (var i = 0; i < this.children.length; i += 1) {
        child = this.children[i];
        childFullBounds = child.getFullBounds();
        tBounds = child.transform.transform(childFullBounds);

        newFullBounds.add(tBounds);
      }

      this.fullBounds = newFullBounds;
    }

    return this.fullBounds;
  },

  getGlobalFullBounds: function () {
    if (!this.globalFullBounds) {
      var fullBounds = this.getFullBounds(),
        currentNode = this,
        tl = new PPoint(fullBounds.x, fullBounds.y),
        br = new PPoint(fullBounds.x + fullBounds.width, fullBounds.y + fullBounds.height);

      while (currentNode.parent) {
        tl = currentNode.transform.transform(tl);
        br = currentNode.transform.transform(br);
        currentNode = currentNode.parent;
      }

      this.globalFullBounds = new PBounds(
        Math.min(tl.x, br.x),
        Math.min(tl.y, br.y),
        Math.abs(tl.x - br.x),
        Math.abs(tl.y - br.y)
      );
    }

    return this.globalFullBounds;
  },

  getGlobalTransform: function () {
    var t = new PTransform(),
      currentNode = this;

    while (currentNode.parent) {
      t = currentNode.transform.transform(t);
      currentNode = currentNode.parent;
    }

    return t;
  },

  invalidateBounds: function () {
    this.fullBounds = null;
    this.globalFullBounds = null;

    if (this.parent) {
      this.parent.invalidateBounds();
    }
  },

  localToParent: function (target) {
    return this.transform.transform(target);
  },

  parentToLocal: function (target) {
    return this.transform.getInverse().transform(target);
  },

  addListener: function (listener) {
    if (this.listeners.indexOf(listener) === -1) {
      this.listeners.push(listener);
    }
  },

  getScale: function () {
    return this.transform.getScale();
  },

  moveToFront: function () {
    if (this.parent && this.parent.children.length > 1) {
      this.parent.children = this.parent.children.remove(this);
      this.parent.children.push(this);

      this.invalidatePaint();
    }
    return this;
  },

  moveToBack: function () {
    if (this.parent && this.parent.children.length > 1) {
      var newSiblings = [this];
      for (var i = 0, n = this.parent.children.length; i < n; i++) {
        if (this.parent.children[i] !== this) {
          newSiblings.push(this.parent.children[i]);
        }
      }

      this.parent.children = newSiblings;

      this.invalidatePaint();
    }
    return this;
  }
});
