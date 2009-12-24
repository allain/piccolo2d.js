var PTransform = Class.extend({
  init: function(values) {
    this.values = (values ? values : [1, 0, 0, 1, 0, 0]);
  },
  
  scale: function(ratio) {
    this.values[0] *= ratio;
    this.values[3] *= ratio;
    return this;
  },
  
  translate: function(dx, dy) {
    this.values[4] += dx;
    this.values[5] += dy;
    return this;
  },
  
  rotate: function(theta) {
    var cos = Math.cos(theta);
    var sin = Math.sin(theta);
  
    this.transformBy([cos, sin, -sin, cos, 0, 0]);
    return this;
  },
  
  transformBy: function(t2) {
    var m1 = this.values;
    var m2= t2;
    
    if (t2 instanceof PTransform) {
      m2 = t2.values;      
    }
    
    this.values = [
    m1[0]*m2[0]+m1[2]*m2[1],
    m1[1]*m2[0]+m1[3]*m2[1],
    m1[0]*m2[2]+m1[2]*m2[3],
    m1[1]*m2[2]+m1[3]*m2[3],
    m1[0]*m2[4]+m1[2]*m2[5] + m1[4],
    m1[1]*m2[4]+m1[3]*m2[5] + m1[5],
    ];    
    
    return this;
  },

  applyTo: function (ctx) {
    var m = this.values;
    ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
  },

  equals: function(t) {
    if (t instanceof PTransform)
      t = t.values;

    for (var i=0; i<6; i++)
      if (t[i] != this.values[i])
        return false;

    return true;
  }
});

PTransform.lerp = function (t1, t2, zeroToOne) {
  var dest = [];
  for (var i=0; i<6 ;i++) {
    dest[i] = t1.values[i] + zeroToOne*(t2.values[i]-t1.values[i]);
  }
  return new PTransform(dest);
}

var PBounds = Class.extend({
  init: function() {
    switch (arguments.length) {
      case 0:
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.touched = false;
        break;
      case 1:
        this.x = arguments[0].x;
        this.y = arguments[0].y;
        this.width = arguments[0].width;
        this.height = arguments[0].height;
        this.touched = true;
        break;
      case 4:
        this.x = arguments[0];
        this.y = arguments[1];
        this.width = arguments[2];
        this.height = arguments[3];
        this.touched = true;
        break;
      default:
        throw "Invalid arguments to PBounds Constructor";
    }
  },

  equals: function (bounds) {
    return bounds.x == this.x && bounds.y == this.y && bounds.width == this.width && bounds.height == this.height;       
  },

  clone: function() {
    return new PBounds(this); 
  },

  isEmpty: function() {
    return this.width == 0 && this.height ==0;
  },

  add: function(x, y, width, height) {
    width = width ? width : 0;
    height = height ? height : 0;

    if (this.touched) {
      var newX = Math.min(x, this.x);
      var newY = Math.min(y, this.y);

      var newBounds = {
        x: newX,
        y: newY,
        width: Math.max(this.x + this.width, x + width) - newX,
        height: Math.max(this.y + this.height, y + height) - newY
      }

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
  }
});

var PNode = Class.extend({
  init: function(params) {
    this.parent = null;
    this.children = [];
    this.bounds = new PBounds();      
    this.fillStyle = null;            
    this.transform = new PTransform();
    this.visible = true;                
    this.invalidPaint = true;    

    if (params) {
      if (params.fillStyle)
        this.fillStyle = params.fillStyle;
      if (params.bounds)
        this.bounds = params.bounds;
    }
  },
  
  paint: function (ctx) {
    if (this.fillStyle && !this.bounds.isEmpty()) {
      ctx.fillStyle = this.fillStyle;
      with (this.bounds) {
        ctx.fillRect(x, y, width, height);
        }
    }
  },
  
  paintAfterChildren: function (ctx) {
  },    
  
  fullPaint: function(ctx) {    
    if (this.visible) { //TODO: fullIntersects(paintContext.getLocalClip())) {
      ctx.save();
      this.transform.applyTo(ctx);
      
      this.paint(ctx);     
              
      for (var i=0; i<this.children.length; i++)        
        this.children[i].fullPaint(ctx);
      
      this.paintAfterChildren(ctx);

      ctx.restore();
    }
  },
  
  scale: function(ratio) {
    this.transform.scale(ratio);
    return this;
  },
  
  translate: function(dx, dy) {
    this.transform.translate(dx, dy);
    return this;
  },
  
  rotate: function(theta) {
    this.transform.rotate(theta);
    return this;
  },
  
  addChild: function(child) {
    this.children.push(child);
    child.parent = this;
  },
  
  setTransform: function(transform) {
    this.transform = transform; 
  },

  animateToTransform: function (transform, duration) {
    if (!duration) {
      this.transform = transform;
    } else {
      this.getRoot().scheduler.schedule(new PTransformActivity(this, transform, duration));
    }
  },

  getRoot: function() {
    if (this.parent == null)
      return null;

    return this.parent.getRoot();
  }
});

var PRoot = PNode.extend({
  init: function(args) {
    this._super(args);

    this.scheduler = new PActivityScheduler(50);
  },

  getRoot: function() {
    return this;
  }
});

var PText = PNode.extend({
  init: function(arg) {
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
      ctx.fillStyle="rgb(0,0,0)";
    }
    ctx.textBaseline = "top";
    ctx.fillText(this.text, 0, 0); 
  }
});

var PImage = PNode.extend({
  init: function(arg) {
    if (typeof arg === "string") {
      this.url = arg;
      this._super();
    } else {
      this.url = arg.url;
      this._super(arg);
    }

    this.loaded = false;

    this.image = new Image();    
    this.image.onload = function() {
      this.loaded = true;
    }
    
    this.image.src = this.url;
  },   
 
  paint: function (ctx) {   
    if (this.loaded)
      ctx.drawImage(this.image, 0, 0);
  }
});

var PLayer = PNode.extend({
  init: function(arg) {
    this._super(arg);

    this.cameras = [];
  },

  addCamera: function(camera) {
    this.cameras.push(camera);
  },

  removeCamera: function(camera) {
    var newCameras = [];

    camera.removeLayer(this);

    for (var i=0; i<this.cameras.length; i++)
      if (camera != this.cameras[i])
        newCameras.push(this.cameras[i]);


    this.cameras = newCameras;
  }
});

var PCamera = PNode.extend({
  init: function() {
    this._super();
    this.layers = [];
   
    this.viewTransform = new PTransform();
  },

  paint: function(ctx) {
    this._super(ctx);

    ctx.save();
    
    this.viewTransform.applyTo(ctx);

    for (var i=0; i < this.layers.length; i++)
      this.layers[i].fullPaint(ctx);

    ctx.restore();
  },

  addLayer: function(layer) {
    this.layers.push(layer);
  },

  removeLayer: function(layer) {
    var newLayers = [];

    for (var i=0; i<this.layers.length; i++)
      if (layer != this.layers[i])
        newLayers.push(this.layers[i]);

    this.layers = newLayers;
  }
});

var PCanvas = Class.extend({
  init: function(canvas, root) {
    if (!canvas)
      throw "Canvas is null";
    
    var _pCanvas = this;
    this.canvas = canvas;
    this.root =  root || new PRoot();
    this.camera = new PCamera();
    var layer = new PLayer();
    this.root.addChild(layer);
    this.root.addChild(this.camera);
    this.camera.addLayer(layer);
    this.invalidPaint = true;
    
    var RepaintActivity = PActivity.extend({      
      step: function() {
        if (_pCanvas.invalidPaint)
          _pCanvas.paint();

        return true;
      }
    });
    
    with (this.camera.getRoot().scheduler) {
      schedule(new RepaintActivity());
      start();
    }
  },
  
  paint: function() {
    if (!this.canvas)
      console.log(this.canvas);
    var ctx = this.canvas.getContext('2d');
    
    ctx.font="16pt Helvetica";
    ctx.fillStyle="rgb(255,255,255)";
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.camera.fullPaint(ctx);   
  }
});

var PActivity = Class.extend({
  init: function(options) {
    this.stepping = false;
    if (typeof options !== "undefined") {
      if (options.init)
        options.init.call(this);
      if (options.started)
        this.started = options.started;
      if (options.step)
        this.step = options.step;
      if (options.finished)
        this.finished = options.finished;

    }
  },
   
  started: function() {
  },
   
  step: function(ellapsedMillis) {
  },
   
  finished: function() {
  }
});

var PActivityScheduler = Class.extend({
  init: function(frameRate) {
    this.pollingRate = frameRate;
    this.nextCallTime = 0;
    this.activities = [];
    this.intervalID = null;
  },
  
  schedule: function(activity, startTime) {
    startTime = startTime || new Date().getTime();
    
    this.activities.push({
      activity: activity,
      startTime: startTime      
    });
  },
  
  step: function() {
    var currentTime = new Date().getTime();
    var keepers = [];
    
    for (var i=0; i<this.activities.length; i++) {
      var sActivity = this.activities[i];
      
      if (sActivity.startTime > currentTime) {        
        keepers.push(sActivity);
      } else {
        with(sActivity.activity) {
          var ellapsedTime = currentTime-sActivity.startTime;
          if (!stepping) {
            stepping = true;
            started();
          }

          var result = step(ellapsedTime);
          if (result) {
            keepers.push(sActivity);
          } else {            
            finished();
          }
          }
      }     
    }
    
    this.activities = keepers;
  },
  
  start: function() {
    var _this = this;
    
    if (!this.intervalID) {
      this.intervalID = setInterval((function() {
        var busy = false; 
        return function() {
          if (busy == true) {
            console.log("too busy for scheduling poll");
            return;
          }
          busy = true;
          try {
            _this.currentTime = new Date().getTime();
            
            _this.step();
             
            busy = false;
          } catch (e) {
            busy = false;
            throw e;
          }
        }
      })(), 25) 
    }
  },
  
  stop: function() {
    if (this.intervalID) {
      clearInterval(this.intervalID);
      this.intervalID = null;
    }
  }
});

var PTransformActivity = PActivity.extend({
  init: function(node, targetTransform, duration) {
    this._super();
    this.duration = duration;
    this.node = node;
    this.source = node.transform;
    this.target = targetTransform;
  },

  started: function() {    
  },

  step: function(ellapsedMillis) {
    var zeroToOne = ellapsedMillis/this.duration;
    var dest = PTransform.lerp(this.source, this.target, zeroToOne);
    this.node.setTransform(dest);
    
    return ellapsedMillis < this.duration;
  },
  
  finished: function() {    
    this.node.setTransform(this.target);
  }
});
