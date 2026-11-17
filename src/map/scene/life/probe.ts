import * as THREE from 'three'

const ray = new THREE.Raycaster()
const origin = new THREE.Vector3()
const DOWN = new THREE.Vector3(0, -1, 0)
const hits: THREE.Intersection[] = []

function within(o: THREE.Object3D | null, root: THREE.Object3D): boolean {
  for (; o; o = o.parent) if (o === root) return true
  return false
}
function shown(o: THREE.Object3D | null): boolean {
  for (; o; o = o.parent) if (!o.visible) return false
  return true
}

/**
 * Height of the surface the terrain layer draws at some places (the road, a lake), found by
 * looking straight down on them. The Life layer rides on surfaces another layer owns, so it
 * asks the scene where they are instead of assuming a number. Only surfaces between `min`
 * and `max` count (which skips tree crowns above and lake beds below); the median of the
 * places is returned, or NaN when nothing suitable is found.
 *
 * Every ray is tested against the whole scene, so call this once or twice, not per frame.
 */
export function surfaceLevel(scene: THREE.Object3D, skip: THREE.Object3D, places: readonly (readonly [number, number])[], min: number, max: number): number {
  const found: number[] = []
  try {
    for (const [x, z] of places) {
      ray.set(origin.set(x, 40, z), DOWN)
      ray.near = 0
      ray.far = 60
      hits.length = 0
      ray.intersectObjects(scene.children, true, hits)
      for (const h of hits) {
        if (h.point.y > max) continue
        if (h.point.y < min) break
        if (within(h.object, skip) || !shown(h.object)) continue
        found.push(h.point.y)
        break
      }
    }
  } catch {
    return NaN
  }
  hits.length = 0
  if (!found.length) return NaN
  found.sort((a, b) => a - b)
  return found[Math.floor(found.length / 2)]
}
