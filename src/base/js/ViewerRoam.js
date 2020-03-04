import { HiddenMeasure2D, ShowMeasure3D } from 'base/utils/utils'
import $ from 'jquery'

import { config } from 'base/utils/config'

/**
 * modelData: model.json
 * model: 加载后的模型
 * viewPoint: 点数据
 * targetMoved: //是否已移动到目标点
 * cube: 展示立方图正方体
 * modeSwitch: 模型切换
 * anchorManager: 地面点图标
 * cameraController: 相机控制
 * materialSwitch: 漫游纹理切换控制
 */

let matchRecord = []
let changeToOrthographic = false //转换为正交视图
var orthographicCallback //转换后回调
// let curIndex

export default class ViewerRoam {
  constructor(
    modelData,
    model,
    viewPoint,
    cube,
    modeSwitch,
    anchorManager,
    cameraController,
    materialSwitch,
    orbitCamera,
    orbitControl,
    modelCenter,
    modelSize,
    pointerLockControl
  ) {
    this.modelData = modelData
    this.model = model
    this.viewPoint = viewPoint
    this.cube = cube
    this.modeSwitch = modeSwitch
    this.anchorManager = anchorManager
    this.cameraController = cameraController
    this.materialSwitch = materialSwitch
    this.orbitCamera = orbitCamera
    this.orbitControl = orbitControl
    this.modelCenter = modelCenter
    this.modelSize = modelSize
    this.pointerLockControl = pointerLockControl
  }

  setWalkingViewPoint (index, orient) {
    //进入第一视角自动隐藏标尺Ning_20180925
    //HiddenMeasure();
    //console.log("HiddenMeasure");
    HiddenMeasure2D() //隐藏2D标尺
    ShowMeasure3D() //显示3D标尺
    if (index < 0 || index >= this.viewPoint.length) index = 0
    if (this.model == null) {
      if (config.targetIndex !== -1) {
        let dir = this.viewPoint[config.targetIndex].clone().sub(this.viewPoint[index])
        let len = dir.length()
        dir.divideScalar(len)
        this.cube.scale.set(this.modelData.cameraHeight * 2, this.modelData.cameraHeight * 2, len * 2 + this.modelData.cameraHeight * 2)
        this.cube.rotation.set(0, Math.atan2(dir.x, dir.z), 0)
        this.cube.position.copy(this.viewPoint[config.targetIndex])
      } else {
        this.cube.scale.set(this.modelData.cameraHeight * 2, this.modelData.cameraHeight * 2, this.modelData.cameraHeight * 2)
        this.cube.position.copy(this.viewPoint[index])
      }
    }
    if (this.modeSwitch.isOrthographic()) {
      this.modeSwitch.setOverallMode()
    }
    this.anchorManager.normal()
    config.targetIndex = index
    config.targetMoved = false
    this.cameraController.moveTo(this.viewPoint[index], orient)
    // videoController.turnOff()
    this.materialSwitch.setTarget(this.viewPoint[index])
    // textureManager.loadTexture(index, false);
    // underCompass.position.set(viewPoint[index].x, modelData.groundHeight, viewPoint[index].z);
  }

  // setDefaultOverallView () {
  //   this.materialSwitch.restore()
  //   this.modeSwitch.setOverallMode()
  //   this.anchorManager.highlight()
  //   config.targetIndex = -1
  //   config.targetMoved = true
  //   this.orbitCamera.position.set(this.modelCenter.x + this.modelSize / 2, this.modelCenter.y + this.modelSize / 3, this.modelCenter.x + this.modelSize)
  //   this.orbitControl.target.copy(this.modelCenter)
  //   this.orbitControl.update()
  // }

  setWalkingMeshView (index, orient) {
    if (this.modeSwitch.isOrthographic()) {
      this.setWalkingViewPoint(index, orient)
    } else if (this.modeSwitch.isOverallMode()) {
      this.setWalkingViewPoint(index, orient)
    }
    this.modeSwitch.setWalkingMode()
    this.cube.visible = false
    this.materialSwitch.restore()
    let icon = 'iconfont icon-cubelifangti'
    $('.nav-icon-right-top>i:first-child').attr('class', icon)
    $('.cnm').text('模型面')
  }

  setOverallView (position, orient) {
    if (position) {
      this.cameraController.moveTo(position, orient)
    } else {
      this.cameraController.moveFromPoint(this.modelSize)
    }
    if (!this.modeSwitch.isOverallMode()) {
      this.materialSwitch.restore()
      this.modeSwitch.setOverallMode()
      this.anchorManager.highlight()
      config.targetIndex = -1
      config.targetMoved = false
    }
    // videoController.turnOff()
  }

  setOrthographic (position, orient, cb) {
    orthographicCallback = cb
    this.setOverallView(position, orient)
    changeToOrthographic = true
    this.orthoCamera.zoom = 1
  }

  switchToWalkingMode () { //从总览模式切换到漫游模式
    if (config.targetMoved && this.materialSwitch.loaded() && !this.modeSwitch.isWalkingMode()) {
      this.modeSwitch.setWalkingMode()
      // this.materialSwitch.useCubemap()
    }
  }

  onMoving (progress) {
    this.materialSwitch.updateProgress(progress)
  }

  onMoved () { //移动结束
    if (changeToOrthographic) { //转换到正视图
      changeToOrthographic = false
      this.modeSwitch.setOrthographic()
      var pos = this.cameraController.endPoint
      var orient = this.cameraController.endOrient
      var height = pos.y - this.modelData.groundHeight
      var h = height * Math.tan(this.orbitCamera.fov * Math.PI / 360)
      var w = h * this.orbitCamera.aspect
      this.orthoCamera.left = -w
      this.orthoCamera.right = w
      this.orthoCamera.top = h
      this.orthoCamera.bottom = -h
      this.orthoCamera.position.copy(pos)
      this.orthoCamera.setRotationFromQuaternion(orient)
      this.orthoCamera.updateProjectionMatrix()
      orthographicCallback && orthographicCallback()
    }
    config.targetMoved = true
    // videoController.moveTo(targetIndex)
    if (config.targetIndex !== -1) {
      this.switchToWalkingMode()
      // curIndex = this.targetIndex
    }
    // timeRecord = new Date().getTime();
    matchRecord.push(config.targetIndex)
    // onPreLoadTexture(targetIndex);
    // if(debugMode){
    //     var halfAngle = Math.acos(viewPointQ[targetIndex].w);
    //     console.log("角度：", (halfAngle*360/Math.PI).toFixed(2));
    // }
  }
}
