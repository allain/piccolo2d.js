"use strict";

Array.prototype.pushAll = function (x) {
    for (var i = 0; i < x.length; i++) {
        this.push(x[i]);
    }
};

Array.prototype.remove = function (x) {
    var keepers = [];

    for (var i = 0; i < this.length; i++) {
        if (this[i] !== x) {
            keepers.push(this[i]);
        }
    }
  
    return keepers;
};

(function (global) {
    var min = Math.min;
    var max = Math.max;
    var abs = Math.abs;
    var sin = Math.sin;
    var cos = Math.cos;

    global.PTransform = Class.extend({
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
            var c = cos(theta);
            var s = sin(theta);

            this.transformBy([c, s, -s, c, 0, 0]);

            return this;
        },

        transformBy: function (t2) {
            var m1 = this.values;
            var m2 = t2;

            if (t2 instanceof global.PTransform) {
                m2 = t2.values;
            }

            this.values = [
            m1[0] * m2[0] + m1[2] * m2[1],
            m1[1] * m2[0] + m1[3] * m2[1],
            m1[0] * m2[2] + m1[2] * m2[3],
            m1[1] * m2[2] + m1[3] * m2[3],
            m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
            m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
            ];

            return this;
        },

        applyTo: function (ctx) {
            var m = this.values;
            ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
        },

        equals: function (t) {
            if (t instanceof global.PTransform) {
                t = t.values;
            }

            for (var i = 0; i < 6; i++) {
                if (t[i] !== this.values[i]) {
                    return false;
                }
            }

            return true;
        },

        transform: function (target) {
            if (target instanceof global.PPoint) {
                var m = this.values;
                return new global.PPoint(target.x * m[0] + target.y * m[2] + m[4], target.x * m[1] + target.y * m[3] + m[5]);
            } else if (target instanceof global.PBounds) {
                var topLeft = new global.PPoint(target.x, target.y);
                var tPos = this.transform(topLeft);

                var bottomRight = new global.PPoint(target.x + target.width, target.y + target.height);
                var tBottomRight = this.transform(bottomRight);

                return new global.PBounds(
                    min(tPos.x, tBottomRight.x),
                    min(tPos.y, tBottomRight.y),
                    abs(tPos.x - tBottomRight.x),
                    abs(tPos.y - tBottomRight.y)
                    );
            } else if (target instanceof global.PTransform) {
                var transform = new global.PTransform(this.values);
                transform.transformBy(target);
                return transform;
            }

            throw "Invalid argument to transform method";
        },

        /** Returns the inverse matrix for this Transform */
        getInverse: function () {
            var m = this.values;

            var det = m[0] * m[3] - m[1] * m[2];

            return new global.PTransform([
                m[3] / det, -m[1] / det,
                -m[2] / det, m[0] / det,
                (m[2] * m[5] - m[3] * m[4]) / det,
                -(m[0] * m[5] - m[1] * m[4]) / det]);
        }
    });

    global.PTransform.lerp = function (t1, t2, zeroToOne) {
        var dest = [];

        for (var i = 0; i < 6 ; i++) {
            dest[i] = t1.values[i] + zeroToOne * (t2.values[i] - t1.values[i]);
        }

        return new global.PTransform(dest);
    };

    global.PPoint = Class.extend({
        init: function () {
            if (arguments.length === 0) {
                this.x = 0;
                this.y = 0;
            } else if (arguments.length === 1 && arguments[0] instanceof global.PPoint) {
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

    global.PBounds = Class.extend({
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
                var newX = min(x, this.x);
                var newY = min(y, this.y);

                var newBounds = {
                    x: newX,
                    y: newY,
                    width: max(this.x + this.width, x + width) - newX,
                    height: max(this.y + this.height, y + height) - newY
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
        }
    });

    global.PNode = Class.extend({
        init: function (params) {
            this.parent = null;
            this.children = [];
            this.listeners = [];
            this.fullBounds = null;
      
            this.transform = new global.PTransform();
            this.visible = true;
            this.invalidPaint = true;

            if (params) {
                this.fillStyle = params.fillStyle || null;
                this.bounds = params.bounds || new global.PBounds();
            } else {
                this.bounds = new global.PBounds();
                this.fillStyle = null;
            }
        },

        paint: function (ctx) {
            if (this.fillStyle && !this.bounds.isEmpty()) {
                ctx.fillStyle = this.fillStyle;
                ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
            }
        },

        paintAfterChildren: function (ctx) {
        },

        fullPaint: function (ctx) {
            if (!this.visible) { //TODO: fullIntersects(paintContext.getLocalClip())) {
                return;
            }
            
            ctx.save();

            this.transform.applyTo(ctx);

            this.paint(ctx);

            for (var i = 0; i < this.children.length; i++) {
                this.children[i].fullPaint(ctx);
            }

            this.paintAfterChildren(ctx);

            ctx.restore();
        },

        scale: function (ratio) {
            this.transform.scale(ratio);
            this.fullBounds = null;
            
            return this;
        },

        translate: function (dx, dy) {
            this.transform.translate(dx, dy);
            this.fullBounds = null;

            return this;
        },

        rotate: function (theta) {
            this.transform.rotate(theta);

            return this;
        },

        addChild: function (child) {
            this.children.push(child);
            this.fullBounds = null;
            child.parent = this;

            return this;
        },

        removeChild: function (child) {
            child.parent = null;
            this.fullBounds = null;
            this.children = this.children.remove(child);

            return this;
        },

        setTransform: function (transform) {
            this.transform = transform;
            this.fullBounds = null;

            return this;
        },

        animateToTransform: function (transform, duration) {
            if (!duration) {
                this.transform = transform;
            } else {
                this.getRoot().scheduler.schedule(new global.PTransformActivity(this, transform, duration));
            }
        },

        getRoot: function () {
            return this.parent ? this.parent.getRoot() : null;
        },

        getFullBounds: function () {
            if (!this.fullBounds) {
                this.fullBounds = new global.PBounds(this.bounds);

                for (var i = 0; i < this.children.length; i++) {
                    var child = this.children[i];
                    var childFullBounds = child.getFullBounds();
                    var tBounds = child.transform.transform(childFullBounds);
                    this.fullBounds.add(tBounds);
                }
            }

            return this.fullBounds;
        },

        getGlobalFullBounds: function () {
            var fullBounds = this.getFullBounds();
            var currentNode = this;

            var tl = new global.PPoint(fullBounds.x, fullBounds.y);
            var br = new global.PPoint(fullBounds.x + fullBounds.width, fullBounds.y + fullBounds.height);

            while (currentNode.parent) {
                tl = currentNode.transform.transform(tl);
                br = currentNode.transform.transform(br);
                currentNode = currentNode.parent;
            }

            return new global.PBounds(
                min(tl.x, br.x),
                min(tl.y, br.y),
                abs(tl.x - br.x),
                abs(tl.y - br.y)
                );
        },

        getGlobalTransform: function () {
            var t = new global.PTransform();

            var currentNode = this;

            while (currentNode.parent) {
                t = currentNode.transform.transform(t);
                currentNode = currentNode.parent;
            }

            return t;
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
        }
    });

    global.PRoot = global.PNode.extend({
        init: function (args) {
            this._super(args);

            this.scheduler = new global.PActivityScheduler(50);
        },

        getRoot: function () {
            return this;
        }
    });

    global.PText = global.PNode.extend({
        init: function (arg) {
            if (typeof arg === "string") {
                this._super();
                this.text = arg;
            } else if (arg) {
                this.text = arg.text;
                this._super(arg);
            } else {
                throw "Invalid argument for PText constructor";
            }
        },

        paint: function (ctx) {
            if (this.fillStyle) {
                ctx.fillStyle = this.fillStyle;
            } else {
                ctx.fillStyle = "rgb(0,0,0)";
            }
            ctx.textBaseline = "top";
            ctx.fillText(this.text, this.bounds.x, this.bounds.y);
        }
    });

    global.PImage = global.PNode.extend({
        init: function (arg) {
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
                this.loaded = true;
            };

            this.image.src = this.url;
        },

        paint: function (ctx) {
            if (this.loaded) {
                ctx.drawImage(this.image, 0, 0);
            }
        }
    });

    global.PLayer = global.PNode.extend({
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

    global.PCamera = PNode.extend({
        init: function () {
            this._super();
            this.layers = [];

            this.viewTransform = new global.PTransform();
        },

        paint: function (ctx) {
            this._super(ctx);

            ctx.save();

            this.viewTransform.applyTo(ctx);

            for (var i = 0; i < this.layers.length; i++) {
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
        },

        removeLayer: function (layer) {
            this.layers = this.layers.remove(layer);
        },

        getPickedNodes: function (x, y) {
            var viewInverse = this.viewTransform.getInverse();
            var globalPoint = viewInverse.transform(new global.PPoint(x,y));

            var pickedNodes = [];
            for (var i = 0; i < this.layers.length; i++) {
                var layerPoint = this.layers[i].transform.getInverse().transform(globalPoint);
                pickedNodes.pushAll(this._getPickedNodes(this.layers[i], layerPoint));
            }

            return pickedNodes;
        },

        _getPickedNodes: function (parent, parentPoint) {
            var pickedChildren = [];

            for (var i = 0; i < parent.children.length; i++) {
                var childBounds = parent.children[i].getFullBounds();
                var childPoint = parent.children[i].parentToLocal(parentPoint);
                if (childBounds.contains(childPoint)) {
                    var picked = this._getPickedNodes(parent.children[i], childPoint);
                    pickedChildren.pushAll(picked);
                }
            }

            return (pickedChildren.length === 0) ? [parent] : pickedChildren;
        },

        animateViewToTransform: function (transform, duration) {
            this.getRoot().scheduler.schedule(new global.PViewTransformActivity(this, transform, duration));
        },

        setViewTransform: function (transform) {
            this.viewTransform = transform;
        }

    });

    global.PCanvas = Class.extend({
        init: function (canvas, root) {
            if (typeof canvas === "string") {
                canvas = document.getElementById(canvas);
            }

            if (!canvas) {
                throw "Canvas provided to Piccolo is invalid!";
            }

            var _pCanvas = this;
            this.canvas = canvas;
            this.root =  root || new global.PRoot();
            this.camera = new global.PCamera();
            this.camera.bounds = new global.PBounds(0, 0, canvas.width, canvas.height);

            var layer = new global.PLayer();
            this.root.addChild(layer);
            this.root.addChild(this.camera);
            this.camera.addLayer(layer);

            this.camera.getRoot().scheduler.schedule(new global.PActivity({
                step: function () {
                    _pCanvas.paint();
                }
            }));

            function dispatchEvent(type, event, pickedNodes) {
                for (var nodeIndex  = 0; nodeIndex < pickedNodes.length; nodeIndex++) {
                    var currentNode = pickedNodes[nodeIndex];
                    while (currentNode) {
                        for (var i = 0; i < currentNode.listeners.length; i++) {
                            var listener = currentNode.listeners[i];
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

                for (var i = 0; i < a.length; i++) {
                    if (b.indexOf(a[i]) === -1) {
                        aminusb.push(a[i]);
                    }
                }

                return aminusb;
            }

            function processMouseOvers(oldNodes, newNodes, event) {
                var mouseOutNodes = subtract(oldNodes, newNodes);
                dispatchEvent("mouseout", event, mouseOutNodes);

                var mouseOverNodes = subtract(newNodes, oldNodes);
                dispatchEvent("mouseover", event, mouseOverNodes);
            }

            function processMouseEvent(name, event) {
                var offset = $(canvas).offset();
                var x = event.pageX - offset.left;
                var y = event.pageY - offset.top;

                var newPickedNodes = _pCanvas.getPickedNodes(x, y);

                processMouseOvers(previousPickedNodes, newPickedNodes, event);

                dispatchEvent(name, event, newPickedNodes);
                previousPickedNodes = newPickedNodes;
            }

            //TODO: Remove jQuery dependence
            var $canvas = $(canvas);
            ["click", "mousemove", "mousedown", "mouseup"].forEach(function (name) {
                $canvas[name](function (event) {
                    processMouseEvent(name, event);
                });
            });

            $(canvas).mouseout(function (event) {
                dispatchEvent("mouseout", event, previousPickedNodes);
                previousPickedNodes = [];
            });
        },

        paint: function () {
            var ctx = this.canvas.getContext('2d');
            ctx.font="16pt Helvetica";
            ctx.fillStyle="rgb(255,255,255)";
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.camera.fullPaint(ctx);
        },

        getPickedNodes: function(x, y) {
            return this.camera.getPickedNodes(x, y);
        }
    });

    global.PActivity = Class.extend({
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

        step: function (ellapsedMillis) {
        },

        finished: function () {
        }
    });

    global.PInterpolatingActivity = PActivity.extend({
        init: function (options) {
            this.stepping = false;
            if (typeof options !== "undefined") {
                this._super(options);

                if (options.duration) {
                    this.duration = options.duration;
                }
            }
        },

        step: function (ellapsedMillis) {
            if (ellapsedMillis >= this.duration) {
                return false;
            }

            this.interpolate(ellapsedMillis/this.duration);

            return true;
        },

        interpolate: function (zeroToOne) {
        }

    });

    global.PActivityScheduler = Class.extend({
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
            this.globalTime = new Date().getTime();
            var keepers = [];

            for (var i=0; i<this.activities.length; i++) {
                var activity = this.activities[i];

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
                this.intervalID = setInterval(function() {
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

    global.PTransformActivity = global.PInterpolatingActivity.extend({
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

    global.PViewTransformActivity = PInterpolatingActivity.extend({
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
})(this);