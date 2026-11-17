import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import * as THREE from 'three'

/** Lighting and background. Day look for now; season / dusk moods come next. */
export function Atmosphere() {
  const scene = useThree((s) => s.scene)
  useLayoutEffect(() => {
    scene.background = new THREE.Color('#bfe0f4')
  }, [scene])
  return (
    <>
      <hemisphereLight args={['#dff1ff', '#6f8f58', 1.0]} />
      <directionalLight
        position={[40, 70, 55]}
        intensity={2.6}
        color="#fff3dc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-75}
        shadow-camera-right={75}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-bias={-0.0004}
      />
    </>
  )
}
