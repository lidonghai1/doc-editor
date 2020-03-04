//控制相机移动，目前用于控制整体视图与漫游视图切换
import * as THREE from 'three'

import { TagDivvisible } from 'base/utils/utils'

var moveTagVisible = true

export default class CameraController {
  constructor(
    orbitCamera,
    orbitControl,
    pointerLockCamera,
    pointLockControl,
    orthoCamera,
    modeSwitch,
    modelCenter,
    cbProgress,
    cbComplete
  ) {
    this.orbitCamera = orbitCamera

    this.pointerLockCamera = pointerLockCamera

    this.orbitControl = orbitControl

    this.pointerLockControl = pointLockControl

    this.orthoCamera = orthoCamera

    this.modeSwitch = modeSwitch

    this.modelCenter = modelCenter

    this.cbProgress = cbProgress //进度回调

    this.cbComplete = cbComplete //移动结束回调

    this.timeTotal = 1.2 //总用时设置

    this.timeHalf = this.timeTotal * 0.5 //一半用时

    this.moving = false //是否移动中

    this.movingClock = new THREE.Clock() //计时器

    this.moveDir = new THREE.Vector3() //移动方向,单位矢量

    this.accelerate = 0.0 //加速度

    this.totalLength = 0.0 //总长度

    this.startPoint = new THREE.Vector3() //起点

    this.endPoint = new THREE.Vector3() //终点

    this.startOrient = new THREE.Quaternion()

    this.endOrient = new THREE.Quaternion()

    this.setWalking = modeSwitch.isOverallMode()

    this.enableRotate = true //是否允许移动时旋转相机(指定目的朝向时禁止手工)

    this.pixelToRotation = 0.002
  }

  //移动时隐藏标签判断

  isEnableRotate () {
    return !this.moving || this.enableRotate
  }

  setTimeTotal (time) {
    this.timeTotal = time //总用时设置

    this.timeHalf = this.timeTotal * 0.5 //一半用时
  }

  resetTime () {
    this.timeTotal = 1.2 //总用时设置

    this.timeHalf = this.timeTotal * 0.5 //一半用时
  }

  getCurrentCamera () {
    if (this.modeSwitch.isOverallMode()) {
      return this.orbitCamera
    } else if (this.modeSwitch.isWalkingMode()) {
      return this.pointerLockCamera
    }
    return this.orthoCamera
  }

  resize (width, height) {
    this.orbitCamera.aspect = this.pointerLockCamera.aspect = width / height

    this.pointerLockCamera.updateProjectionMatrix()

    this.orbitCamera.updateProjectionMatrix()

    var fov = this.getCurrentCamera().fov

    this.pointerLockControl.pixelToRotation = this.pixelToRotation =
      (fov * Math.PI) / 180 / height
  }

  moveTo (posDst, orient) {
    //两点移动：俯视图切换到漫游或漫游点间移动, orient朝向，可省略

    this.enableRotate = !orient //是否允许移动时旋转相机

    // HiddenLabel(false);

    if (this.modeSwitch.isOverallMode()) {
      this.orbitCamera.getWorldPosition(this.startPoint)

      this.orbitCamera.getWorldQuaternion(this.startOrient)
    } else {
      this.pointerLockCamera.getWorldPosition(this.startPoint)

      this.pointerLockCamera.getWorldQuaternion(this.startOrient)

      if (orient) {
        //直接旋转相机

        var yawObject = this.pointerLockControl.getObject()

        yawObject.rotation.set(0, 0, 0)

        yawObject.children[0].rotation.set(0, 0, 0)

        this.pointerLockCamera.setRotationFromQuaternion(this.startOrient)
      }
    }

    this.endPoint.copy(posDst)

    this.moveDir.subVectors(this.endPoint, this.startPoint)

    this.totalLength = this.moveDir.length()

    if (this.totalLength > 0) this.moveDir.divideScalar(this.totalLength)

    this.accelerate = this.totalLength / this.timeHalf / this.timeHalf

    this.moving = true

    this.movingClock.start()

    if (orient) {
      this.endOrient.copy(orient)
    } else {
      if (this.modeSwitch.isOverallMode()) {
        //俯视图切换到漫游需要改变朝向

        this.orbitCamera.getWorldQuaternion(this.startOrient)

        var dir = new THREE.Vector3()

        this.orbitCamera.getWorldDirection(dir)

        dir.y = 0

        dir.normalize()

        var up = new THREE.Vector3(0, 1, 0)

        var xAxis = dir.clone().cross(up)

        var mat4 = new THREE.Matrix4()

        mat4.makeBasis(xAxis, up, dir.multiplyScalar(-1))

        this.endOrient.setFromRotationMatrix(mat4)
      } else {
        this.endOrient.copy(this.startOrient)
      }
    }

    this._adjustOrient(this.endPoint, this.endOrient)

    if (moveTagVisible) {
      TagDivvisible(false) //移动时隐藏标签
    }
  }

  moveFromPoint (distance) {
    //漫游图切换到俯视图

    var dir = new THREE.Vector3()

    this.pointerLockCamera.getWorldDirection(dir)

    if (dir.y > -0.5) {
      //最小俯视角度

      dir.y = -0.6
    }

    dir.normalize()

    this.moveDir.copy(dir.multiplyScalar(-1))

    this.pointerLockCamera.getWorldPosition(this.startPoint)

    this.endPoint.addVectors(
      this.moveDir.clone().multiplyScalar(distance),
      this.startPoint
    )

    dir.subVectors(this.modelCenter, this.endPoint)

    dir.normalize()

    var up = new THREE.Vector3(0, 1, 0)

    var xAxis = dir.clone().cross(up)

    up = xAxis.clone().cross(dir)

    var mat4 = new THREE.Matrix4()

    mat4.makeBasis(xAxis, up, dir.clone().multiplyScalar(-1))

    this.endOrient.setFromRotationMatrix(mat4)

    this.moveTo(this.endPoint, this.endOrient)
  }

  update () {
    if (!this.moving) return

    var t = this.movingClock.getElapsedTime()

    if (t >= this.timeTotal) {
      //移动结束

      this.moving = false

      this.movingClock.stop()

      if (this.modeSwitch.isOverallMode()) {
        this.orbitCamera.position.copy(this.endPoint)

        this.orbitCamera.setRotationFromQuaternion(this.endOrient)
      } else {
        this.pointerLockControl.getObject().position.copy(this.endPoint)
      }

      this.adjustPointLock()

      this.cbComplete()

      return
    }

    var dst

    if (t <= this.timeHalf) {
      dst = 0.5 * this.accelerate * t * t
    } else {
      dst =
        this.totalLength -
        0.5 * this.accelerate * (this.timeTotal - t) * (this.timeTotal - t)
    }

    var pt = this.moveDir
      .clone()
      .multiplyScalar(dst)
      .add(this.startPoint)

    var q = new THREE.Quaternion()

    THREE.Quaternion.slerp(
      this.startOrient,
      this.endOrient,
      q,
      t / this.timeTotal
    )

    if (this.modeSwitch.isOverallMode()) {
      this.orbitCamera.position.copy(pt)

      this.orbitCamera.setRotationFromQuaternion(q)
    } else {
      this.pointerLockControl.getObject().position.copy(pt)

      if (!this.enableRotate) {
        this.pointerLockCamera.setRotationFromQuaternion(q)
      }
    }

    this.cbProgress(t / this.timeTotal)
  }

  adjustPointLock () {
    //俯视图切换到漫游视图, 使pointerLockCamera与orbitCamera朝向一致

    var yawObject = this.pointerLockControl.getObject()

    yawObject.position.copy(this.endPoint)

    var dir = new THREE.Vector3(0, 0, -1)

    if (this.enableRotate) {
      if (this.modeSwitch.isOverallMode()) {
        this.orbitCamera.getWorldDirection(dir)
      } else {
        this.pointerLockCamera.getWorldDirection(dir)
      }
    } else {
      dir.applyQuaternion(this.endOrient) // 移动过程可能改变了相机, 改为禁止移动时转动相机（in PointerLockControls.js）
    }

    this.pointerLockCamera.rotation.set(0, 0, 0)

    yawObject.rotation.y = Math.atan2(-dir.x, -dir.z)

    yawObject.children[0].rotation.x = Math.asin(dir.y / dir.length())
  }

  _adjustOrient (pos, orient) {
    //矫正目标位置、朝向与orbitControl一致
    var delta = new THREE.Vector3().subVectors(this.modelCenter, pos)

    var targetDir = new THREE.Vector3(0, 0, -1).applyQuaternion(orient) //

    var target = targetDir
      .clone()
      .multiplyScalar(delta.length())
      .add(pos)

    var q = orient.clone()

    //因为数据精度问题，orbitControl内部变量不能一次计算就保持一致（在pan之后不能保持一致，大概还有其他内部控制不到的内部变量）

    for (var i = 0; i < 100; ++i) {
      this.orbitCamera.position.copy(pos)

      this.orbitControl.target.copy(target)

      this.orbitControl.update()

      this.orbitCamera.getWorldQuaternion(orient)

      if (Math.abs(q.x - orient.x) + Math.abs(q.w - orient.w) < 0.0000000001) { break }

      q.copy(orient)
    }
  }
}
