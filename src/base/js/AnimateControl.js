//播放控制

//根据animate.json中配置进行播放控制

//动画命令需要通多addCommand注册，每个命令需实现start update pause continue stop五个方法

//json配置说明

// {

//     "main":{ //动画名称

//     "frames": [ //帧集合

//         {

//             "type": "script", //命令类型

//             "update":true,    //动画期间是否需要调用update方法，不需要的不要设置

//             "start": 6.0,     //开始时间，要求从小到大排序排列

//             "duration": 0.2,  //持续时间

//             "data": "setOverallView();" //关联的数据

//         }

// }

import signals from 'signals'
import * as THREE from 'three'

export default class AnimateControl {
  constructor(data) {
    this.data = data

    this.commands = {}

    // this.addCommand(new ScriptCommand())

    this.clock = new THREE.Clock() //计时器

    this.playing = false

    this.timeElapsed = 0.0 //已播放时间

    this.currentFrames = [] //当前所有帧（命令）

    this.currentFrame = 0 //当前待播放帧索引，要求数据按起始时间排序

    this.execFrames = [] //当前执行中的命令

    this.signalStop = new signals.Signal()

    this.Stoped = 0

    this.Playing = 1

    this.Pause = 2
  }

  // addCommand (command) {
  //   this.commands[command.getType()] = command
  // }

  getState () {
    if (this.playing) return this.Playing

    if (this.execFrames.length === 0 && this.currentFrame >= this.currentFrames.length) { return this.Stoped }

    return this.Pause
  }

  play (name) {
    if (!this.data.hasOwnProperty(name)) return

    this.currentFrames = this.data[name].frames

    this.currentFrame = 0

    this.execFrames = []

    this.playing = true

    this.timeElapsed = 0

    this.clock.start()

    this.update()
  }

  pause () {
    this.clock.stop()

    this.playing = false

    for (var i = this.execFrames.length - 1; i >= 0; --i) {
      var frame = this.execFrames[i]

      var command = this.commands[frame.type]

      if (command) {
        this.commands[frame.type].pause(frame)
      }
    }
  }

  continue () {
    this.clock.start()

    this.playing = true

    for (var i = this.execFrames.length - 1; i >= 0; --i) {
      var frame = this.execFrames[i]

      var command = this.commands[frame.type]

      if (command) {
        this.commands[frame.type].continue(frame)
      }
    }
  }

  stop () {
    for (var i = this.execFrames.length - 1; i >= 0; --i) {
      var frame = this.execFrames[i]

      var command = this.commands[frame.type]

      if (command) {
        this.commands[frame.type].stop(frame)
      }
    }

    this.playing = false

    this.currentFrames = []

    this.currentFrame = 0

    this.execFrames = []

    this.signalStop.dispatch()
  }

  update () {
    if (!this.playing) return

    this.timeElapsed += this.clock.getDelta()

    //更新播放

    for (var i = this.execFrames.length - 1; i >= 0; --i) {
      let frame = this.execFrames[i]

      if (this.timeElapsed > frame.start + frame.duration) { //结束
        this.execFrames.splice(i, 1)

        this.commands[frame.type].stop(frame)

        if (this.execFrames.length === 0 && this.currentFrame >= this.currentFrames.length) {
          this.stop()
        }
      } else {
        if (frame.update) {
          this.commands[frame.type].update(frame, this.timeElapsed - frame.start)
        }
      }
    }

    //开始播放

    while (this.currentFrame < this.currentFrames.length &&

      this.currentFrames[this.currentFrame].start <= this.timeElapsed) {
      let frame = this.currentFrames[this.currentFrame]

      let command = this.commands[frame.type]

      if (command) {
        this.execFrames.push(frame)

        command.start(frame)
      }

      ++this.currentFrame
    }
  }
}
