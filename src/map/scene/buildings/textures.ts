import * as THREE from 'three'
import { mulberry32 } from '../../layout/layout'
import { skyFor, type SceneEnv } from '../env'
import { BANDS } from './geo'

/**
 * Detail atlas: eight vertical bands, each a stripe pattern that repeats along V
 * (lap siding, deck planks, louvers, roof seams, timber slats, brick courses, sheet joints).
 * A part picks its band with U and its stripe direction and pitch with V, so every matte
 * surface of the layer shares one texture and one material. All bands share the same mean
 * value, so distant (mip-mapped) surfaces keep their colour.
 */
export const ATLAS_MEAN = 0.86
/** Stripe periods stored in one texture height, per band. */
export const ATLAS_PERIODS = 8

export function stripeAtlas(): THREE.DataTexture {
  const BW = 16
  const W = BANDS * BW
  const H = 256
  const rnd = mulberry32(77)
  const data = new Uint8Array(W * H * 4)
  const col = new Float32Array(H)
  const P = H / ATLAS_PERIODS // rows per period
  const tones = (amount: number) => Array.from({ length: ATLAS_PERIODS }, () => 1 - rnd() * amount)
  for (let band = 0; band < BANDS; band++) {
    const t = tones(band === 2 ? 0.16 : band === 5 ? 0.22 : band === 6 ? 0.2 : band === 1 ? 0.03 : 0)
    for (let y = 0; y < H; y++) {
      const k = Math.floor(y / P)
      const f = (y % P) / P // 0..1 within the period
      let v = 1
      if (band === 1) v = f < 0.1 ? 0.6 : 1 - (1 - f) * 0.08 // lap siding: shadow line under each board
      else if (band === 2) v = f < 0.1 ? 0.5 : 1 // deck planks: dark joint
      else if (band === 3) v = f < 0.45 ? 0.3 : 0.75 + (f - 0.45) * 0.45 // louvers
      else if (band === 4) v = f < 0.07 ? 0.72 : f < 0.14 ? 1.12 : 1 // standing seams: shadow + highlight
      else if (band === 5) v = f < 0.16 ? 0.4 : 1 // open timber slats
      else if (band === 6) v = f < 0.14 ? 1.25 : 1 // brick courses: pale mortar joint
      else if (band === 7) v = f < 0.045 ? 0.72 : 1 // sheet-metal joints
      col[y] = v * t[k]
    }
    let mean = 0
    for (let y = 0; y < H; y++) mean += col[y] / H
    for (let y = 0; y < H; y++) {
      const b = Math.max(0, Math.min(255, Math.round((col[y] / mean) * ATLAS_MEAN * 255)))
      for (let x = 0; x < BW; x++) {
        const o = (y * W + band * BW + x) * 4
        data[o] = data[o + 1] = data[o + 2] = b
        data[o + 3] = 255
      }
    }
  }
  const tex = new THREE.DataTexture(data, W, H)
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.NoColorSpace
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

/** V frequency for a stripe band so that one stripe is `pitch` world units wide. */
export const stripeFreq = (pitch: number) => 1 / (pitch * ATLAS_PERIODS)

const srgb = (hex: string) => {
  const c = new THREE.Color(hex)
  return [c.r, c.g, c.b] // linear
}
const toByte = (linear: number) => Math.round(Math.max(0, Math.min(1, Math.pow(Math.max(linear, 0), 1 / 2.2))) * 255)

/**
 * Small equirectangular "studio sky" used only as the reflection map of the glass and the
 * polished aluminium (it is NOT the scene environment, so no other layer changes): sky
 * gradient, a warm glow toward the sun, and soft green ground.
 */
export function reflectionMap(env: SceneEnv): THREE.DataTexture {
  const sky = skyFor(env)
  const dusk = env.time === 'dusk'
  const W = 64
  const H = 32
  const top = srgb(sky.top)
  const hor = srgb(sky.horizon)
  const haze = srgb(sky.haze)
  const glow = srgb(sky.glow)
  const ground = srgb(dusk ? '#232d2a' : env.season === 'winter' ? '#667a55' : '#55773f')
  const sun = new THREE.Vector3(...(dusk ? [-110, 34, 30] : [-70, 95, 62])).normalize()
  const data = new Uint8Array(W * H * 4)
  const d = new THREE.Vector3()
  for (let j = 0; j < H; j++) {
    const lat = ((j + 0.5) / H) * Math.PI - Math.PI / 2
    for (let i = 0; i < W; i++) {
      const lon = ((i + 0.5) / W - 0.5) * Math.PI * 2
      d.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon))
      const s = Math.max(0, d.dot(sun))
      const side = Math.pow(Math.max(0, d.x * sun.x + d.z * sun.z) / Math.hypot(sun.x, sun.z), 1.5)
      const o = (j * W + i) * 4
      for (let c = 0; c < 3; c++) {
        const band = haze[c] + (hor[c] - haze[c]) * (0.3 + 0.7 * side)
        let v: number
        if (d.y >= 0) {
          const t = Math.pow(Math.min(1, d.y / 0.85), 0.55)
          v = band + (top[c] - band) * t
          v += glow[c] * (Math.pow(s, 6) * 0.5 + Math.pow(s, 60) * 2.5)
        } else {
          const t = Math.min(1, -d.y / 0.25)
          v = band + (ground[c] - band) * t
        }
        data[o + c] = toByte(v)
      }
      data[o + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, W, H)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearFilter
  tex.wrapS = THREE.RepeatWrapping
  tex.needsUpdate = true
  return tex
}
export const reflectionKey = (env: SceneEnv) => (env.time === 'dusk' ? 'dusk' : env.season === 'winter' ? 'winter' : 'day')

/** Soft round falloff, white centre to black edge: the "pool of light" under a lamp. */
export function glowTexture(size = 64): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5
      const dy = (y + 0.5) / size - 0.5
      const r = Math.min(1, Math.hypot(dx, dy) * 2)
      const v = Math.pow(1 - r, 2.2)
      const o = (y * size + x) * 4
      data[o] = data[o + 1] = data[o + 2] = Math.round(v * 255)
      data[o + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, size, size)
  tex.colorSpace = THREE.NoColorSpace
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.needsUpdate = true
  return tex
}

/**
 * What plays on the Star Cinema screen at dusk: an abstract wash of soft colour
 * (no film still, logo or text).
 */
export function screenTexture(): THREE.DataTexture {
  const W = 96
  const H = 54
  const data = new Uint8Array(W * H * 4)
  const blobs: [number, number, number, [number, number, number]][] = [
    [0.22, 0.62, 0.42, [0.2, 0.55, 0.95]],
    [0.72, 0.4, 0.46, [1.0, 0.55, 0.32]],
    [0.5, 0.86, 0.5, [0.25, 0.85, 0.75]],
    [0.88, 0.85, 0.34, [0.95, 0.45, 0.7]],
    [0.08, 0.15, 0.36, [0.55, 0.4, 0.95]],
  ]
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = (x + 0.5) / W
      const v = (y + 0.5) / H
      const c = [0.1, 0.13, 0.24]
      for (const [bx, by, br, bc] of blobs) {
        const dd = Math.hypot((u - bx) * 1.78, v - by) / br
        const w = Math.exp(-dd * dd * 2.2)
        for (let k = 0; k < 3; k++) c[k] += bc[k] * w * 0.75
      }
      const vig = 1 - Math.pow(Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5)) * 2, 6) * 0.35
      const o = (y * W + x) * 4
      for (let k = 0; k < 3; k++) data[o + k] = Math.round(Math.max(0, Math.min(1, c[k] * vig)) * 255)
      data[o + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, W, H)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.needsUpdate = true
  return tex
}

/**
 * The snack shop's roof sign, as on the real Airstream: the venue's name in warm marquee
 * letters. Drawn with the browser's own serif face; returns null where no 2D canvas exists.
 */
export function signTexture(text: string): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let px = 96
  ctx.font = `700 ${px}px Georgia, 'Times New Roman', serif`
  const w = ctx.measureText(text).width
  if (w > canvas.width - 24) {
    px = Math.floor((px * (canvas.width - 24)) / w)
    ctx.font = `700 ${px}px Georgia, 'Times New Roman', serif`
  }
  // a stroke round the fill thickens the letters into marquee weight
  ctx.strokeStyle = '#ffffff'
  ctx.lineJoin = 'round'
  ctx.lineWidth = 7
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2 + 4)
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 4)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.NoColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}
