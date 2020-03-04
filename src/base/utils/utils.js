// import * as THREE from 'three'
import $ from 'jquery'

//数组结构体
let LineObjects = []
let LineSelet
// let PointA
// let PointB
// let textsprit
// let textspritGroup = []
// let ButtonSpritGroup = []

// let particleMaterials = new THREE.PointsMaterial({
//   size: 20,
//   vertexColors: true,
//   color: 0xfaad18,
//   transparent: true,
//   opacity: 0
// })

// let particleA = new THREE.Sprite(particleMaterials) //
// let particleB = new THREE.Sprite(particleMaterials) //

// let seletRuler_ID = ''

//撤销测量数据
export function linedel (scene) {
  LineSelet = LineObjects.length - 1
  // let id = LineObjects[LineSelet].line.id
  scene.remove(LineObjects[LineSelet].line)
  scene.remove(LineObjects[LineSelet].point_1.M2)
  scene.remove(LineObjects[LineSelet].point_1.M3)
  scene.remove(LineObjects[LineSelet].point_2.M2)
  scene.remove(LineObjects[LineSelet].point_2.M3)
  scene.remove(LineObjects[LineSelet].textsprit)
  scene.remove(LineObjects[LineSelet].buttonSprit)
  LineObjects.pop()
}

// export function linedel2 () {
//   //删除选中的测量数据
//   let Selet = -1
//   LineObjects.forEach(function (object) {
//     console.log('删除选中的测量数据')
//     Selet += 1
//     if (object.line.id === seletRuler_ID) {
//       scene.remove(object.line)
//       scene.remove(object.point_1.M2)
//       scene.remove(object.point_1.M3)
//       scene.remove(object.point_2.M2)
//       scene.remove(object.point_2.M3)
//       scene.remove(object.textsprit)
//       scene.remove(object.buttonSprit)
//       LineObjects.splice(Selet, 1)
//       delModelRuler(seletRuler_ID)
//     }
//   })
//   // sendAjax()
// }

export function delModelRuler (id) {
  // $('.RulerManagement>li[value=' + id + ']').remove()
  // // 删除model.json中的Ruler
  // let arr = modelData.Ruler
  // arr.forEach((item, index) => {
  //   if (item.id == id) {
  //     arr.splice(index, 1)
  //   }
  // })
}

//隐藏标尺
export function HiddenMeasure () {
  for (var i = 0; i < LineObjects.length; i++) {
    // console.log("visible:", i);
    LineObjects[i].line.visible = false
    LineObjects[i].point_1.M2.visible = false
    LineObjects[i].point_1.M3.visible = false
    LineObjects[i].point_2.M2.visible = false
    LineObjects[i].point_2.M3.visible = false
    LineObjects[i].textsprit.visible = false
    LineObjects[i].buttonSprit.visible = false
  }
}

//显示标尺
export function ShowMeasure () {
  for (var i = 0; i < LineObjects.length; i++) {
    //console.log("visible:", i);
    LineObjects[i].line.visible = true
    LineObjects[i].point_1.M2.visible = true
    LineObjects[i].point_1.M3.visible = true
    LineObjects[i].point_2.M2.visible = true
    LineObjects[i].point_2.M3.visible = true
    LineObjects[i].textsprit.visible = true
    LineObjects[i].buttonSprit.visible = false
  }
}

//隐藏2D标尺
export function HiddenMeasure2D () {
  for (var i = 0; i < LineObjects.length; i++) {
    if (LineObjects[i].line.name === 'iconfont icon-five') {
      LineObjects[i].line.visible = false
      LineObjects[i].point_1.M2.visible = false
      LineObjects[i].point_1.M3.visible = false
      LineObjects[i].point_2.M2.visible = false
      LineObjects[i].point_2.M3.visible = false
      LineObjects[i].textsprit.visible = false
      LineObjects[i].buttonSprit.visible = false
    }
  }
}

//显示2D标尺
export function ShowMeasure2D () {
  for (var i = 0; i < LineObjects.length; i++) {
    if (LineObjects[i].line.name === 'iconfont icon-five') {
      LineObjects[i].line.visible = true
      LineObjects[i].point_1.M2.visible = true
      LineObjects[i].point_1.M3.visible = true
      LineObjects[i].point_2.M2.visible = true
      LineObjects[i].point_2.M3.visible = true
      LineObjects[i].textsprit.visible = true
      LineObjects[i].buttonSprit.visible = false
    }
  }
}

//隐藏3D标尺
export function HiddenMeasure3D () {
  for (var i = 0; i < LineObjects.length; i++) {
    if (LineObjects[i].line.name === 'iconfont icon-four') {
      LineObjects[i].line.visible = false
      LineObjects[i].point_1.M2.visible = false
      LineObjects[i].point_1.M3.visible = false
      LineObjects[i].point_2.M2.visible = false
      LineObjects[i].point_2.M3.visible = false
      LineObjects[i].textsprit.visible = false
      LineObjects[i].buttonSprit.visible = false
    }
  }
}

//显示3D标尺
export function ShowMeasure3D () {
  for (var i = 0; i < LineObjects.length; i++) {
    if (LineObjects[i].line.name === 'iconfont icon-four') {
      LineObjects[i].line.visible = true
      LineObjects[i].point_1.M2.visible = true
      LineObjects[i].point_1.M3.visible = true
      LineObjects[i].point_2.M2.visible = true
      LineObjects[i].point_2.M3.visible = true
      LineObjects[i].textsprit.visible = true
      LineObjects[i].buttonSprit.visible = false
    }
  }
}

//保存测量json
// export function SaveMeasure_Json () {
//   // 定义json变量
//   var json = {
//     PointA_x: particleA.position.x,
//     PointA_y: particleA.position.y,
//     PointA_z: particleA.position.z,
//     PointB_x: particleB.position.x,
//     PointB_y: particleB.position.y,
//     PointB_z: particleB.position.z

//   }

//   // var blob = new Blob([JSON.stringify(json)], { type: "text/plain;charset=utf-8" });
//   // saveAs(blob, "hello.json");
// }

//Label visibility
export function TagDivvisible (visible) {
  var div = document.getElementById('tagmove')
  let Arrow = document.getElementById('tagmoveArrow')
  if (visible) {
    div.style.display = 'block'
    Arrow.style.display = 'block'
    $('#tagmove').animate({
      opacity: '1'
    }, 500)

    $('#tagmoveArrow').animate({
      opacity: '1'
    }, 500)
  } else {
    $('#tagmove').animate({
      opacity: '0'
    }, 500, function () {
      div.style.display = 'none'
    })

    $('#tagmoveArrow').animate({
      opacity: '0'
    }, 500, function () {
      Arrow.style.display = 'none'
    })
  }
}
