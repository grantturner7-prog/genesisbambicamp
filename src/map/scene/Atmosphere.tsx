import { useLayoutEffect } from 'react'
import type { Season, TimeOfDay } from '../../lib/types'
import { M } from './materials'

/** Lighting plus season / time-of-day tinting of the shared materials. */
export function Atmosphere({ season, time }: { season: Season; time: TimeOfDay }) {
  const dusk = time === 'dusk'
  useLayoutEffect(() => {
    const winter = season === 'winter'
    M.grass.color.set(winter ? '#6f9654' : '#5f9a45')
    M.crown.color.set(winter ? '#5b8f4c' : '#4f9a4f')
    M.crown2.color.set(winter ? '#4b7f52' : '#3e8a52')
    // Bald cypress (落羽松) turns copper in winter.
    M.cypress.color.set(winter ? '#b5652f' : '#3f8a4a')
    M.glow.emissiveIntensity = dusk ? 2.4 : 0.15
    M.lamp.emissiveIntensity = dusk ? 3.2 : 0.4
    M.sign.emissiveIntensity = dusk ? 2.6 : 0.5
    M.screen.emissiveIntensity = dusk ? 1.6 : 0.05
    M.glass.emissive.set(dusk ? '#ffc56b' : '#000000')
    M.glass.emissiveIntensity = dusk ? 1.5 : 0
    M.pool.emissiveIntensity = dusk ? 0.75 : 0.25
    M.water.color.set(dusk ? '#4a6f9a' : winter ? '#77b4cc' : '#7cc7de')
  }, [season, dusk])
  return (
    <>
      <hemisphereLight args={dusk ? ['#8f92d8', '#2c3a2a', 0.55] : ['#dff1ff', '#6f8f58', 1.0]} />
      <directionalLight
        position={dusk ? [-70, 26, 30] : [40, 70, 55]}
        intensity={dusk ? 1.15 : 2.6}
        color={dusk ? '#ff9c5e' : '#fff3dc'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-bias={-0.0004}
      />
    </>
  )
}
