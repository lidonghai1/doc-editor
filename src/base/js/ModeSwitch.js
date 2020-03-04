import $ from 'jquery'
import { config } from 'base/utils/config'

export default class ModeSwitch {
  constructor(materialSwitch, cb) {
    this.ModeOrbit = 1
    this.ModePointerLock = 2
    this.Orthographic = 3

    this.cbModeChange = cb
    this.currentMode = this.ModeOrbit

    this.materialSwitch = materialSwitch
    this.surroundBox = config.cube
  }
  isOverallMode () {
    return this.currentMode === this.ModeOrbit
  }

  isWalkingMode () {
    return this.currentMode === this.ModePointerLock
  }

  isOrthographic () {
    return this.currentMode === this.Orthographic
  }

  setOverallMode () {
    let icon = 'iconfont icon-four'
    $('.nav-icon-right-top>i:first-child').attr('class', icon)
    $('.cnm').text('3D模型')
    // HiddenLabel(true)
    this.surroundBox.visible = false
    this.materialSwitch.restore()
    this.currentMode = this.ModeOrbit
    this.cbModeChange && this.cbModeChange(this)
  }
  setWalkingMode () {
    let icon = 'iconfont icon-three'
    $('.nav-icon-right-top>i:first-child').attr('class', icon)
    $('.cnm').text('漫游模式')
    // HiddenLabel(false)
    //截图进入漫游的放大缩小按钮初始化
    $('.add>img[data-index=cup]').attr('src', './image/jian.png')
    $('.add>img[data-index=add]').attr('src', './image/jia.png')
    if (this.isOverallMode()) {
      this.surroundBox.visible = true
      this.materialSwitch.useCubemap()
      this.currentMode = this.ModePointerLock
    }
    this.cbModeChange && this.cbModeChange(this)
  }
  setOrthographic () {
    let icon = 'iconfont icon-five'
    $('.nav-icon-right-top>i:first-child').attr('class', icon)
    $('.cnm').text('2D平面')
    // HiddenLabel(true)
    this.currentMode = this.Orthographic
    this.cbModeChange && this.cbModeChange(this)
  }
}
