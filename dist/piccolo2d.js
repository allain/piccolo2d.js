/**
 * Copyright (c) 2008-2013, Piccolo2D project, http://piccolo2d.org
 * Copyright (c) 1998-2008, University of Maryland
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided
 * that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions
 * and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions
 * and the following disclaimer in the documentation and/or other materials provided with the
 * distribution.
 *
 * None of the name of the University of Maryland, the name of the Piccolo2D project, or the names of its
 * contributors may be used to endorse or promote products derived from this software without specific
 * prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
 * TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
// From Secrets of a JavaScript ninja
(function () {
  /* jshint loopfunc: true, noarg: false */
  var initializing = false,
    superPattern = /xyz/.test(function () {
      return "xyz";
    }) ? /\b_super\b/ : /.*/;

  Object.subClass = function (properties) {
    var _super = this.prototype;

    initializing = true;
    var proto = new this();
    initializing = false;
    for (var name in properties) {
      proto[name] = typeof properties[name] === "function" &&
        typeof _super[name] === "function" &&
        superPattern.test(properties[name]) ?
        (function (name, fn) {
          return function () {
            var tmp = this._super;
            this._super = _super[name];
            var ret = fn.apply(this, arguments);
            this._super = tmp;
            return ret;
          };
        })(name, properties[name]) : properties[name];
    }
    function Class() {
      // All construction is actually done in the init method
      if (!initializing && this.init) {
        this.init.apply(this, arguments);
      }
    }

    Class.prototype = proto;
    Class.contructor = Class;
    Class.subClass = arguments.callee;
    return Class;
  };
})();

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function () {
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function (callback/*, element*/) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
      clearTimeout(id);
    };
  }
}());

Array.prototype.pushAll = function (x) {
  for (var i = 0; i < x.length; i += 1) {
    this.push(x[i]);
  }
};

Array.prototype.remove = function (x) {
  var keepers = [];

  for (var i = 0; i < this.length; i += 1) {
    if (this[i] !== x) {
      keepers.push(this[i]);
    }
  }

  return keepers;
};

PTransform = Object.subClass({
  init: function (values) {
    this.values = values || [1, 0, 0, 1, 0, 0];
  },

  scale: function (ratio) {
    this.values[0] *= ratio;
    this.values[3] *= ratio;

    return this;
  },

  translate: function (dx, dy) {
    this.values[4] += dx;
    this.values[5] += dy;

    return this;
  },

  rotate: function (theta) {
    var c = Math.cos(theta),
      s = Math.sin(theta);

    this.transformBy([c, s, -s, c, 0, 0]);

    return this;
  },

  transformBy: function (t2) {
    var m1 = this.values,
      m2 = t2;

    if (t2 instanceof PTransform) {
      m2 = t2.values;
    }

    this.values = [];

    this.values[0] = m1[0] * m2[0] + m1[2] * m2[1];
    this.values[1] = m1[1] * m2[0] + m1[3] * m2[1];
    this.values[2] = m1[0] * m2[2] + m1[2] * m2[3];
    this.values[3] = m1[1] * m2[2] + m1[3] * m2[3];
    this.values[4] = m1[0] * m2[4] + m1[2] * m2[5] + m1[4];
    this.values[5] = m1[1] * m2[4] + m1[3] * m2[5] + m1[5];

    return this;
  },

  applyTo: function (ctx) {
    var m = this.values;
    ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
  },

  equals: function (t) {
    if (t instanceof PTransform) {
      t = t.values;
    }

    for (var i = 0; i < 6; i += 1) {
      if (t[i] !== this.values[i]) {
        return false;
      }
    }

    return true;
  },

  transform: function (target) {
    if (target instanceof PPoint) {
      var m = this.values;
      return new PPoint(target.x * m[0] + target.y * m[2] + m[4], target.x * m[1] + target.y * m[3] + m[5]);
    } else if (target instanceof PBounds) {
      var topLeft = new PPoint(target.x, target.y),
        tPos = this.transform(topLeft),
        bottomRight = new PPoint(target.x + target.width, target.y + target.height),
        tBottomRight = this.transform(bottomRight);

      return new PBounds(
        Math.min(tPos.x, tBottomRight.x),
        Math.min(tPos.y, tBottomRight.y),
        Math.abs(tPos.x - tBottomRight.x),
        Math.abs(tPos.y - tBottomRight.y)
      );
    } else if (target instanceof PTransform) {
      var transform = new PTransform(this.values);
      transform.transformBy(target);
      return transform;
    }

    throw "Invalid argument to transform method";
  },

  /** Returns the inverse matrix for this Transform */
  getInverse: function () {
    var m = this.values,
      det = m[0] * m[3] - m[1] * m[2],
      values = [];

    values[0] = m[3] / det;
    values[1] = -m[1] / det;
    values[2] = -m[2] / det;
    values[3] = m[0] / det;
    values[4] = (m[2] * m[5] - m[3] * m[4]) / det;
    values[5] = -(m[0] * m[5] - m[1] * m[4]) / det;

    return new PTransform(values);
  },

  getScale: function () {
    var p = new PPoint(0, 1);
    var tp = this.transform(p);
    tp.x -= this.values[4];
    tp.y -= this.values[5];
    return Math.sqrt(tp.x * tp.x + tp.y * tp.y);
  }
});

PTransform.lerp = function (t1, t2, zeroToOne) {
  var dest = [];

  for (var i = 0; i < 6; i += 1) {
    dest[i] = t1.values[i] + zeroToOne * (t2.values[i] - t1.values[i]);
  }

  return new PTransform(dest);
};

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

window.PBounds = Object.subClass({
  init: function () {
    if (arguments.length === 1) {
      this.x = arguments[0].x;
      this.y = arguments[0].y;
      this.width = arguments[0].width;
      this.height = arguments[0].height;
      this.touched = true;
    } else {
      this.x = arguments[0] || 0;
      this.y = arguments[1] || 0;
      this.width = arguments[2] || 0;
      this.height = arguments[3] || 0;
      this.touched = arguments.length > 0;
    }
  },

  equals: function (bounds) {
    return bounds.x === this.x && bounds.y === this.y && bounds.width === this.width && bounds.height === this.height;
  },

  isEmpty: function () {
    return this.width === 0 && this.height === 0;
  },

  add: function () {
    var x, y, width, height;

    if (arguments.length === 1) {
      var src = arguments[0];
      x = src.x;
      y = src.y;
      width = src.width || 0;
      height = src.height || 0;
    } else {
      x = arguments[0];
      y = arguments[1];
      width = arguments[2] || 0;
      height = arguments[3] || 0;
    }

    if (this.touched) {
      var newX = Math.min(x, this.x),
        newY = Math.min(y, this.y);

      var newBounds = {
        x: newX,
        y: newY,
        width: Math.max(this.x + this.width, x + width) - newX,
        height: Math.max(this.y + this.height, y + height) - newY
      };

      this.x = newBounds.x;
      this.y = newBounds.y;
      this.width = newBounds.width;
      this.height = newBounds.height;
    } else {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }

    this.touched = true;
  },

  contains: function () {
    var x, y;
    if (arguments.length === 1) {
      x = arguments[0].x;
      y = arguments[0].y;
    } else if (arguments.length === 2) {
      x = arguments[0];
      y = arguments[1];
    } else {
      throw "Invalid arguments";
    }

    return x >= this.x && x < this.x + this.width && y >= this.y && y < this.y + this.height;
  },

  intersects: function (bounds) {
    return !(bounds.x + bounds.width < this.x || bounds.x > this.x + this.width || bounds.y + bounds.height < this.y || bounds.y > this.y + this.height);
  }
});

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

    return (pickedChildren.length === 0) ? [parent] : pickedChildren;
  },

  animateViewToTransform: function (transform, duration) {
    this.getRoot().scheduler.schedule(new window.PViewTransformActivity(this, transform, duration));
  },

  setViewTransform: function (transform) {
    this.viewTransform = transform;

    this.invalidatePaint();
  }
});

window.PCanvas = Object.subClass({
  init: function (canvas, root) {
    if (typeof canvas === "string") {
      canvas = document.getElementById(canvas);
    }

    if (!canvas) {
      throw "Canvas provided to Piccolo is invalid!";
    }

    var _pCanvas = this;

    this.canvas = canvas;
    canvas.font = PText.fontSize + "px Arial";

    this.root = root || new PRoot();
    this.camera = new PCamera();
    this.camera.bounds = new PBounds(0, 0, canvas.width, canvas.height);

    var layer = new PLayer();
    this.root.addChild(layer);
    this.root.addChild(this.camera);
    this.camera.addLayer(layer);

    function animate() {
      requestAnimationFrame(animate);
      _pCanvas.paint();
    }

    setTimeout(animate, 0);

    function dispatchEvent(type, event, pickedNodes) {
      var currentNode, listener;

      for (var nodeIndex = 0, pickedNodeCount = pickedNodes.length; nodeIndex < pickedNodeCount; nodeIndex += 1) {
        currentNode = pickedNodes[nodeIndex];
        while (currentNode) {
          for (var i = 0, listenerCount = currentNode.listeners.length; i < listenerCount; i += 1) {
            listener = currentNode.listeners[i];
            if (listener[type]) {
              listener[type]({
                "event": event,
                "pickedNodes": pickedNodes
              });
            }
          }
          currentNode = currentNode.parent;
        }
      }
    }

    var previousPickedNodes = [];

    function subtract(a, b) {
      var aminusb = [];

      for (var i = 0; i < a.length; i += 1) {
        if (b.indexOf(a[i]) === -1) {
          aminusb.push(a[i]);
        }
      }

      return aminusb;
    }

    function processMouseOvers(oldNodes, newNodes, event) {
      var mouseOutNodes = subtract(oldNodes, newNodes),
        mouseOverNodes = subtract(newNodes, oldNodes);

      dispatchEvent("mouseout", event, mouseOutNodes);
      dispatchEvent("mouseover", event, mouseOverNodes);
    }

    var $canvas = jQuery(canvas);

    function processMouseEvent(name, event) {
      event.preventDefault();

      var offset = $canvas.offset(),
        x = event.pageX - offset.left,
        y = event.pageY - offset.top,
        newPickedNodes = _pCanvas.getPickedNodes(x, y);

      processMouseOvers(previousPickedNodes, newPickedNodes, event);

      dispatchEvent(name, event, newPickedNodes);
      previousPickedNodes = newPickedNodes;
    }


    $canvas.bind("contextmenu", function (event) {
      event.preventDefault();
    });

    ["click", "mousemove", "mousedown", "mouseup"].forEach(function (name) {
      $canvas.bind(name, function (event) {
        processMouseEvent(name, event);
      });
    });

    $canvas.mouseout(function (event) {
      dispatchEvent("mouseout", event, previousPickedNodes);
      previousPickedNodes = [];
    });
  },

  paint: function () {
    var root = this.camera.getRoot();
    if (root.invalidPaint) {
      var ctx = this.canvas.getContext('2d');

      ctx.font = "16pt Helvetica";
      ctx.fillStyle = this.fillStyle || "rgb(255,255,255)";

      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.camera.fullPaint(ctx);

      root.invalidPaint = false;
    }
  },

  getPickedNodes: function (x, y) {
    return this.camera.getPickedNodes(x, y);
  }
});

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

PTransformActivity = PInterpolatingActivity.subClass({
  init: function (node, targetTransform, duration) {
    this._super();
    this.duration = duration;
    this.node = node;
    this.source = node.transform;
    this.target = targetTransform;
  },

  interpolate: function (zeroToOne) {
    var dest = PTransform.lerp(this.source, this.target, zeroToOne);

    this.node.setTransform(dest);
  },

  finished: function () {
    this.node.setTransform(this.target);
  }
});

window.PViewTransformActivity = PInterpolatingActivity.subClass({
  init: function (camera, targetTransform, duration) {
    this._super();
    this.duration = duration;
    this.camera = camera;
    this.source = camera.viewTransform;
    this.target = targetTransform;
  },

  interpolate: function (zeroToOne) {
    var dest = PTransform.lerp(this.source, this.target, zeroToOne);
    this.camera.setViewTransform(dest);
  },

  finished: function () {
    this.camera.setViewTransform(this.target);
  }
});
