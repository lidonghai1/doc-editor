/**
 * @author mrdoob / http://mrdoob.com/
 */

import * as THREE from 'three'

export default function PointerLockControl (camera, renderer, scene) {
  this.pixelToRotation = 0.002
  var slideSpeed = 1
  var scope = this

  camera.rotation.set(0, 0, 0)

  var pitchObject = new THREE.Object3D()
  pitchObject.add(camera)

  var yawObject = new THREE.Object3D()
  yawObject.position.y = 10
  yawObject.add(pitchObject)

  var PI_4 = Math.PI / 4
  var PI_3 = Math.PI / 3.6
  // var maxRotateX = -Math.PI / 4.9;
  // var minRotateX = Math.PI / 6.0;

  this.mouseMove = function (event) {
    if (scope.enabled === false) return
    // if (!cameraController.isEnableRotate()) return

    var movementX =
      event.movementX || event.mozMovementX || event.webkitMovementX || 0
    var movementY =
      event.movementY || event.mozMovementY || event.webkitMovementY || 0

    yawObject.rotation.y += movementX * scope.pixelToRotation
    pitchObject.rotation.x += movementY * scope.pixelToRotation

    pitchObject.rotation.x = Math.max(
      -PI_3,
      Math.min(PI_4, pitchObject.rotation.x)
    )
  }
  var speed, dx, ux, dt, ut
  this.mouseDown = function (event) {
    dx = event.clientX
    dt = new Date().getTime()
    // recordPos = yawObject.rotation.y
  }
  this.mouseUp = function (event) {
    ux = event.clientX
    ut = new Date().getTime()
    speed = (ux - dx) / (ut - dt) / 200

    var timer = setInterval(function () {
      speed = speed * 0.99

      if (speed) {
        // camera.rotation.y+=speed;
        yawObject.rotation.y += speed
      } else {
        clearInterval(timer)
      }
      if ((speed > 0 && speed <= 0.00015) || (speed < 0 && speed >= -0.00015)) {
        clearInterval(timer)
      }
    }, 1)
  }

  this.touchX = this.touchY = 0
  this.touchStart = function (event) {
    scope.touchX = event.changedTouches[0].clientX
    scope.touchY = event.changedTouches[0].clientY
    dx = scope.touchX
    dt = new Date().getTime()
    // recordPos = yawObject.rotation.y
  }

  this.touchMove = function (event) {
    //if ( scope.enabled === false ) return;
    event.preventDefault()
    event.stopPropagation()

    // if (!cameraController.isEnableRotate()) return

    yawObject.rotation.y +=
      (event.changedTouches[0].clientX - scope.touchX) *
      scope.pixelToRotation *
      slideSpeed //滑动系数
    pitchObject.rotation.x +=
      (event.changedTouches[0].clientY - scope.touchY) *
      scope.pixelToRotation *
      slideSpeed //滑动系数;

    // pitchObject.rotation.x = Math.max( maxRotateX, Math.min(minRotateX, pitchObject.rotation.x ) );
    pitchObject.rotation.x = Math.max(
      -PI_3,
      Math.min(PI_4, pitchObject.rotation.x)
    )
    scope.touchX = event.changedTouches[0].clientX
    scope.touchY = event.changedTouches[0].clientY
  }
  this.touchEnd = function (event) {
    scope.touchX = event.changedTouches[0].clientX
    scope.touchY = event.changedTouches[0].clientY
    ux = scope.touchX
    ut = new Date().getTime()
    // if()
    speed = (ux - dx) / (ut - dt) / 80

    var timer = setInterval(function () {
      speed = speed * 0.98

      if (speed) {
        yawObject.rotation.y += speed
      } else {
        clearInterval(timer)
      }
      if ((speed > 0 && speed <= 0.0001) || (speed < 0 && speed >= -0.0001)) {
        clearInterval(timer)
      }
    }, 1)
  }
  this.mouseWheel = function (event) { }
  this.contextMenu = function (event) {
    event.preventDefault()
  }
  this.bounce = function (curPoint, mousePoint) {
    //Wall collision
    var scope = this
    scope.bounceLock = true
    var recordFov = camera.fov //记录此时的recordFov,因为可能由于滚轮或者双指改变
    var timer1
    var timer2
    clearInterval(timer1)
    clearInterval(timer2)
    timer1 = setInterval(function () {
      camera.fov -= 1
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
      if (camera.fov <= recordFov - 3) {
        clearInterval(timer1)
        timer2 = setInterval(function () {
          camera.fov += 0.1
          if (camera.fov >= recordFov) {
            clearInterval(timer2)
            camera.fov = recordFov
            scope.bounceLock = false
          }
          camera.updateProjectionMatrix()
          renderer.render(scene, camera)
        }, 25)
      }
    }, 25)
  }

  this.enabled = false

  this.getObject = function () {
    return yawObject
  }

  this.getDirection = (function () {
    // assumes the camera itself is not rotated

    var direction = new THREE.Vector3(0, 0, -1)
    var rotation = new THREE.Euler(0, 0, 0, 'YXZ')

    return function (v) {
      rotation.set(pitchObject.rotation.x, yawObject.rotation.y, 0)

      v.copy(direction).applyEuler(rotation)

      return v
    }
  })()
}
