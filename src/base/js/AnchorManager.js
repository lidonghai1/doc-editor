//根据扫描位置点、大小、高度创建图示
import * as THREE from 'three'

export default class AnchorManager {
  constructor(points, size, cameraHeight, scene, mesh, modelData, cameraController, modeSwitch, groupMesh) {
    var textureLoader = new THREE.TextureLoader()
    //this.textureHighlight = textureLoader.load( "image/point1.png" );
    // this.matHover = new THREE.MeshBasicMaterial({
    //     alphaTest: 0.5,
    //     color: 0xccccff,
    //     map:  textureLoader.load( "image/point1.png" )
    //
    // });
    this.scene = scene
    this.mesh = mesh
    this.modelData = modelData
    this.cameraController = cameraController
    this.groupMesh = groupMesh
    var pointPathFull = require('assets/image/point5.png')
    this.highlightTex1 = textureLoader.load(require('assets/image/R_01.png'))
    this.highlightTex2 = textureLoader.load(require('assets/image/R_02.png'))
    this.highlightTex3 = textureLoader.load(require('assets/image/R_03.png'))
    this.highlightTex4 = textureLoader.load(require('assets/image/R_04.png'))
    this.highlightTex5 = textureLoader.load(require('assets/image/R_05.png'))
    this.highlightTex6 = textureLoader.load(require('assets/image/R_06.png'))
    this.quadArray = []
    this.matNormal = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      depthTest: true,
      transparent: true,
      opacity: 0.5,
      map: textureLoader.load(pointPathFull)
    })
    this.matHint = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      depthTest: false,
      transparent: true,
      map: textureLoader.load(require('assets/image/R_06.png'))
    })

    var geometry = new THREE.PlaneBufferGeometry(size, size, 1)
    geometry.rotateX(-Math.PI / 2)

    var matNormal
    var quad
    for (var i = 0; i < points.length; ++i) {
      matNormal = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        depthTest: true,
        transparent: true,
        opacity: 0.5,
        map: textureLoader.load(pointPathFull),
        polygonOffset: true,
        polygonOffsetFactor: -150
      })
      quad = new THREE.Mesh(geometry, matNormal)
      quad.polygonOffsetFactor = 0
      quad.polygonOffsetUnits = 2.0
      quad.position.set(points[i].x, points[i].y - cameraHeight, points[i].z)
      quad.renderOrder = 2
      quad.name = 'points'
      this.quadArray.push(quad)
      this.scene.add(quad)
    }

    var geometry2 = new THREE.PlaneBufferGeometry(size, size, 1)
    this.posHint = new THREE.Mesh(geometry2, this.matHint)
    this.posHint.renderOrder = 2
    this.raycaster = new THREE.Raycaster()
    this.anchorPoint = new THREE.Vector3(0, 0, 0)
    this.anchorNormal = new THREE.Vector3(0, 1, 0)
  }

  getQuadArray () {
    return this.quadArray
  }

  highlight () {
    this.matNormal.opacity = 1.0
    //this.matNormal.color.setRGB(10.0, 0, 0);
  }

  normal () {
    this.matNormal.opacity = 0.5
  }

  updateHint (x, y) {
    var pos = new THREE.Vector2(x, y)
    this.raycaster.setFromCamera(pos, this.cameraController.getCurrentCamera())
    var minDistance = 99999
    var point = new THREE.Vector3()
    var rayScope = this.raycaster
    var normalScope = new THREE.Vector3(0, 1, 0)
    if (this.mesh) {
      this.scene.traverse(function (child) {
        if (child.isMesh) {
          var intersects = rayScope.intersectObject(child)
          if (intersects.length > 0 && intersects[0].distance < minDistance) {
            var intersect = intersects[0]
            point.copy(intersect.point)
            var face = intersect.face
            // var linePosition = line.geometry.attributes.position;
            var meshPosition = child.geometry.attributes.position
            var p1 = new THREE.Vector3(
              meshPosition.getX(face.a),
              meshPosition.getY(face.a),
              meshPosition.getZ(face.a)
            )
            var p2 = new THREE.Vector3(
              meshPosition.getX(face.b),
              meshPosition.getY(face.b),
              meshPosition.getZ(face.b)
            )
            var p3 = new THREE.Vector3(
              meshPosition.getX(face.c),
              meshPosition.getY(face.c),
              meshPosition.getZ(face.c)
            )

            p2.sub(p1)
            p3.sub(p1)
            normalScope = p2.clone().cross(p3)
            var q = new THREE.Quaternion()
            child.getWorldQuaternion(q)
            normalScope.applyQuaternion(q)
            normalScope.normalize()
          }
        }
      })
    } else {
      let vector = new THREE.Vector3(x, y, 1).unproject(
        this.cameraController.getCurrentCamera()
      )
      if (!this.modeSwitch.isOrthographic()) {
        let cameraPos = new THREE.Vector3()
        this.cameraController.getCurrentCamera().getWorldPosition(cameraPos)
        vector.sub(cameraPos)
        vector.normalize()
        if (vector.y < 0) {
          vector.multiplyScalar(
            (-1.0 / vector.y) * (cameraPos.y - this.modelData.groundHeight)
          )
          vector.x += cameraPos.x
          vector.z += cameraPos.z
        }
        point.set(vector.x, this.modelData.groundHeight, vector.z)
      }
    }
    this.anchorPoint.copy(point)
    this.anchorNormal.copy(normalScope)
    this.posHint.position.copy(point)
    this.posHint.lookAt(point.add(normalScope))
  }

  loadingTexture (targetIndex, loaded) {
    if (loaded === 1) {
      this.quadArray[targetIndex].material.map = this.highlightTex1
    } else if (loaded === 2) {
      this.quadArray[targetIndex].material.map = this.highlightTex2
    } else if (loaded === 3) {
      this.quadArray[targetIndex].material.map = this.highlightTex3
    } else if (loaded === 4) {
      this.quadArray[targetIndex].material.map = this.highlightTex4
    } else if (loaded === 5) {
      this.quadArray[targetIndex].material.map = this.highlightTex5
    } else if (loaded === 6) {
      this.quadArray[targetIndex].material.map = this.highlightTex6
    }
  }
}
