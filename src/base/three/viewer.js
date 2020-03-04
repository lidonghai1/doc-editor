// import * as TWEEN from 'es6-tween'
// import $ from 'jquery'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import OrbitControls from 'base/js/OrbitControls'
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
// import { BasisTextureLoader } from 'three/examples/jsm/loaders/BasisTextureLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import PointerLockControl from 'base/js/PointerLockControls'
import TextureManager from 'base/js/TextureManager1'
import AnchorManager from 'base/js/AnchorManager'
import MaterialSwitch from 'base/js/MaterialSwitch'
import ModeSwitch from 'base/js/ModeSwitch'
import CameraController from 'base/js/CameraController'
// import AnimateControl from 'base/js/AnimateControl'
import ViewerRoam from 'base/js/ViewerRoam'

import { config } from 'base/utils/config'

const THREE = window.THREE

THREE.PointerLockControls = PointerLockControl
THREE.OrbitControls = OrbitControls

let viewPoint = [] //vector3 各视点位置
// let viewPointQ = [] //vector4 各视点立方图旋转
const cubeUrls = []
const smallUrls = []

let container = ''
let background = new THREE.Color(0x181a1c)
let renderer = new THREE.WebGLRenderer()
let scene = new THREE.Scene()
let pointerLockCamera = {}
let pointerLockControl = {}
let orbitCamera = {}
let orthoCamera = {}
let orbitControl = {}
// let animateControl = {} //动画播放控制

let cameraController = {}
let textureManager = {}
let anchorManager = {}
let materialSwitch = {}
let modeSwitch = {}
let viewerRoam = {}

let mesh
let groupMesh = new THREE.Group()
// let modelData = ''
let sourceUrl = ''
let modelCenter = new THREE.Vector3() //模型中心
let modelSize = 30 //模型包围盒对角线长度
// let cube //展示立方图正方体
// let targetIndex = -1 //目标位置索引
let orientTimer
// let targetMoved = false //是否已移动到目标点

// let matchRecord = []
let changeToOrthographic = false //转换为正交视图
var orthographicCallback //转换后回调

// const tilesPath = 'tiles_m/'
const FILEEXT = '.jpg'
// let mainArr = []

// let modelSatae = true

export default class Viewer {
  constructor(dom, data) {
    this.dom = dom
    this.data = data
    this.loadedNum = 0
    this.init()
  }

  init () {
    container = this.dom
    renderer.setClearColor(background)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.outputEncoding = 3000
    renderer.domElement.id = 'sceneWrapper'
    container.appendChild(renderer.domElement)
    scene.background = new THREE.TextureLoader().load(require('assets/image/background.jpg'))
    let aspect = container.clientWidth / container.clientHeight
    pointerLockCamera = new THREE.PerspectiveCamera(68, aspect, 0.2, 5000)
    orbitCamera = new THREE.PerspectiveCamera(50, aspect, 0.2, 5000)
    orthoCamera = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.5, 5000)
    scene.add(orbitCamera)
    pointerLockControl = new THREE.PointerLockControls(pointerLockCamera, renderer, scene)
    scene.add(pointerLockControl.getObject())
    // orbitControl = new OrbitControls(orbitCamera, renderer.domElement)
    // orbitControl.enableDamping = true // an animation loop is required when either damping or auto-rotation are enabled
    // orbitControl.dampingFactor = 0.25 // 0.25 3D视角阻尼;
    // orbitControl.enablePan = true
    // orbitControl.enableZoom = true //20180914_ning
    // // orbitControl.panningMode = THREE.HorizontalPanning // default is THREE.ScreenSpacePanning
    // orbitControl.panSpeed = 0.1 //20180914_ning
    // orbitControl.maxPolarAngle = Math.PI / 2
    // //Set the farthest distance from the origin of the camera
    // // orbitControl.minDistance = 15

    // //Set the farthest distance from the origin of the camera
    // orbitControl.maxDistance = 120

    // const light = new THREE.AmbientLight(0xffffff) // soft white light
    // scene.add(light)

    this.initGetScanModel()
  }

  initGetScanModel () {
    const data = this.data
    // if (data.code === 200) {
    // let basisTexture

    // let material = new THREE.MeshBasicMaterial()
    // let meshData = new THREE.Mesh()
    // var dracoLoader = new DRACOLoader()
    // dracoLoader.setDecoderPath('./static/libs/draco/')
    // dracoLoader.setDecoderConfig({ type: 'wasm' })
    // var basisLoader = new BasisTextureLoader()
    var gltfLoader = new GLTFLoader()
    // basisLoader.setTranscoderPath('./static/libs/basis/')
    // basisLoader.detectSupport(renderer)
    // basisTextureLoader默认是4个线程，PC端就开启6个线程
    // if (window.deviceMsg.isPc) {
    // basisLoader.setWorkerLimit(6)
    // basisTexture = 'texture_3.basis'
    // } else {
    //   basisTexture = 'texture_2.basis'
    // }

    const url = data.items_path.items_dir_path
    // const geoUrl = url + 'model/model.drc'
    // const textureUrl = url + `model/texture_drc/${basisTexture}`
    // dracoLoader.load(
    //   geoUrl,
    //   geometry => {
    //     basisLoader.load(
    //       textureUrl,
    //       texture => {
    //         texture.encofing = THREE.sRGBEncofing
    //         material.map = texture
    //         meshData.geometry = geometry
    //         meshData.material = material
    //         meshData.rotateX(-Math.PI * 0.5)
    //         meshData.geometry.computeBoundingBox()
    //         // meshData.geometry.center()
    //         mesh = meshData
    //         groupMesh.add(meshData)
    //         scene.add(groupMesh)
    //         this.initLoadedModel(meshData)
    //       }
    //     )
    //   }, undefined,
    //   function () {
    gltfLoader.load(
      url + '/model.glb',
      (glb) => {
        glb.scene.children.forEach(child => {
          child.rotateX(-Math.PI * 0.5)
          groupMesh.add(child)
          mesh = child
        })
        // glb.scene.rotateX(-Math.PI * 0.5)
        scene.add(groupMesh)
        this.initLoadedModel(groupMesh)
      }, (xhr) => {
        this.printLoaded(xhr)
      }
    ) //无drc时加载glb
    //   }
    // )

    sourceUrl = data.items_path.items_dir_path
    var imagePath = sourceUrl + 'hjpeg/'
    var limagePath = sourceUrl + '1k/'
    var vpoint = []
    var vpointQ = []
    for (var i = 0, len = data.viewPoints.length; i < len; ++i) {
      var pt = data.viewPoints[i]
      vpoint.push(new THREE.Vector3(pt.x, pt.y, pt.z))
      var q = pt.q
      vpointQ.push(new THREE.Vector4(-q[0], -q[1], -q[2], q[3]))

      var urls = []
      var urls2 = []
      for (var j = 0; j < 6; ++j) {
        urls.push(imagePath + (i * 6 + j) + FILEEXT)
        urls2.push(limagePath + (i * 6 + j) + FILEEXT)
      }
      cubeUrls.push(urls)
      smallUrls.push(urls2)
    }
    viewPoint = vpoint
    // viewPointQ = vpointQ

    // }
  }

  printLoaded (xhr) {
    this.loadedNum = parseInt(xhr.loaded / xhr.total * 100)
  }

  initLoadedModel (meshData) {
    materialSwitch = new MaterialSwitch(meshData)

    let model = mesh = meshData

    const box = new THREE.Box3()
    model.traverse(function (child) {
      if (child.isMesh) {
        child.geometry.computeBoundingBox()
        box.union(child.geometry.boundingBox)
      }
    })

    //包围盒信息
    modelCenter = new THREE.Vector3()
    modelCenter.x = (box.max.x + box.min.x) / 2
    modelCenter.y = (box.max.z + box.min.z) / 2
    modelCenter.z = -(box.max.y + box.min.y) / 2

    modelSize = box.max
      .clone()
      .sub(box.min)
      .length()

    this.data.groundHeight = box.min.z
    anchorManager = new AnchorManager(
      viewPoint,
      this.data.anchorSize,
      this.data.cameraHeight,
      scene,
      model,
      this.data,
      cameraController,
      modeSwitch,
      groupMesh
    ) //need groundheight

    var box2 = box.clone()
    box2.min.multiplyScalar(1.1)
    box2.max.multiplyScalar(1.1)

    var sizex = box2.max.x - box2.min.x
    var sizey = box2.max.z - box2.min.z
    var sizez = box2.max.y - box2.min.y

    config.cube = new THREE.Mesh(
      new THREE.BoxGeometry(sizex, sizey, sizez),
      materialSwitch.matCube
    )
    config.cube.geometry.scale(-1, 1, 1)
    config.cube.position.set(
      box2.max.x - sizex / 2,
      box2.max.z - sizey / 2,
      -box.min.y - sizez / 2
    )
    config.cube.name = 'box'
    scene.add(config.cube)

    modeSwitch = new ModeSwitch(materialSwitch, this.onModeChange)

    orbitControl = new THREE.OrbitControls(orbitCamera, renderer.domElement, pointerLockCamera, modeSwitch)
    orbitControl.enableDamping = true // an animation loop is required when either damping or auto-rotation are enabled
    orbitControl.dampingFactor = 0.1 // 0.25 3D视角阻尼;
    orbitControl.enablePan = true
    orbitControl.enableZoom = true //20180914_ning
    // orbitControl.panningMode = THREE.HorizontalPanning // default is THREE.ScreenSpacePanning
    orbitControl.panSpeed = 0.1 //20180914_ning
    orbitControl.maxPolarAngle = Math.PI / 2
    //Set the farthest distance from the origin of the camera
    orbitControl.minDistance = 30

    //Set the farthest distance from the origin of the camera
    orbitControl.maxDistance = 80

    cameraController = new CameraController(
      orbitCamera,
      orbitControl,
      pointerLockCamera,
      pointerLockControl,
      orthoCamera,
      modeSwitch,
      modelCenter,
      this.onMoving,
      this.onMoved
    )

    viewerRoam = new ViewerRoam(this.data, meshData, viewPoint, config.cube, modeSwitch, anchorManager, cameraController, materialSwitch, orbitCamera, orbitControl, modelCenter, modelSize, pointerLockControl)
    // textureManager = new TextureManager(scene, renderer, THREE, cubeUrls, smallUrls, sourceUrl, viewPoint, viewPointQ, mainArr, this.onTexutueLoaded, this.setWalkingViewPoint, anchorManager)
    textureManager = new TextureManager(renderer, cubeUrls, smallUrls, this.onTexutueLoaded, this.setWalkingViewPoint)

    // $.getJSON(sourceUrl + 'animate.json', function (obj) {
    //   animateControl = new AnimateControl(obj)
    // })

    // renderer.domElement.style.opacity = 1
    window.addEventListener('resize', this.onWindowResize, false)
    window.addEventListener('orientationchange', this.orientationWindow, false)
    // renderer.domElement.addEventListener('mousedown', this.onMousedown, false) ////避免不能点击其他元素
    // renderer.domElement.addEventListener('mouseup', this.onMouseup, false) //renderer.domElement无法释放！
    // renderer.domElement.addEventListener('mousemove', this.onMousemove, false)
    renderer.domElement.addEventListener('touchstart', this.onTouchstart, false)
    renderer.domElement.addEventListener('touchend', this.onTouchend, false)
    renderer.domElement.addEventListener('touchmove', this.onTouchmove, false)
    // renderer.domElement.addEventListener('click', this.onClick.bind(this))
    renderer.domElement.addEventListener('wheel', this.onMousewheel, false)
    renderer.domElement.addEventListener('contextmenu', this.onContextmenu, false)

    // module3D = new Module3D(renderer, scene, cameraController)

    // setupCompass()

    // setInterval(function () {
    //   if (mainArr.length > 0) {
    //     textureManager.downloadAndDisplayImg(mainArr[0])
    //     mainArr.shift()
    //   }
    // }, 30)

    this.setDefaultOverallView()
    this.animate()
  }

  onClick (e) {
    if (config.ismouseMoved) return
    if (!config.targetMoved) return //防止快速点击
    var size = renderer.getSize(new THREE.Vector2())

    var raycasterClick = new THREE.Raycaster()
    var mousePointClick = new THREE.Vector2()

    var mousex = (e.offsetX / size.width) * 2 - 1
    var mousey = -(e.offsetY / size.height) * 2 + 1

    mousePointClick.x = mousex
    mousePointClick.y = mousey

    // 把获取的坐标传进 raycaster
    raycasterClick.setFromCamera(mousePointClick, orbitCamera)

    // 找到场景中所有外部模型
    var scensObjs = []
    // scensObjs.push(model);
    if (mesh.type === 'Mesh') {
      scensObjs.push(mesh)
    } else {
      mesh.children.forEach(child => {
        scensObjs.push(child)
      })
    }

    // 返回选中的外部模型对象
    var intersects = raycasterClick.intersectObjects(scensObjs)

    var objs = []
    for (var i = 0; i < intersects.length; i++) {
      var intersect = intersects[i]
      if (intersect.object instanceof THREE.Mesh) {
        var obj = intersect.object.parent
        // 把距离加到模型用户数据里面，方便后面排序
        obj.userData.distance = intersect.distance
        objs.push(obj)
      }
    }

    // 按照距离排序
    objs = objs.sort((a, b) => {
      return a.userData.distance - b.userData.distance
    })
    // 如果为空，则不进入全景
    if (objs.length <= 0) return

    var vector
    // var deltaY
    if (modeSwitch.isWalkingMode()) {
      vector = new THREE.Vector3(mousex, mousey, 1).unproject(pointerLockCamera)
      vector.sub(pointerLockControl.getObject().position)
    } else {
      vector = new THREE.Vector3(mousex, mousey, 1).unproject(orbitCamera)
      vector.sub(orbitCamera.position)
    }
    vector.normalize()
    if (e.clientX !== config.posMouseDown.x || e.clientY !== config.posMouseDown.y) { //有时mousedown后会直接触发mousemove
      config.ismouseMoved = true
    }

    var matched = -1
    var maxDot = 0.5
    var dir = new THREE.Vector3()

    for (let i = 0; i < viewPoint.length; ++i) {
      if (modeSwitch.isOverallMode() || i !== config.targetIndex) {
        if (modeSwitch.isOverallMode()) {
          dir.subVectors(viewPoint[i], orbitCamera.position)
          // dir.set(viewPoint[i].x - orbitCamera.position.x, deltaY, viewPoint[i].z - orbitCamera.position.z);
        } else {
          dir.subVectors(viewPoint[i], viewPoint[config.targetIndex])
          //dir.set(viewPoint[i].x - viewPoint[targetIndex].x, deltaY, viewPoint[i].z - viewPoint[targetIndex].z);
        }
        dir.y -= this.data.cameraHeight
        dir.normalize()

        var temp = dir.dot(vector)

        if (temp > maxDot) {
          maxDot = temp
          matched = i
        }
      }
      // if (i !== config.targetIndex) {
      //   dir.subVectors(viewPoint[i], orbitCamera.position)
      // }
      // dir.y -= this.data.cameraHeight
      // dir.normalize()

      // var temp = dir.dot(vector)
      // if (temp > maxDot) {
      //   maxDot = temp
      //   matched = i
      // }
    }

    if (matched !== -1) {
      console.log('matched' + matched)
      textureManager.loadTexture(matched, true)
    } else {
      if (!pointerLockControl.bounceLock) {
        pointerLockControl.bounce()
      }
      // targetMoved = true
    }
  }

  onMousemove (e) {
    if (e.clientX !== config.posMouseDown.x || e.clientY !== config.posMouseDown.y) {
      config.ismouseMoved = true
      pointerLockControl.mouseMove(e)
    }
    if (!modeSwitch.isWalkingMode()) {
      orbitControl.onMouseMove(e)
    }
  }

  onMousedown (e) {
    config.ismouseMoved = false
    config.posMouseDown.x = e.clientX
    config.posMouseDown.y = e.clientY

    if ((e.buttons & 1) === 1 && modeSwitch.isWalkingMode()) {
      pointerLockControl.enabled = true
      pointerLockControl.mouseDown(e)
    }
    if (!modeSwitch.isWalkingMode()) {
      orbitControl.onMouseDown(e)
    }
  }

  onMouseup (e) {
    if (e.buttons === 0 && modeSwitch.isWalkingMode()) {
      pointerLockControl.enabled = false
      pointerLockControl.mouseUp(e)
    }
    if (!modeSwitch.isWalkingMode()) {
      orbitControl.onMouseUp(e)
    }
  }

  onMousewheel (e) {
    if (modeSwitch.isWalkingMode()) {
      pointerLockControl.mouseWheel(e)
    }
    if (!modeSwitch.isWalkingMode()) {
      orbitControl.onMouseWheel(e)
    }
  }

  onContextmenu (e) {
    if (modeSwitch.isWalkingMode()) {
      pointerLockControl.contextMenu(e)
    }
    if (!modeSwitch.isWalkingMode()) {
      orbitControl.onContextMenu(e)
    }
  }

  onModeChange () {
    //underCompass.visible = modeSwitch.isWalkingMode();
    orbitControl.enabled = modeSwitch.isOverallMode()
    pointerLockControl.enabled = false
  }

  onTexutueLoaded (index, texture) { //纹理加载完毕
    if (config.targetIndex === index) {
      materialSwitch.setTargetTexture(texture, viewPoint[index])
      viewerRoam.switchToWalkingMode()
    }
  }

  onMoving (progress) {
    materialSwitch.updateProgress(progress)
  }

  onMoved () { //移动结束
    if (changeToOrthographic) { //转换到正视图
      changeToOrthographic = false
      modeSwitch.setOrthographic()
      var pos = cameraController.endPoint
      var orient = cameraController.endOrient
      var height = pos.y - this.data.groundHeight
      var h = height * Math.tan(orbitCamera.fov * Math.PI / 360)
      var w = h * orbitCamera.aspect
      orthoCamera.left = -w
      orthoCamera.right = w
      orthoCamera.top = h
      orthoCamera.bottom = -h
      orthoCamera.position.copy(pos)
      orthoCamera.setRotationFromQuaternion(orient)
      orthoCamera.updateProjectionMatrix()
      orthographicCallback && orthographicCallback()
    }

    config.targetMoved = true
    // videoController.moveTo(targetIndex);
    if (config.targetIndex !== -1) {
      viewerRoam.switchToWalkingMode()
      // setModelPosition(1);
    }

    // textureManager.groupArr.forEach(value => {
    //   if (value.gid === targetIndex) {
    //     value.visible = true
    //     // scene.add(value)
    //   } else {
    //     value.visible = false
    //     scene.remove(value)
    //     textureManager.clearCache(value)
    //     // scene.remove(value)
    //   }
    // })
  }

  switchToWalkingMode () {
    //从总览模式切换到漫游模式
    if (config.targetMoved && materialSwitch.loaded() && !modeSwitch.isWalkingMode()) {
      modeSwitch.setWalkingMode()
      materialSwitch.useCubemap()
    }
  }

  setWalkingViewPoint (index, orient) {
    if (cameraController.moving) return
    // underCompass.visible = true
    // isOverallModeToWalkingMode = true
    if (index < 0 || index >= viewPoint.length) index = 0
    if (mesh == null) {
      if (config.targetIndex !== -1) {
        let dir = viewPoint[config.targetIndex].clone().sub(viewPoint[index])
        let len = dir.length()
        dir.divideScalar(len)
        config.cube.scale.set(
          this.data.cameraHeight * 2,
          this.data.cameraHeight * 2,
          len * 2 + this.data.cameraHeight * 2
        )
        config.cube.rotation.set(0, Math.atan2(dir.x, dir.z), 0)
        config.cube.position.copy(viewPoint[config.targetIndex])
      } else {
        config.cube.scale.set(
          this.data.cameraHeight * 2,
          this.data.cameraHeight * 2,
          this.data.cameraHeight * 2
        )
        config.cube.position.copy(viewPoint[index])
      }
    }

    if (modeSwitch.isOrthographic()) {
      modeSwitch.setOverallMode()
    }
    anchorManager.normal()
    config.targetIndex = index
    config.targetMoved = false
    cameraController.moveTo(viewPoint[index], orient)
    // videoController.turnOff();
    materialSwitch.setTarget(viewPoint[index])
    // textureManager.loadTexture(index, false);
    // underCompass.position.set(
    //   viewPoint[index].x,
    //   modelData.groundHeight + 0.2,
    //   viewPoint[index].z
    // )
    // // underCompass.visible=false;
    // underCompass.material.opacity = 0
    // var timer = setInterval(function () {
    //   underCompass.material.opacity = parseFloat(
    //     parseFloat(underCompass.material.opacity) + parseFloat(0.1)
    //   )
    //   if (underCompass.material.opacity >= 1) {
    //     underCompass.material.opacity = 1
    //     clearInterval(timer)
    //   }
    // }, 100)
  }

  setDefaultOverallView () {
    materialSwitch.restore()
    modeSwitch.setOverallMode()
    anchorManager.highlight()
    config.targetIndex = -1
    config.targetMoved = true
    orbitCamera.position.set(
      modelCenter.x,
      modelCenter.y + modelSize / 3,
      modelCenter.z + modelSize / 1
    )
    orbitControl.target.copy(modelCenter)
    orbitControl.update()
  }

  onWindowResize () {
    cameraController.resize(window.innerWidth, window.innerHeight)
    renderer.setSize(window.innerWidth, window.innerHeight)
  }

  orientationWindow () {
    if (orientTimer) clearTimeout(orientTimer)
    orientTimer = setTimeout(() => {
      cameraController.getCurrentCamera().aspect =
        this.dom.innerWidth / this.dom.innerHeight
      cameraController.getCurrentCamera().updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }, 500)
  }

  animate () {
    // var size = renderer.getSize();
    // if (size.width != renderer.domElement.clientWidth || size.height != renderer.domElement.clientHeight) {
    //   module3D.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight);
    // }
    requestAnimationFrame(() => {
      this.animate()
    })
    cameraController.update()
    if (!cameraController.moving) {
      textureManager.update()
    }
    // animateControl && animateControl.update()
    // if (MeshMove) {
    //   renderMesh()
    // }
    renderer.render(scene, cameraController.getCurrentCamera())
    orbitControl.update() //20180919取消屏蔽，原因切换2D动画流畅
    // TWEEN.update()

    // onAnimate()

    // TagMove_Anytime()
  }
}
