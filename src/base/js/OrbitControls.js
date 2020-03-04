/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 */

// 新的
const THREE = window.THREE

console.log(THREE)
console.log(THREE.dispatchEvent)

function isPc () {
  if (
    navigator.userAgent.match(
      /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
    )
  ) {
    return false
  }
  return true
}

var orthoCameraRotation = true
export default function OrbitControls (object, domElement, pointerLockCamera, modeSwitch) {
  this.object = object
  this.orthoCamera = object
  this.domElement = domElement !== undefined ? domElement : document
  // Set to false to disable this control
  this.enabled = true
  // "target" sets the location of focus, where the object orbits around
  this.target = new THREE.Vector3()
  // How far you can dolly in and out ( PerspectiveCamera only )
  this.minDistance = 0
  this.maxDistance = Infinity
  // How far you can zoom in and out ( OrthographicCamera only )
  this.minZoom = 0
  this.maxZoom = Infinity
  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  this.minPolarAngle = 0 // radians
  this.maxPolarAngle = Math.PI // radians
  // How far you can orbit horizontally, upper and lower limits.
  // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
  this.minAzimuthAngle = -Infinity // radians
  this.maxAzimuthAngle = Infinity // radians
  // Set to true to enable damping (inertia)
  // If damping is enabled, you must call controls.update() in your animation loop
  this.enableDamping = true
  this.dampingFactor = 0.25
  // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
  // Set to false to disable zooming
  this.enableZoom = true
  this.zoomSpeed = 1.0
  // Set to false to disable rotating
  this.enableRotate = true
  this.rotateSpeed = 1.0
  // Set to false to disable panning
  this.enablePan = true
  this.panSpeed = 1.0
  this.screenSpacePanning = false // if true, pan in screen-space
  this.keyPanSpeed = 7.0 // pixels moved per arrow key push
  // Set to true to automatically rotate around the target
  // If auto-rotate is enabled, you must call controls.update() in your animation loop
  this.autoRotate = false
  this.autoRotateSpeed = 0.5 // 30 seconds per round when fps is 60
  // Set to false to disable use of the keys
  this.enableKeys = true
  // The four arrow keys
  this.keys = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    BOTTOM: 40
  }
  // Mouse buttons
  this.mouseButtons = {
    LEFT: THREE.MOUSE.LEFT,
    MIDDLE: THREE.MOUSE.MIDDLE,
    RIGHT: THREE.MOUSE.RIGHT
  }
  // for reset
  this.target0 = this.target.clone()
  this.position0 = this.object.position.clone()
  this.zoom0 = this.object.zoom
  //
  // public methods
  //
  this.getPolarAngle = function () {
    return spherical.phi
  }
  this.getAzimuthalAngle = function () {
    return spherical.theta
  }
  this.saveState = function () {
    scope.target0.copy(scope.target)
    scope.position0.copy(scope.object.position)
    scope.zoom0 = scope.object.zoom
  }
  this.reset = function () {
    scope.target.copy(scope.target0)
    scope.object.position.copy(scope.position0)
    scope.object.zoom = scope.zoom0
    scope.object.updateProjectionMatrix()
    scope.dispatchEvent(changeEvent)
    scope.update()
    state = STATE.NONE
  }
  // this method is exposed, but perhaps it would be better if we can make it private...
  this.update = (() => {
    var offset = new THREE.Vector3()
    // so camera.up is the orbit axis
    var quat = new THREE.Quaternion().setFromUnitVectors(
      object.up,
      new THREE.Vector3(0, 1, 0)
    )
    var quatInverse = quat.clone().inverse()
    var lastPosition = new THREE.Vector3()
    var lastQuaternion = new THREE.Quaternion()
    var runOnce = true
    var controlResize
    return function update () {
      var position = scope.object.position
      offset.copy(position).sub(scope.target)
      // rotate offset to "y-axis-is-up" space
      offset.applyQuaternion(quat)
      // angle from z-axis around y-axis
      spherical.setFromVector3(offset)
      if (scope.autoRotate && state === STATE.NONE) {
        rotateLeft(getAutoRotationAngle())
      }
      spherical.theta += sphericalDelta.theta
      spherical.phi += sphericalDelta.phi
      // restrict theta to be between desired limits
      spherical.theta = Math.max(
        scope.minAzimuthAngle,
        Math.min(scope.maxAzimuthAngle, spherical.theta)
      )
      // restrict phi to be between desired limits
      spherical.phi = Math.max(
        scope.minPolarAngle,
        Math.min(scope.maxPolarAngle, spherical.phi)
      )
      spherical.makeSafe()
      //修改模型放大缩小比例
      if (runOnce && spherical.radius) {
        runOnce = false
        scope.objSize = spherical.radius
        spherical.phi *= 0.5
        controlResize = isPc()
        if (controlResize) {
          spherical.radius *= 0.9
        }
      }
      // if(controlResize){
      if (
        scope.objSize &&
        scale > 1 &&
        spherical.radius <= scope.objSize * 1.3
      ) {
        spherical.radius *= scale
      }
      if (
        scope.objSize &&
        scale < 1 &&
        spherical.radius >= scope.objSize * 0.7
      ) {
        spherical.radius *= scale
      }
      // }

      // restrict radius to be between desired limits
      // if(spherical.radius)
      // spherical.radius = Math.max(scope.minDistance, Math.min(scope.maxDistance, spherical.radius));
      // move target to panned location
      scope.target.add(panOffset)
      offset.setFromSpherical(spherical)
      // rotate offset back to "camera-up-vector-is-up" space
      offset.applyQuaternion(quatInverse)
      position.copy(scope.target).add(offset)
      scope.object.lookAt(scope.target)
      if (scope.enableDamping === true) {
        sphericalDelta.theta *= 1 - scope.dampingFactor
        sphericalDelta.phi *= 1 - scope.dampingFactor
        panOffset.multiplyScalar(1 - scope.dampingFactor)
      } else {
        sphericalDelta.set(0, 0, 0)
        panOffset.set(0, 0, 0)
      }
      scale = 1
      // update condition is:
      // min(camera displacement, camera rotation in radians)^2 > EPS
      // using small-angle approximation cos(x/2) = 1 - x^2 / 8
      if (
        zoomChanged ||
        lastPosition.distanceToSquared(scope.object.position) > EPS ||
        8 * (1 - lastQuaternion.dot(scope.object.quaternion)) > EPS
      ) {
        scope.dispatchEvent(changeEvent)
        lastPosition.copy(scope.object.position)
        lastQuaternion.copy(scope.object.quaternion)
        zoomChanged = false
        return true
      }
      return false
    }
  })()
  this.dispose = function () {
    scope.domElement.removeEventListener(
      'contextmenu',
      this.onContextMenu,
      false
    )
    scope.domElement.removeEventListener('mousedown', this.onMouseDown, false)
    scope.domElement.removeEventListener('wheel', this.onMouseWheel, false)
    scope.domElement.removeEventListener(
      'touchstart',
      this.onTouchStart,
      false
    )
    scope.domElement.removeEventListener('touchend', this.onTouchEnd, false)
    scope.domElement.removeEventListener('touchmove', this.onTouchMove, false)
    document.removeEventListener('mousemove', this.onMouseMove, false)
    document.removeEventListener('mouseup', this.onMouseUp, false)
    window.removeEventListener('keydown', onKeyDown, false)
    //scope.dispatchEvent( { type: 'dispose' } ); // should this be added here?
  }
  //
  // internals
  //
  var scope = this
  var changeEvent = {
    type: 'change'
  }
  var startEvent = {
    type: 'start'
  }
  var endEvent = {
    type: 'end'
  }
  var STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_DOLLY_PAN: 4
  }
  var state = STATE.NONE
  var EPS = 0.000001
  // current position in spherical coordinates
  var spherical = new THREE.Spherical()
  var sphericalDelta = new THREE.Spherical()
  var scale = 1
  var panOffset = new THREE.Vector3()
  var zoomChanged = false
  var rotateStart = new THREE.Vector2()
  var rotateEnd = new THREE.Vector2()
  var rotateDelta = new THREE.Vector2()
  var panStart = new THREE.Vector2()
  var panEnd = new THREE.Vector2()
  var panDelta = new THREE.Vector2()
  var dollyStart = new THREE.Vector2()
  var dollyEnd = new THREE.Vector2()
  var dollyDelta = new THREE.Vector2()

  function getAutoRotationAngle () {
    return ((2 * Math.PI) / 60 / 60) * scope.autoRotateSpeed
  }

  function getZoomScale () {
    return Math.pow(0.95, scope.zoomSpeed)
  }

  function rotateLeft (angle) {
    sphericalDelta.theta -= angle
  }

  function rotateUp (angle) {
    sphericalDelta.phi -= angle
  }
  var panLeft = (function () {
    var v = new THREE.Vector3()
    return function panLeft (distance, objectMatrix) {
      v.setFromMatrixColumn(objectMatrix, 0) // get X column of objectMatrix
      v.multiplyScalar(-distance)
      panOffset.add(v)
    }
  })()
  var panUp = (function () {
    var v = new THREE.Vector3()
    return function panUp (distance, objectMatrix) {
      if (scope.screenSpacePanning === true) {
        v.setFromMatrixColumn(objectMatrix, 1)
      } else {
        v.setFromMatrixColumn(objectMatrix, 0)
        v.crossVectors(scope.object.up, v)
      }
      v.multiplyScalar(distance)
      panOffset.add(v)
    }
  })()
  // deltaX and deltaY are in pixels; right and down are positive
  var pan = (function () {
    var offset = new THREE.Vector3()
    return function pan (deltaX, deltaY) {
      var element =
        scope.domElement === document
          ? scope.domElement.body
          : scope.domElement
      if (scope.object.isPerspectiveCamera) {
        // perspective
        var position = scope.object.position
        offset.copy(position).sub(scope.target)
        var targetDistance = offset.length()
        // half of the fov is center to top of screen
        targetDistance *= Math.tan(((scope.object.fov / 2) * Math.PI) / 180.0)
        // we use only clientHeight here so aspect ratio does not distort speed
        panLeft(
          (2 * deltaX * targetDistance) / element.clientHeight,
          scope.object.matrix
        )
        panUp(
          (2 * deltaY * targetDistance) / element.clientHeight,
          scope.object.matrix
        )
      } else if (scope.object.isOrthographicCamera) {
        // orthographic
        panLeft(
          (deltaX * (scope.object.right - scope.object.left)) /
          scope.object.zoom /
          element.clientWidth,
          scope.object.matrix
        )
        panUp(
          (deltaY * (scope.object.top - scope.object.bottom)) /
          scope.object.zoom /
          element.clientHeight,
          scope.object.matrix
        )
      } else {
        // camera neither orthographic nor perspective
        console.warn(
          'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.'
        )
        scope.enablePan = false
      }
    }
  })()

  function dollyIn (dollyScale) {
    if (scope.object.isPerspectiveCamera) {
      scale /= dollyScale
    } else if (scope.object.isOrthographicCamera) {
      scope.object.zoom = Math.max(
        scope.minZoom,
        Math.min(scope.maxZoom, scope.object.zoom * dollyScale)
      )
      scope.object.updateProjectionMatrix()
      zoomChanged = true
    } else {
      console.warn(
        'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.'
      )
      scope.enableZoom = false
    }
  }

  function dollyOut (dollyScale) {
    if (scope.object.isPerspectiveCamera) {
      scale *= dollyScale
    } else if (scope.object.isOrthographicCamera) {
      scope.object.zoom = Math.max(
        scope.minZoom,
        Math.min(scope.maxZoom, scope.object.zoom / dollyScale)
      )
      scope.object.updateProjectionMatrix()
      zoomChanged = true
    } else {
      console.warn(
        'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.'
      )
      scope.enableZoom = false
    }
  }
  //
  // event callbacks - update the object state
  //
  function handleMouseDownRotate (event) {
    //console.log( 'handleMouseDownRotate' );
    rotateStart.set(event.clientX, event.clientY) //T
    rotateEnd.set(event.clientX, event.clientY) //R
  }

  function handleMouseDownDolly (event) {
    //console.log( 'handleMouseDownDolly' );
    dollyStart.set(event.clientX, event.clientY) //H
    dollyEnd.set(event.clientX, event.clientY) //C
  }

  function handleMouseDownPan (event) {
    //console.log( 'handleMouseDownPan' );
    panStart.set(event.clientX, event.clientY) //M
    panEnd.set(event.clientX, event.clientY) //w
  }

  function handleMouseMoveRotate (event) {
    if (modeSwitch.isOrthographic()) {
      //zidong add 20180914
      //修改户型图模式下模型左右旋转
      if (orthoCameraRotation) {
        rotateDelta
          .subVectors(rotateEnd, event)
          .multiplyScalar(scope.rotateSpeed)
        rotateEnd.set(event.clientX, event.clientY)
        this.orthoCamera.rotateZ(rotateDelta.x * 0.004) //20180920
        return
      }
    }
    //console.log( 'handleMouseMoveRotate' );
    rotateEnd.set(event.clientX, event.clientY)
    rotateDelta
      .subVectors(rotateEnd, rotateStart)
      .multiplyScalar(scope.rotateSpeed)
    var element =
      scope.domElement === document ? scope.domElement.body : scope.domElement
    rotateLeft((0.18 * Math.PI * rotateDelta.x) / element.clientHeight) // yes, height
    rotateUp((0.18 * Math.PI * rotateDelta.y) / element.clientHeight)
    //20180914_ning 修改速度模仿MP手感
    rotateStart.copy(rotateEnd)
    scope.update()
    // if (orbitCamera.rotation.x > 0) {
    //     if (rotateDelta.y < 0) {
    //         rotateDelta.y = 0;
    //     }else{
    //         var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
    //         rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth);
    //         rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
    //         rotateStart.copy(rotateEnd);
    //         scope.update();
    //     }
    // }
    // else{
    //     var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
    //     rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth);
    //     rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight);
    //     rotateStart.copy(rotateEnd);
    //     scope.update();
    // }
    //20180914_ning
  }

  function handleMouseMoveDolly (event) {
    if (modeSwitch.isOrthographic()) {
      //zidong中键放大缩小 add 20180914
      dollyDelta.subVectors(dollyEnd, event)
      dollyEnd.set(event.clientX, event.clientY)
      if (dollyDelta.x > 0) {
        if (this.orthoCamera.zoom > 2) {
          return
        }
        this.orthoCamera.zoom *= 1.05
      } else if (dollyDelta.x < 0) {
        if (this.orthoCamera.zoom < 0.5) {
          return
        }
        this.orthoCamera.zoom *= 0.95
      }
      this.orthoCamera.updateProjectionMatrix()
      return
    }
    if (modeSwitch.isWalkingMode()) {
      //zidong中键放大缩小 add 20180914
      dollyDelta.subVectors(dollyEnd, event)
      dollyEnd.set(event.clientX, event.clientY)
      if (dollyDelta.x > 0) {
        if (pointerLockCamera.zoom > 2) {
          return
        }
        pointerLockCamera.zoom *= 1.05
      } else if (dollyDelta.x < 0) {
        if (pointerLockCamera.zoom < 0.5) {
          return
        }
        pointerLockCamera.zoom *= 0.95
      }
      pointerLockCamera.updateProjectionMatrix()
      return
    }

    dollyEnd.set(event.clientX, event.clientY)
    dollyDelta.subVectors(dollyEnd, dollyStart)
    if (dollyDelta.y > 0) {
      dollyIn(getZoomScale())
    } else if (dollyDelta.y < 0) {
      dollyOut(getZoomScale())
    }
    dollyStart.copy(dollyEnd)
    scope.update()
  }

  function handleMouseMovePan (event) {
    if (modeSwitch.isOrthographic()) {
      //zidong移动 add 20180914
      // console.log('户型图模型右键')
      panDelta.subVectors(panEnd, event).multiplyScalar(scope.panSpeed)
      panEnd.set(event.clientX, event.clientY)
      var localTransVector3 = new THREE.Vector3(
        panDelta.x * 0.25,
        panDelta.y * -0.25,
        0
      ).applyQuaternion(this.orthoCamera.quaternion)
      this.orthoCamera.position.add(localTransVector3)
      return
    }
    panEnd.set(event.clientX, event.clientY)
    panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed)
    pan(panDelta.x, panDelta.y)
    panStart.copy(panEnd)
    scope.update()
  }

  function handleMouseUp (event) {
    // console.log( 'handleMouseUp' );
  }

  function handleMouseWheel (event) {
    if (modeSwitch.isOrthographic()) {
      //zidong add 20180914
      //开启平面模型的缩放
      if (event.deltaY < 0) {
        if (this.orthoCamera.zoom > 1.5) {
          return
        }
        this.orthoCamera.zoom *= 1.05
        this.orthoCamera.updateProjectionMatrix()
      } else if (event.deltaY > 0) {
        if (this.orthoCamera.zoom < 0.8) {
          return
        }
        this.orthoCamera.zoom *= 0.95
        this.orthoCamera.updateProjectionMatrix()
      }
      return
    }
    if (modeSwitch.isWalkingMode()) {
      //20181205
      if (event.deltaY < 0) {
        if (pointerLockCamera.zoom > 1.25) {
          return
        }
        pointerLockCamera.zoom *= 1.05
        pointerLockCamera.updateProjectionMatrix()
      } else if (event.deltaY > 0) {
        if (pointerLockCamera.zoom < 0.75) {
          return
        }
        pointerLockCamera.zoom *= 0.95
        pointerLockCamera.updateProjectionMatrix()
      }
      return
    }
    if (event.deltaY < 0) {
      dollyOut(getZoomScale())
    } else if (event.deltaY > 0) {
      dollyIn(getZoomScale())
    }
    scope.update()
  }

  function handleKeyDown (event) {
    //console.log( 'handleKeyDown' );
    switch (event.keyCode) {
      case scope.keys.UP:
        pan(0, scope.keyPanSpeed)
        scope.update()
        break
      case scope.keys.BOTTOM:
        pan(0, -scope.keyPanSpeed)
        scope.update()
        break
      case scope.keys.LEFT:
        pan(scope.keyPanSpeed, 0)
        scope.update()
        break
      case scope.keys.RIGHT:
        pan(-scope.keyPanSpeed, 0)
        scope.update()
        break
    }
    //20180919ning 绘制测量删除撤销；
    if (event.keyCode === 8) {
      //keycode为8表示退格键
      // console.log("测量删除撤销");
      // linedel();
    }
    //20180919ning 绘制测量保存json；
    if (event.keyCode === 83) {
      //keycode为83表示S键
      // console.log("测量保存");
      // SaveMeasure_Json();
    }
  }

  function handleTouchStartRotate (event) {
    //console.log( 'handleTouchStartRotate' );
    rotateStart.set(event.touches[0].pageX, event.touches[0].pageY)
    panStart.set(event.touches[0].pageX, event.touches[0].pageY)
  }

  function handleTouchStartDollyPan (event) {
    //console.log( 'handleTouchStartDollyPan' );
    if (scope.enableZoom) {
      var dx = event.touches[0].pageX - event.touches[1].pageX
      var dy = event.touches[0].pageY - event.touches[1].pageY
      var distance = Math.sqrt(dx * dx + dy * dy)
      dollyStart.set(0, distance)
    }
    if (scope.enablePan) {
      var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX)
      var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY)
      panStart.set(x, y)
      rotateStart.set(event.touches[0].pageX, event.touches[0].pageY)
    }
  }

  function handleTouchMoveRotate (event) {
    //旋转改为移动，修改滑动速度20180918 ning
    if (scope.enablePan) {
      if (modeSwitch && modeSwitch.isOrthographic()) {
        //zidong add 20180914
        var panEnd = new THREE.Vector2(
          event.touches[0].pageX,
          event.touches[0].pageY
        )
        panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed)
        panStart.set(event.touches[0].pageX, event.touches[0].pageY)
        var localTransVector3 = new THREE.Vector3(
          panDelta.x * -0.3,
          panDelta.y * 0.3,
          0
        ).applyQuaternion(this.orthoCamera.quaternion)
        //2Dcamera.positionADD
        this.orthoCamera.position.add(localTransVector3)
        //orthoCamera.position.x += panDelta.x * -0.3;
        //orthoCamera.position.z += panDelta.y * -0.3;
        //console.log(orthoCamera.position);
      } else {
        rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY)
        rotateDelta
          .subVectors(rotateEnd, rotateStart)
          .multiplyScalar(scope.rotateSpeed)
        var element =
          scope.domElement === document
            ? scope.domElement.body
            : scope.domElement
        rotateLeft((0.2 * Math.PI * rotateDelta.x) / element.clientHeight) // yes, height
        rotateUp((0.2 * Math.PI * rotateDelta.y) / element.clientHeight)
        rotateStart.copy(rotateEnd)
        scope.update()
      }
    }
  }

  function handleTouchMoveDollyPan (event) {
    //console.log( 'handleTouchMoveDollyPan' );
    var EventTouchX = event.touches[0].pageX - event.touches[1].pageX
    var EventTouchY = event.touches[0].pageY - event.touches[1].pageY

    var distance = Math.sqrt(
      EventTouchX * EventTouchX + EventTouchY * EventTouchY
    )
    if (scope.enableZoom) {
      if (modeSwitch.isOrthographic()) {
        //zidong add 20180914
        //o = e,  y.subVectors(C, o), C.set(o.clientX, o.clientY);
        dollyEnd.set(0, distance)
        dollyDelta.subVectors(dollyEnd, dollyStart)
        dollyStart.set(0, distance)
        if (dollyDelta.y > 0) {
          if (this.orthoCamera.zoom <= 2) {
            this.orthoCamera.zoom *= 1.02
          }
        } else if (dollyDelta.y < 0) {
          if (this.orthoCamera.zoom >= 0.5) {
            this.orthoCamera.zoom *= 0.98
          }
        }
        this.orthoCamera.updateProjectionMatrix()
      } else if (modeSwitch.isWalkingMode()) {
        //o = e,  y.subVectors(C, o), C.set(o.clientX, o.clientY);
        // var EventTouchX = event.touches[0].pageX - event.touches[1].pageX
        // var EventTouchY = event.touches[0].pageY - event.touches[1].pageY
        dollyEnd.set(0, distance)
        dollyDelta.subVectors(dollyEnd, dollyStart)
        dollyStart.set(0, distance)
        if (dollyDelta.y > 0) {
          if (pointerLockCamera.zoom <= 2) {
            pointerLockCamera.zoom *= 1.02
          }
        } else if (dollyDelta.y < 0) {
          if (pointerLockCamera.zoom >= 0.5) {
            pointerLockCamera.zoom *= 0.98
          }
        }
        pointerLockCamera.updateProjectionMatrix()
      } else {
        var dx = event.touches[0].pageX - event.touches[1].pageX
        var dy = event.touches[0].pageY - event.touches[1].pageY
        distance = Math.sqrt(dx * dx + dy * dy)
        dollyEnd.set(0, distance)
        dollyDelta.set(0, Math.pow(dollyEnd.y / dollyStart.y, scope.zoomSpeed))
        dollyIn(dollyDelta.y)
        dollyStart.copy(dollyEnd)
        scope.update()
      }
    }
    //移动改旋转20180918 ning
    if (modeSwitch.isOrthographic()) {
      //zidong add 20180914
      var rotateEnd = new THREE.Vector2(
        event.touches[0].pageX,
        event.touches[0].pageY
      )
      rotateDelta
        .subVectors(rotateEnd, rotateStart)
        .multiplyScalar(scope.rotateSpeed)
      rotateStart.set(event.touches[0].pageX, event.touches[0].pageY)
      this.orthoCamera.rotateZ(rotateDelta.x * -0.005)
      // return;
    } else {
      //console.log( 'handleTouchMoveRotate' );
      var x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX)
      var y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY)
      panEnd.set(x, y)
      panDelta.subVectors(panEnd, panStart).multiplyScalar(scope.panSpeed)
      pan(panDelta.x, panDelta.y)
      panStart.copy(panEnd)
      scope.update()
    }
  }

  function handleTouchEnd (event) {
    //console.log( 'handleTouchEnd' );
  }
  //
  // event handlers - FSM: listen for events and reset state
  //
  this.onMouseDown = function (event) {
    if (scope.enabled === false) return
    event.preventDefault()
    switch (event.button) {
      case scope.mouseButtons.LEFT:
        if (event.ctrlKey || event.metaKey) {
          if (scope.enablePan === false) return
          handleMouseDownPan(event)
          state = STATE.PAN
        } else {
          if (scope.enableRotate === false) return
          handleMouseDownRotate(event)
          state = STATE.ROTATE
        }
        break
      case scope.mouseButtons.MIDDLE:
        if (scope.enableZoom === false) return
        handleMouseDownDolly(event)
        state = STATE.DOLLY
        break
      case scope.mouseButtons.RIGHT:
        if (scope.enablePan === false) return
        handleMouseDownPan(event)
        state = STATE.PAN
        break
    }
    if (state !== STATE.NONE) {
      document.addEventListener('mousemove', this.onMouseMove, false)
      document.addEventListener('mouseup', this.onMouseUp, false)
      scope.dispatchEvent(startEvent)
    }
  }

  this.onMouseMove = function (event) {
    if (scope.enabled === false) return
    event.preventDefault()
    switch (state) {
      case STATE.ROTATE:
        if (scope.enableRotate === false) return
        handleMouseMoveRotate(event)
        break
      case STATE.DOLLY:
        if (scope.enableZoom === false) return
        handleMouseMoveDolly(event)
        break
      case STATE.PAN:
        if (scope.enablePan === false) return
        handleMouseMovePan(event)
        break
    }
  }

  this.onMouseUp = function (event) {
    if (scope.enabled === false) return
    handleMouseUp(event)
    document.removeEventListener('mousemove', this.onMouseMove, false)
    document.removeEventListener('mouseup', this.onMouseUp, false)
    scope.dispatchEvent(endEvent)
    state = STATE.NONE
  }

  this.onMouseWheel = function (event) {
    // console.log("scope.enabled",scope.enabled);
    // console.log("scope.enableZoom",scope.enableZoom);
    // console.log("state",state);
    if (!modeSwitch.isWalkingMode()) {
      if (
        scope.enabled === false ||
        scope.enableZoom === false ||
        (state !== STATE.NONE && state !== STATE.ROTATE)
      ) { return }
    }

    event.preventDefault()
    event.stopPropagation()
    scope.dispatchEvent(startEvent)
    handleMouseWheel(event)
    scope.dispatchEvent(endEvent)
  }

  function onKeyDown (event) {
    if (
      scope.enabled === false ||
      scope.enableKeys === false ||
      scope.enablePan === false
    ) { return }
    handleKeyDown(event)
  }

  this.onTouchStart = function (event) {
    if (scope.enabled === false) return
    switch (event.touches.length) {
      case 1: // one-fingered touch: rotate
        if (scope.enableRotate === false) return
        handleTouchStartRotate(event)
        state = STATE.TOUCH_ROTATE
        break
      case 2: // two-fingered touch: dolly-pan
        if (scope.enableZoom === false && scope.enablePan === false) return
        handleTouchStartDollyPan(event)
        state = STATE.TOUCH_DOLLY_PAN
        break
      default:
        state = STATE.NONE
    }
    if (state !== STATE.NONE) {
      scope.dispatchEvent(startEvent)
    }
  }

  this.onTouchMove = function (event) {
    // if (!modeSwitch.isWalkingMode()) {
    if (scope.enabled === false) return
    event.preventDefault()
    event.stopPropagation()
    switch (event.touches.length) {
      case 1: // one-fingered touch: rotate
        if (scope.enableRotate === false) return
        if (state !== STATE.TOUCH_ROTATE) return // is this needed?
        handleTouchMoveRotate(event)
        break
      case 2: // two-fingered touch: dolly-pan
        if (scope.enableZoom === false && scope.enablePan === false) return
        if (state !== STATE.TOUCH_DOLLY_PAN) return // is this needed?
        handleTouchMoveDollyPan(event)
        break
      default:
        state = STATE.NONE
    }
    // }else{
    // handleTouchMoveDollyPan(event);
    // handleTouchMoveRotate(event);
    // }
  }

  this.onTouchEnd = function (event) {
    if (scope.enabled === false) return
    handleTouchEnd(event)
    scope.dispatchEvent(endEvent)
    state = STATE.NONE
  }

  this.onContextMenu = function (event) {
    if (scope.enabled === false) return
    event.preventDefault()
  }
  //
  scope.domElement.addEventListener('contextmenu', this.onContextMenu, false)
  scope.domElement.addEventListener('mousedown', this.onMouseDown, false)
  scope.domElement.addEventListener('wheel', this.onMouseWheel, {
    passive: false
  })
  scope.domElement.addEventListener('touchstart', this.onTouchStart, {
    passive: false
  })
  scope.domElement.addEventListener('touchend', this.onTouchEnd, {
    passive: false
  })
  scope.domElement.addEventListener('touchmove', this.onTouchMove, {
    passive: false
  })
  window.addEventListener('keydown', onKeyDown, false)
  // force an update at start
  this.update()
};
OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype)
// THREE.OrbitControls.prototype.constructor = THREE.OrbitControls
// Object.defineProperties(THREE.OrbitControls.prototype, {
//   center: {
//     get: function () {
//       console.warn('THREE.OrbitControls: .center has been renamed to .target')
//       return this.target
//     }
//   },
//   // backward compatibility
//   noZoom: {
//     get: function () {
//       console.warn(
//         'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.'
//       )
//       return !this.enableZoom
//     },
//     set: function (value) {
//       console.warn(
//         'THREE.OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.'
//       )
//       this.enableZoom = !value
//     }
//   },
//   noRotate: {
//     get: function () {
//       console.warn(
//         'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.'
//       )
//       return !this.enableRotate
//     },
//     set: function (value) {
//       console.warn(
//         'THREE.OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.'
//       )
//       this.enableRotate = !value
//     }
//   },
//   noPan: {
//     get: function () {
//       console.warn(
//         'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.'
//       )
//       return !this.enablePan
//     },
//     set: function (value) {
//       console.warn(
//         'THREE.OrbitControls: .noPan has been deprecated. Use .enablePan instead.'
//       )
//       this.enablePan = !value
//     }
//   },
//   noKeys: {
//     get: function () {
//       console.warn(
//         'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.'
//       )
//       return !this.enableKeys
//     },
//     set: function (value) {
//       console.warn(
//         'THREE.OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.'
//       )
//       this.enableKeys = !value
//     }
//   },
//   staticMoving: {
//     get: function () {
//       console.warn(
//         'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.'
//       )
//       return !this.enableDamping
//     },
//     set: function (value) {
//       console.warn(
//         'THREE.OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.'
//       )
//       this.enableDamping = !value
//     }
//   },
//   dynamicDampingFactor: {
//     get: function () {
//       console.warn(
//         'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.'
//       )
//       return this.dampingFactor
//     },
//     set: function (value) {
//       console.warn(
//         'THREE.OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.'
//       )
//       this.dampingFactor = value
//     }
//   }
// })
