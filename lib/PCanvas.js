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
