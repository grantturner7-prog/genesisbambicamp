import * as THREE from 'three'
import { mulberry32 } from '../../layout/layout'

/** Tiling fractal value noise, normalised to the full 0..1 range. */
function tileFbm(size: number, seed: number, cells: number, octaves: number, gain = 0.5): Float32Array {
  const rnd = mulberry32(seed)
  const acc = new Float32Array(size * size)
  let amp = 1
  for (let o = 0; o < octaves; o++) {
    const c = cells << o
    const grid = new Float32Array(c * c)
    for (let i = 0; i < grid.length; i++) grid[i] = rnd()
    const k = c / size
    for (let y = 0; y < size; y++) {
      const fy = y * k
      const y0 = Math.floor(fy)
      const ty = fy - y0
      const sy = ty * ty * (3 - 2 * ty)
      const r0 = (y0 % c) * c
      const r1 = ((y0 + 1) % c) * c
      for (let x = 0; x < size; x++) {
        const fx = x * k
        const x0 = Math.floor(fx)
        const tx = fx - x0
        const sx = tx * tx * (3 - 2 * tx)
        const a = x0 % c
        const b = (x0 + 1) % c
        acc[y * size + x] += ((grid[r0 + a] * (1 - sx) + grid[r0 + b] * sx) * (1 - sy) + (grid[r1 + a] * (1 - sx) + grid[r1 + b] * sx) * sy) * amp
      }
    }
    amp *= gain
  }
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < acc.length; i++) {
    if (acc[i] < lo) lo = acc[i]
    if (acc[i] > hi) hi = acc[i]
  }
  const s = 1 / (hi - lo || 1)
  for (let i = 0; i < acc.length; i++) acc[i] = (acc[i] - lo) * s
  return acc
}

/**
 * A tiling, mip-mapped data texture. The high tier filters it fully (trilinear, with a little
 * anisotropy where asked); phones take the cheaper nearest-mip filtering.
 */
function dataTexture(data: Uint8Array, size: number, high: boolean, anisotropy = 1): THREE.DataTexture {
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.NoColorSpace
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = high ? THREE.LinearMipmapLinearFilter : THREE.LinearMipmapNearestFilter
  tex.generateMipmaps = true
  tex.anisotropy = high ? anisotropy : 1
  tex.needsUpdate = true
  return tex
}

/**
 * Four independent tiling noises in one texture:
 * R broad patches, G medium patches, B fine grain, A a second set of medium patches.
 */
export function groundNoiseTexture(size: number, high: boolean): THREE.DataTexture {
  const r = tileFbm(size, 11, 4, 4)
  const g = tileFbm(size, 23, 8, 3)
  const b = tileFbm(size, 37, 32, 3, 0.7)
  const a = tileFbm(size, 51, 6, 4, 0.6)
  const data = new Uint8Array(size * size * 4)
  for (let i = 0; i < size * size; i++) {
    data[i * 4] = r[i] * 255
    data[i * 4 + 1] = g[i] * 255
    data[i * 4 + 2] = b[i] * 255
    data[i * 4 + 3] = a[i] * 255
  }
  return dataTexture(data, size, high, 4)
}

/** Water surface: RG = ripple slope (x, z), B = ripple height, A = a second height field (caustics). */
export function rippleTexture(size: number, high: boolean): THREE.DataTexture {
  const h = tileFbm(size, 71, 5, 4, 0.55)
  const c = tileFbm(size, 83, 7, 3, 0.5)
  const data = new Uint8Array(size * size * 4)
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const sx = (at(x + 1, y) - at(x - 1, y)) * size * 0.035
      const sz = (at(x, y + 1) - at(x, y - 1)) * size * 0.035
      data[i] = Math.max(0, Math.min(255, 127.5 + sx * 127.5))
      data[i + 1] = Math.max(0, Math.min(255, 127.5 + sz * 127.5))
      data[i + 2] = h[y * size + x] * 255
      data[i + 3] = c[y * size + x] * 255
    }
  }
  return dataTexture(data, size, high)
}

/**
 * Woodland canopy seen from above, as one tiling texture of `crowns` x `crowns` tree crowns:
 * RG = surface normal (x, z), B = a random tint per crown, A = crown height (0 in the gaps).
 * Draped over the land around the camp it reads as a continuous forest canopy.
 */
export function canopyTexture(size: number, crowns: number, tileWorld: number, high: boolean): THREE.DataTexture {
  const rnd = mulberry32(97)
  const G = crowns
  const px = new Float32Array(G * G)
  const pz = new Float32Array(G * G)
  const rad = new Float32Array(G * G)
  const hgt = new Float32Array(G * G)
  const tint = new Float32Array(G * G)
  for (let i = 0; i < G * G; i++) {
    px[i] = 0.1 + rnd() * 0.8
    pz[i] = 0.1 + rnd() * 0.8
    rad[i] = 0.72 + rnd() * 0.44
    hgt[i] = 0.55 + rnd() * 0.45
    tint[i] = rnd()
  }
  // a few lobes per crown, so the canopy billows instead of reading as a pattern of discs
  const leaf = tileFbm(size, 131, crowns * 3, 2, 0.6)
  const height = new Float32Array(size * size)
  const tintOut = new Float32Array(size * size).fill(0.5)
  const cellPx = size / G
  // stamp each crown's soft dome into the height field, keeping the tallest where they overlap
  for (let c = 0; c < G * G; c++) {
    const cx = ((c % G) + px[c]) * cellPx
    const cy = (Math.floor(c / G) + pz[c]) * cellPx
    const r = rad[c] * cellPx
    const ir2 = 1 / (r * r)
    for (let y = Math.floor(cy - r - 0.5); y <= Math.ceil(cy + r - 0.5); y++) {
      const dz = y + 0.5 - cy
      const row = (((y % size) + size) % size) * size
      for (let x = Math.floor(cx - r - 0.5); x <= Math.ceil(cx + r - 0.5); x++) {
        const dx = x + 0.5 - cx
        const q = (dx * dx + dz * dz) * ir2
        if (q >= 1) continue
        const t = Math.sqrt(1 - q)
        const hh = hgt[c] * t * Math.sqrt(t) // (1 - q) ^ 0.75
        const k = row + (((x % size) + size) % size)
        if (hh > height[k]) {
          height[k] = hh
          tintOut[k] = tint[c]
        }
      }
    }
  }
  for (let k = 0; k < height.length; k++) if (height[k] > 0) height[k] = Math.min(1, height[k] * (0.74 + leaf[k] * 0.5))

  const data = new Uint8Array(size * size * 4)
  const out = new Uint8ClampedArray(data.buffer)
  // slope in world units: crown height is about half a crown cell
  const k = ((tileWorld / G) * 0.5) / ((2 * tileWorld) / size)
  for (let y = 0; y < size; y++) {
    const row = y * size
    const up = ((y + size - 1) % size) * size
    const down = ((y + 1) % size) * size
    for (let x = 0; x < size; x++) {
      const i = (row + x) * 4
      const sx = (height[row + ((x + 1) % size)] - height[row + ((x + size - 1) % size)]) * k
      const sz = (height[down + x] - height[up + x]) * k
      const l = 127.5 / Math.sqrt(sx * sx + 1 + sz * sz)
      out[i] = 127.5 - sx * l
      out[i + 1] = 127.5 - sz * l
      out[i + 2] = tintOut[row + x] * 255
      out[i + 3] = height[row + x] * 255
    }
  }
  return dataTexture(data, size, high, 4)
}
