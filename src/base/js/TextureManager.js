import tilesPath from 'base/utils/config'

const THREE = window.THREE
var planeX = 0.9
// var meshArr = [] //控流

export default class TextureManager {
  constructor(
    scene,
    renderer,
    THREE,
    cubeUrls,
    smallUrls,
    sourceUrl,
    viewPoint,
    viewPointQ,
    mainArr,
    cbLoadComplete,
    setWalkingViewPoint,
    anchorManager,
    cacheSize
  ) {
    this.scene = scene
    this.renderer = renderer
    this.cubeUrls = cubeUrls
    this.smallUrls = smallUrls
    this.sourceUrl = sourceUrl
    this.mainArr = mainArr
    this.viewPoint = viewPoint
    this.viewPointQ = viewPointQ
    this.cbLoadComplete = cbLoadComplete //纹理加载结束回调
    this.setWalkingViewPoint = setWalkingViewPoint
    this.anchorManager = anchorManager
    this.cacheSize = cacheSize || 50 //缓存大小
    this.loaded = [] //已加载纹理： {index, visitNum, texture1, texture2 }, 因为数量少，直接使用数组, visitNum从小排列
    this.visitNum = 0
    this.loadingIndex = -1
    //延迟高清纹理加载
    this.loadingData = {
      index: -1,
      images: [],
      updatedFaces: 6
    } //加载中的数据
    this.dataTexture = new THREE.DataTexture(
      new Uint8Array([0, 120, 120, 255]),
      1,
      1
    ) //初始数据
    this.cubeTexture = new THREE.CubeTexture()
    this.gl = renderer.getContext()
    this.glutils = THREE.WebGLUtils(this.gl, renderer.extensions, false)
    this.glFormat = this.glutils.convert(THREE.RGBAFormat)
    this.glType = this.glutils.convert(THREE.UnsignedByteType)
    this.frameCount = 1
    this.textureArr = []
    this.group = null
    this.groupArr = []
    this.wantingTextureArr = []
    this.gidArr = []
    this.sceneGid = []
    this.currentIndex = -1
    this.visitNum1 = 0
    this.planeG = new THREE.PlaneBufferGeometry(planeX, planeX, 100)
  }
  // var groupArr=[];
  loadTexture (index, ifcanmove) {
    var scope = this
    this.loadingIndex = index
    var r = scope._getLoadIndex(index) //加载材质成功后返回数值
    if (r >= 0) {
      //已加载
      if (ifcanmove) {
        scope.setWalkingViewPoint(index)
        scope.initGroup(index)
        scope.groupArr.forEach(function (index, value) {
          value.visible = false
        })
        scope._onTextureLoaded(index, scope.loaded[r].texture1)
      }
    } else { //未加载
      new THREE.CubeTextureLoader().load(
        scope.smallUrls[index],
        (t) => {
          this.groupArr.forEach(function (index, value) {
            value.visible = false
          })
          this._getIdle(index, t)
          this.setWalkingViewPoint(index)
          this._onTextureLoaded(index, t)
          this.initGroup(index)
        },
        (loaded) => {
          this.anchorManager.loadingTexture(index, loaded)
        }
      )
    }
  }

  loadNearestKPoints (index) {
    var scope = this
    var r = scope._getLoadIndex(index) //加载材质成功后返回数值
    if (r < 0) {
      new THREE.CubeTextureLoader().load(
        scope.smallUrls[index],
        function (t) {
          scope._getIdle(index, t)
          // var item = scope._getIdle();
          // item.index = index;
          // // item.visitNum = ++scope.visitNum;
          // item.texture1 = t;
          // item.texture2 = null;
          scope._onTextureLoaded(index, t)
        },
        function (loaded) {
          // console.log(anchorManager)
          this.anchorManager.loadingTexture(index, loaded)
        }
      )
    }
  }
  //根据旋转角度计算移动距离
  sortPoint (a, b) {
    var distA = 0.0
    distA += (a.point.x) * (a.point.x)
    distA += (a.point.y) * (a.point.y)
    distA += (a.point.z) * (a.point.z)
    var distB = 0.0
    distB += (b.point.x) * (b.point.x)
    distB += (b.point.y) * (b.point.y)
    distB += (b.point.z) * (b.point.z)
    var distDiff = Math.abs(distA - distB)
    if (distDiff < 0.001) {
      var xDiff = Math.abs(a.point.x - b.point.x)
      if (xDiff < 0.001) {
        return a.point.z - b.point.z
      }
      return a.point.x - b.point.x
    }
    return distA - distB
  }
  getNearestKPoints (curIndex) {
    var resultPoints = []
    var tempPoints = []
    var curPoint = this.viewPoint[curIndex]
    var len = this.viewPoint.length

    for (var i = 0; i < len; i++) {
      if (i === curIndex) {
        continue
      }

      var point = this.viewPoint[i]
      var newPoint = new THREE.Vector3(point.x - curPoint.x, point.y - curPoint.y, point.z - curPoint.z)
      var tempPoint = Object()
      tempPoint.index = i
      tempPoint.point = newPoint
      tempPoints.push(tempPoint)
    }

    var K = 5
    tempPoints.sort(this.sortPoint)

    for (let i = 0; i < tempPoints.length; i++) {
      tempPoint = tempPoints[i]
    }
    if (tempPoints.length <= K) {
      K = tempPoints.length
    }
    for (let i = 0; i < K; i++) {
      resultPoints.push(tempPoints[i].index)
    }
    return resultPoints
  }
  initGroup (index) {
    var self = this

    for (var i = 0; i < this.getNearestKPoints(index).length; i++) {
      this.loadNearestKPoints(this.getNearestKPoints(index)[i])
    }

    // if(this.groupArr.length>5){

    // this.groupArr.forEach(item=>{
    //   if(item.gid!=index){
    //     self.clearCache(item)
    //   }

    // })
    // this.loaded.forEach(item=>{
    //   // item.texture1.dispose()
    //   console.log(item.texture1)
    // })

    // }
    this.currentIndex = index
    this.groupArr.forEach(item => {
      self.gidArr.push(item.gid)
    })
    if (self.gidArr.indexOf(index) === -1) {
      this.mainArr = []
      this.group = new THREE.Group()
      this.group.quaternion.set(
        this.viewPointQ[0],
        this.viewPointQ[1],
        this.viewPointQ[2],
        this.viewPointQ[3]
      )
      this.group.position.set(
        this.viewPoint[index].x,
        this.viewPoint[index].y - 0.18,
        this.viewPoint[index].z
      )
      this.group.rotation.y += Math.PI
      this.group.gid = index
      this.groupArr.push(this.group)
      this.group.visible = false
      this.scene.add(this.group)
      for (let tI = 6 * index; tI < 6 * index + 6; tI++) {
        for (let j = 0; j < 4; j++) {
          for (let i = 0; i < 4; i++) {
            this.textureArr.push({
              url:
                this.sourceUrl + tilesPath + '2k_' + tI + '_' + i + '_' + j + '.jpg',
              face: tI % 6,
              i: i,
              j: j,
              index: index
            })
          }
        }
      }

      this.getDownloadUrl(index)
    } else {
      this.groupArr.forEach(item => {
        if (item.gid === index) {
          self.group = item
          this.scene.add(item)
        }
      })
    }
    // console.log(this.scene)
  }
  downloadAndDisplayImg (m) {
    if (this.currentIndex !== this.mainArr[0].index) {
      return
    }

    // let mat = new THREE.MeshBasicMaterial({
    //   map: new THREE.TextureLoader().load(this.mainArr[0].u, function (e) {
    //     console.log(e)
    //     // if(!pointerLockControl.enabled){
    //     // mesh.visible = true;

    //     // }
    //   }),
    //   depthTest: false,
    //   side: THREE.FrontSide
    // });
    // var image=new Image();
    // image.src=this.mainArr[0].u;

    // texture.image=image
    // console.log(texture)
    //   var uniforms = {
    //     texture1 : {value :new THREE.TextureLoader().load(this.mainArr[0].u,function(e){
    //    // if(!pointerLockControl.enabled){
    //       mesh.visible = true;

    //       // }
    //     })}
    // };

    var uniforms = {
      texture1: {
        value: new THREE.TextureLoader().load(this.mainArr[0].u, function (e) {
          // if(!pointerLockControl.enabled){
          mesh.visible = true

          // }
        })
      }
    }

    //设置平铺方式uniforms1
    uniforms.texture1.value.warpS = uniforms.texture1.value.warpT = THREE.RepeatWrapping
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: document.getElementById('vertexShader').textContent,
      fragmentShader: document.getElementById('fragmentShader').textContent,
      side: THREE.DoubleSide,
      depthTest: false
    })

    let mesh = new THREE.Mesh(this.planeG, mat)
    this.renderer.autoClear = true
    mesh.needsUpdate = false

    // console.log(mesh)
    mesh.visible = false
    mesh.renderOrder = 50

    if (this.mainArr[0].px) {
      mesh.position.x = parseFloat(m.px)
    }
    if (this.mainArr[0].py) {
      mesh.position.y = parseFloat(m.py)
    }
    if (this.mainArr[0].pz) {
      mesh.position.z = parseFloat(m.pz)
    }
    if (this.mainArr[0].rx) {
      mesh.rotateX(parseFloat(m.rx))
    }
    if (this.mainArr[0].ry) {
      mesh.rotateY(parseFloat(m.ry))
    }
    this.group.add(mesh)
  }
  getDownloadUrl (index) {
    var scope = this
    if (scope.textureArr.length > 0) {
      if (!scope.textureArr[0] || scope.textureArr[0].index !== index) {
        return
      }
      let mat = new THREE.MeshBasicMaterial({
        depthTest: false,
        side: THREE.FrontSide
      })
      let mesh = new THREE.Mesh(this.planeG, mat)
      // mesh.visible = false;
      mesh.renderOrder = -11
      if (scope.textureArr[0].index === scope.group.gid) {
        scope.group.add(mesh)
      }
      switch (scope.textureArr[0].face) {
        case 0: {
          mat.map = new THREE.TextureLoader().load('image/1.jpg', function (e) {
            if (scope.textureArr[0]) {
              e.image.setAttribute('index', index)
              e.image.setAttribute('u', scope.textureArr[0].url)
              e.image.setAttribute('px', planeX * 2)
              e.image.setAttribute(
                'py',
                planeX * (-scope.textureArr[0].j + 1.7)
              )
              e.image.setAttribute(
                'pz',
                planeX * (-1.5 + scope.textureArr[0].i)
              )

              e.image.setAttribute('ry', -Math.PI / 2)
              scope.textureArr.shift()
              scope.getDownloadUrl(index)
              if (!scope.textureArr[0]) return
              mesh.position.set(
                planeX * 2,
                planeX * (-scope.textureArr[0].j + 1.7),
                planeX * (-1.5 + scope.textureArr[0].i)
              )
              mesh.rotateY(-Math.PI / 2)
            }
          })

          break
        }
        case 1: {
          mat.map = new THREE.TextureLoader().load('image/1.jpg', function (e) {
            if (scope.textureArr[0]) {
              e.image.setAttribute('index', index)
              e.image.setAttribute('u', scope.textureArr[0].url)
              e.image.setAttribute('px', planeX * -2)
              e.image.setAttribute(
                'py',
                planeX * (-scope.textureArr[0].j + 1.7)
              )
              e.image.setAttribute(
                'pz',
                planeX * (1.5 - scope.textureArr[0].i)
              )
              e.image.setAttribute('ry', Math.PI / 2)
              scope.textureArr.shift()
              scope.getDownloadUrl(index)
              if (!scope.textureArr[0]) return
              mesh.position.set(
                planeX * -2,
                planeX * (-scope.textureArr[0].j + 1.7),
                planeX * (1.5 - scope.textureArr[0].i)
              )
              mesh.rotateY(Math.PI / 2)
            }
          })

          break
        }
        case 2: {
          mat.map = new THREE.TextureLoader().load('image/1.jpg', function (e) {
            if (scope.textureArr[0]) {
              e.image.setAttribute('index', index)
              e.image.setAttribute('u', scope.textureArr[0].url)
              e.image.setAttribute(
                'px',
                planeX * (scope.textureArr[0].i - 1.5)
              )
              e.image.setAttribute('py', planeX * 2.2)
              e.image.setAttribute(
                'pz',
                planeX * (-scope.textureArr[0].j + 1.5)
              )
              e.image.setAttribute('rx', Math.PI / 2)
              scope.textureArr.shift()
              scope.getDownloadUrl(index)
              if (!scope.textureArr[0]) return
              mesh.position.set(
                planeX * (scope.textureArr[0].i - 1.5),
                planeX * 2.2,
                planeX * (-scope.textureArr[0].j + 1.5)
              )
              mesh.rotateX(Math.PI / 2)
            }
          })

          break
        }
        case 3: {
          mat.map = new THREE.TextureLoader().load('image/1.jpg', function (e) {
            if (scope.textureArr[0]) {
              e.image.setAttribute('index', index)
              e.image.setAttribute('u', scope.textureArr[0].url)
              e.image.setAttribute(
                'px',
                planeX * (scope.textureArr[0].i - 1.5)
              )
              e.image.setAttribute('py', planeX * -1.8)
              e.image.setAttribute(
                'pz',
                planeX * (scope.textureArr[0].j - 1.5)
              )

              e.image.setAttribute('rx', -Math.PI / 2)
              scope.textureArr.shift()
              scope.getDownloadUrl(index)
              if (!scope.textureArr[0]) return
              mesh.position.set(
                planeX * (scope.textureArr[0].i - 1.5),
                planeX * -1.8,
                planeX * (scope.textureArr[0].j - 1.5)
              )
              mesh.rotateX(-Math.PI / 2)
            }
          })

          break
        }
        case 4: {
          mat.map = new THREE.TextureLoader().load('image/1.jpg', function (e) {
            if (scope.textureArr[0]) {
              e.image.setAttribute('index', index)
              e.image.setAttribute('u', scope.textureArr[0].url)
              e.image.setAttribute(
                'px',
                planeX * (-1.5 + scope.textureArr[0].i)
              )
              e.image.setAttribute(
                'py',
                planeX * (-scope.textureArr[0].j + 1.7)
              )
              e.image.setAttribute('pz', planeX * -2)

              scope.textureArr.shift()
              scope.getDownloadUrl(index)
              if (!scope.textureArr[0]) return
              mesh.position.set(
                planeX * (-1.5 + scope.textureArr[0].i),
                planeX * (-scope.textureArr[0].j + 1.7),
                planeX * -2
              )
            }
          })

          break
        }
        case 5: {
          mat.map = new THREE.TextureLoader().load('image/1.jpg', function (e) {
            if (scope.textureArr[0]) {
              e.image.setAttribute('index', index)
              e.image.setAttribute('u', scope.textureArr[0].url)
              e.image.setAttribute(
                'px',
                planeX * (1.5 - scope.textureArr[0].i)
              )
              e.image.setAttribute(
                'py',
                planeX * (-scope.textureArr[0].j + 1.7)
              )
              e.image.setAttribute('pz', planeX * 2)

              e.image.setAttribute('ry', Math.PI)
              scope.textureArr.shift()
              scope.getDownloadUrl(index)
              if (!scope.textureArr[0]) return
              mesh.position.set(
                planeX * (1.5 - scope.textureArr[0].i),
                planeX * (-scope.textureArr[0].j + 1.7),
                planeX * 2
              )
              mesh.rotateY(Math.PI)
            }
          })

          break
        }
      }
    }
  }
  deleteGroup (group) {
    //console.log(group);
    if (!group) return
    // 删除掉所有的模型组内的mesh

    group.traverse(function (item) {
      if (item instanceof THREE.Mesh) {
        item.geometry.dispose() // 删除几何体
        item.material.dispose() // 删除材质
      }
    })
  }

  update () {
    var face = this.loadingData.updatedFaces
    if (
      face < 6 &&
      this.loadingData.index === this.loadingIndex &&
      --this.frameCount === 0
    ) {
      this.frameCount = 1
      var textureProperties = this.renderer.properties.get(this.cubeTexture)
      var activeTexture = this.gl.getParameter(
        this.gl.TEXTURE_BINDING_CUBE_MAP
      )
      this.gl.bindTexture(
        this.gl.TEXTURE_CUBE_MAP,
        textureProperties.__image__webglTextureCube
      )
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.cubeTexture.flipY)
      this.gl.texImage2D(
        this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
        0,
        this.glFormat,
        this.glFormat,
        this.glType,
        this.loadingData.images[face]
      )
      this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, activeTexture)
      if (++this.loadingData.updatedFaces === 6) {
        this._onTextureLoaded(this.loadingData.index, this.cubeTexture)
      }
    }
  }
  _loadHighTexture (index) {
    //加载高清纹理

    var scope = this
    var r = scope._getLoadIndex(index)
    if (r === -1) return
    // scope.loaded[r].visitNum == ++scope.visitNum; //修改访问计数
    if (scope.loaded[r].texture2 != null) {
      //已加载高清
      return
    }
    new THREE.CubeTextureLoader().load(scope.cubeUrls[index], function (t) {
      // console.log()
      //scope._onTextureLoaded(index, t); //原立即加载
      scope.loaded[r].texture2 = t
      scope.loadingData.index = index
      // scope.loadingData.images = t.images;
      scope.loadingData.updatedFaces = 0
      scope.cubeTexture = new THREE.CubeTexture()
      for (var i = 0; i < 6; ++i) {
        scope.cubeTexture.images[i] = scope.dataTexture
      }
      scope.cubeTexture.needsUpdate = true
      scope.renderer.setTextureCube(scope.cubeTexture, 0)
      scope.cubeTexture.needsUpdate = false
      //renderer.setTextureParameters(gl.TEXTURE_CUBE_MAP, tCube, true );
      var textureProperties = scope.renderer.properties.get(scope.cubeTexture)
      var activeTexture = scope.gl.getParameter(
        scope.gl.TEXTURE_BINDING_CUBE_MAP
      )
      scope.gl.bindTexture(
        scope.gl.TEXTURE_CUBE_MAP,
        textureProperties.__image__webglTextureCube
      )
      scope.gl.texParameteri(
        scope.gl.TEXTURE_CUBE_MAP,
        scope.gl.TEXTURE_WRAP_S,
        scope.glutils.convert(scope.cubeTexture.wrapS)
      )
      scope.gl.texParameteri(
        scope.gl.TEXTURE_CUBE_MAP,
        scope.gl.TEXTURE_WRAP_T,
        scope.glutils.convert(scope.cubeTexture.wrapT)
      )
      scope.gl.texParameteri(
        scope.gl.TEXTURE_CUBE_MAP,
        scope.gl.TEXTURE_MAG_FILTER,
        scope.glutils.convert(THREE.LinearFilter)
      )
      scope.gl.texParameteri(
        scope.gl.TEXTURE_CUBE_MAP,
        scope.gl.TEXTURE_MIN_FILTER,
        scope.glutils.convert(THREE.LinearFilter)
      )
      scope.gl.bindTexture(scope.gl.TEXTURE_CUBE_MAP, activeTexture)
    })
  }
  _onTextureLoaded (index, t) {
    t.generateMipmaps = false
    t.minFilter = THREE.LinearFilter
    this.cbLoadComplete(index, t)
  }
  _getIdle (index, t) {
    // var self = this
    // //获取最后访问节点或者新节点（缓存尚未满时）
    // var item;
    // if (this.loaded.length < this.cacheSize) {
    //   item = {};
    //   this.loaded.push(item);

    // } else {
    //   this.loaded=[];
    //   item = this.loaded[0];
    //   for (var i = 1; i < this.loaded.length; ++i) {
    //     if (this.loaded[i].visitNum < item.visitNum) {
    //       item = this.loaded[i];
    //     }
    //   }
    //   // item.texture1.dispose();
    // }
    // if(this.loaded.length>20){
    //   this.loaded[0]={};
    //   this.loaded.shift();

    // }
    // // console.log(this.loaded)
    // return item;
    this.loaded.push({
      texture1: t,
      index: index
    })

    // this.scene.children.forEach(item=>{
    //   self.this.sceneGid.push(item.gid)

    // })
    // if(self.this.sceneGid.indexOf(index)==-1){
    //   this.groupArr.forEach(item=>{
    //     if(item.gid==index){
    //       this.scene.add(item);

    //     }

    //   })
    // }
    // if(this.loaded.length>20){
    // //   // if(this.loaded[0]!=index){
    // //     this.loaded[0]={};
    // //     this.loaded.shift();
    //     this.visitNum1++;
    // //   // }

    // }
    // console.log("this.renderer.info",this.renderer.info)
    this.visitNum1++
    if (this.visitNum1 === 50) {
      //   this.loaded=[];
      this.visitNum1 = 0

      this.renderer.dispose()
      // renderer.clear();
      // console.log(this.groupArr)

      // this.groupArr.forEach(item=>{
      //   if(item.gid!=index){
      //     this.scene.remove(item)
      //     self.clearCache(item)

      //   }

      // })
    }
  }
  disposeNode (node) {
    if (node instanceof THREE.Mesh) {
      if (node.geometry) {
        node.geometry.dispose()
      }

      if (node.material) {
        if (node.material instanceof THREE.MeshFaceMaterial) {
          node.material.materials.forEach(function (idx, mtrl) {
            if (mtrl.map) mtrl.map.dispose()
            if (mtrl.lightMap) mtrl.lightMap.dispose()
            if (mtrl.bumpMap) mtrl.bumpMap.dispose()
            if (mtrl.normalMap) mtrl.normalMap.dispose()
            if (mtrl.specularMap) mtrl.specularMap.dispose()
            if (mtrl.envMap) mtrl.envMap.dispose()
            if (mtrl.alphaMap) mtrl.alphaMap.dispose()
            if (mtrl.aoMap) mtrl.aoMap.dispose()
            if (mtrl.displacementMap) mtrl.displacementMap.dispose()
            if (mtrl.emissiveMap) mtrl.emissiveMap.dispose()
            if (mtrl.gradientMap) mtrl.gradientMap.dispose()
            if (mtrl.metalnessMap) mtrl.metalnessMap.dispose()
            if (mtrl.roughnessMap) mtrl.roughnessMap.dispose()

            mtrl.dispose() // disposes any programs associated with the material
          })
        } else {
          if (node.material.map) node.material.map.dispose()
          if (node.material.lightMap) node.material.lightMap.dispose()
          if (node.material.bumpMap) node.material.bumpMap.dispose()
          if (node.material.normalMap) node.material.normalMap.dispose()
          if (node.material.specularMap) node.material.specularMap.dispose()
          if (node.material.envMap) node.material.envMap.dispose()
          if (node.material.alphaMap) node.material.alphaMap.dispose()
          if (node.material.aoMap) node.material.aoMap.dispose()
          if (node.material.displacementMap) node.material.displacementMap.dispose()
          if (node.material.emissiveMap) node.material.emissiveMap.dispose()
          if (node.material.gradientMap) node.material.gradientMap.dispose()
          if (node.material.metalnessMap) node.material.metalnessMap.dispose()
          if (node.material.roughnessMap) node.material.roughnessMap.dispose()

          node.material.dispose() // disposes any programs associated with the material
        }
      }
    }
  } // disposeNode

  disposeHierchy (node, callback) {
    for (var i = node.children.length - 1; i >= 0; i--) {
      var child = node.children[i]

      this.disposeHierchy(child, callback)
      callback(child)
    }
  }

  clearCache (group) {
    // var self = this
    // for(var i=0;i<group.children.length;i++){
    //   console.log(group.children[i])
    //   group.children[i].geometry.dispose();
    //   group.children[i].material.dispose();
    // }
    if (!group) return

    group.traverse(function (item) {
      if (item instanceof THREE.Mesh) {
        item.geometry.dispose() // 删除几何体
        item.material.dispose() // 删除材质
        // self.disposeNode(item)
        // this.scene.dispose()
        // renderer.dispose()
      }
    })

    this.scene.remove(group)
  }
  _getLoadIndex (index) {
    for (var i = 0; i < this.loaded.length; ++i) {
      if (this.loaded[i].index === index) return i
    }
    return -1
  }
}
