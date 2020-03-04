//处理纹理加载， 加载后通过cbLoadComplete通知

//将来扩展：依据浏览器、手机检测结果，加载不同的纹理

//viewPoint:{x y z, path}: path+face-n.png or path = xxx.ktx
const THREE = window.THREE

export default class TextureManager {
  constructor(
    renderer,
    cubeUrls,
    smallUrls,
    cbLoadComplete,
    setWalkingViewPoint,
    cacheSize
  ) {
    this.renderer = renderer

    this.cubeUrls = cubeUrls

    this.smallUrls = smallUrls

    this.setWalkingViewPoint = setWalkingViewPoint

    this.cbLoadComplete = cbLoadComplete //纹理加载结束回调

    this.cacheSize = cacheSize || 100 //缓存大小

    this.loaded = [] //已加载纹理： {index, visitNum, texture1, texture2 }, 因为数量少，直接使用数组, visitNum从小排列

    this.visitNum = 0

    this.loadingIndex = -1

    //延迟高清纹理加载

    this.loadingData = { index: -1, images: [], updatedFaces: 6 } //加载中的数据

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
  }

  loadTexture (index, ifcanmove) {
    var scope = this

    this.loadingIndex = index

    var r = scope._getLoadIndex(index) //加载材质成功后返回数值

    if (r >= 0) {
      //已加载

      if (ifcanmove) {
        this.setWalkingViewPoint(index)
      }

      scope.loaded[r].visitNum = ++scope.visitNum //修改访问计数

      if (scope.loaded[r].texture2 != null) {
        scope._onTextureLoaded(index, scope.loaded[r].texture2)
      } else {
        scope._onTextureLoaded(index, scope.loaded[r].texture1)

        // if (index === scope.loadingIndex) {
        //   //避免无效加载

        //   scope._loadHighTexture(index)
        // }
      }
    } else { //未加载
      new THREE.CubeTextureLoader().load(scope.smallUrls[index], (t) => {
        var item = scope._getIdle()

        item.index = index

        item.visitNum = ++scope.visitNum

        item.texture1 = t

        item.texture2 = null

        this.setWalkingViewPoint(index)

        scope._onTextureLoaded(index, t)

        // if (ifcanmove) {
        //   this.setWalkingViewPoint(index)
        // }

        // if (index === scope.loadingIndex) {
        //   //避免无效加载

        //   scope._loadHighTexture(index)
        // }
      })
    }
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

    scope.loaded[r].visitNum = ++scope.visitNum //修改访问计数

    if (scope.loaded[r].texture2 != null) {
      //已加载高清

      return
    }

    new THREE.CubeTextureLoader().load(scope.cubeUrls[index], function (t) {
      //scope._onTextureLoaded(index, t); //原立即加载

      scope.loaded[r].texture2 = t

      scope.loadingData.index = index

      scope.loadingData.images = t.images

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

  _getIdle () {
    //获取最后访问节点或者新节点（缓存尚未满时）

    var item

    if (this.loaded.length < this.cacheSize) {
      item = {}

      this.loaded.push(item)
    } else {
      item = this.loaded[0]

      for (var i = 1; i < this.loaded.length; ++i) {
        if (this.loaded[i].visitNum < item.visitNum) {
          item = this.loaded[i]
        }
      }
    }

    return item
  }

  _getLoadIndex (index) {
    for (var i = 0; i < this.loaded.length; ++i) {
      if (this.loaded[i].index === index) return i
    }

    return -1
  }
}
