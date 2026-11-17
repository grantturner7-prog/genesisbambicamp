import * as THREE from 'three'

const FLAT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
const UP = new THREE.Vector3(0, 1, 0)

/**
 * A pool of soft quads drawn in one call: glow points, smoke puffs or ripple rings.
 * Each has a colour (values above 1 bloom on the high tier) and a fade (its opacity).
 * Billboards turn to the camera; `flat` ones lie on the ground or the water.
 */
export class Sprites {
  readonly mesh: THREE.InstancedMesh
  private readonly fade: THREE.InstancedBufferAttribute
  private readonly geo: THREE.PlaneGeometry
  private readonly mat: THREE.MeshBasicMaterial
  private readonly m = new THREE.Matrix4()
  private readonly p = new THREE.Vector3()
  private readonly s = new THREE.Vector3()
  private readonly c = new THREE.Color()
  private readonly t = new THREE.Quaternion()
  private q: THREE.Quaternion = FLAT

  constructor(
    readonly count: number,
    map: THREE.Texture,
    opts: { additive: boolean; flat?: boolean; renderOrder?: number },
  ) {
    this.geo = new THREE.PlaneGeometry(1, 1)
    this.fade = new THREE.InstancedBufferAttribute(new Float32Array(count), 1)
    this.fade.setUsage(THREE.DynamicDrawUsage)
    this.geo.setAttribute('aFade', this.fade)
    this.mat = new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      depthWrite: false,
      fog: false,
      blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    })
    // per-instance opacity
    this.mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aFade;\nvarying float vFade;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFade = aFade;')
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vFade;').replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= vFade;')
    }
    this.mesh = new THREE.InstancedMesh(this.geo, this.mat, count)
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = opts.renderOrder ?? 4
    this.mesh.castShadow = false
    this.mesh.receiveShadow = false
    if (opts.flat) this.q = FLAT
    this.flat = !!opts.flat
    for (let i = 0; i < count; i++) {
      this.mesh.setColorAt(i, this.c.setRGB(1, 1, 1))
      this.hide(i)
    }
  }
  private readonly flat: boolean

  /** Call once per frame before `put`, with the camera's orientation. */
  face(camera: THREE.Quaternion) {
    if (!this.flat) this.q = camera
  }

  put(i: number, x: number, y: number, z: number, size: number, r: number, g: number, b: number, fade: number) {
    this.m.compose(this.p.set(x, y, z), this.q, this.s.set(size, size, size))
    this.mesh.setMatrixAt(i, this.m)
    this.mesh.setColorAt(i, this.c.setRGB(r, g, b))
    this.fade.setX(i, fade)
  }

  /** A flat sprite stretched along a heading: `length` along it, `width` across, turned by `yaw` about Y. */
  putFlat(i: number, x: number, y: number, z: number, length: number, width: number, yaw: number, r: number, g: number, b: number, fade: number) {
    this.m.compose(this.p.set(x, y, z), this.t.setFromAxisAngle(UP, yaw).multiply(FLAT), this.s.set(length, width, 1))
    this.mesh.setMatrixAt(i, this.m)
    this.mesh.setColorAt(i, this.c.setRGB(r, g, b))
    this.fade.setX(i, fade)
  }

  hide(i: number) {
    this.m.compose(this.p.set(0, -50, 0), FLAT, this.s.set(0, 0, 0))
    this.mesh.setMatrixAt(i, this.m)
    this.fade.setX(i, 0)
  }

  commit() {
    this.mesh.instanceMatrix.needsUpdate = true
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true
    this.fade.needsUpdate = true
  }

  dispose() {
    this.geo.dispose()
    this.mat.dispose()
    this.mesh.dispose()
  }
}
