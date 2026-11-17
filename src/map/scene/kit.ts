import * as THREE from 'three'
import { mulberry32 } from '../layout/layout'

export { mulberry32 }

/** Smooth-shaded standard material: the default surface of the model. */
export function soft(color: string, o: THREE.MeshStandardMaterialParameters = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o })
}

/**
 * Tiling greyscale value-noise texture (mid-grey average) for subtle surface variation:
 * use it as `map` multiplied over a base colour, or as `roughnessMap` / `bumpMap`.
 * Generated on the fly, so no image files are needed.
 */
export function noiseTexture(size = 256, seed = 1, octaves = 4, contrast = 0.5): THREE.DataTexture {
  const rnd = mulberry32(seed)
  const data = new Uint8Array(size * size * 4)
  const acc = new Float32Array(size * size)
  let amp = 1
  let total = 0
  for (let o = 0; o < octaves; o++) {
    const cells = 4 << o
    const grid = new Float32Array(cells * cells)
    for (let i = 0; i < grid.length; i++) grid[i] = rnd()
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * cells
        const fy = (y / size) * cells
        const x0 = Math.floor(fx)
        const y0 = Math.floor(fy)
        const tx = fx - x0
        const ty = fy - y0
        const sx = tx * tx * (3 - 2 * tx)
        const sy = ty * ty * (3 - 2 * ty)
        const g = (ix: number, iy: number) => grid[(iy % cells) * cells + (ix % cells)]
        const v = (g(x0, y0) * (1 - sx) + g(x0 + 1, y0) * sx) * (1 - sy) + (g(x0, y0 + 1) * (1 - sx) + g(x0 + 1, y0 + 1) * sx) * sy
        acc[y * size + x] += v * amp
      }
    }
    total += amp
    amp *= 0.5
  }
  for (let i = 0; i < acc.length; i++) {
    const v = Math.max(0, Math.min(1, 0.5 + (acc[i] / total - 0.5) * (1 + contrast * 2)))
    const b = Math.round((1 - contrast * 0.5 + v * contrast) * 255)
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = Math.min(255, b)
    data[i * 4 + 3] = 255
  }
  const tex = new THREE.DataTexture(data, size, size)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.NoColorSpace
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.needsUpdate = true
  return tex
}

/** Emissive "practical light" material; at dusk raise `emissiveIntensity` above 1 so it blooms. */
export function glowMat(color: string, intensity = 0.2): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.6, toneMapped: true })
}
