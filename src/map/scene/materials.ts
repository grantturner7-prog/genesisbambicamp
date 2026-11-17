import * as THREE from 'three'

const std = (color: string, o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true, ...o })

/** Shared materials. Season/time-of-day tint these in place (see Atmosphere). */
export const M = {
  grass: std('#5f9a45'),
  soil: std('#8a6a49'),
  bed: std('#3f6f66'),
  rock: std('#6b685f'),
  road: std('#c4b57a'),
  sand: std('#e9dcb4'),
  poolRim: std('#efe8d8'),
  crown: std('#4f9a4f'),
  crown2: std('#3e8a52'),
  cypress: std('#3f8a4a'),
  trunk: std('#6b4a32'),
  wood: std('#b98a5b'),
  woodDark: std('#7b563a'),
  deck: std('#9c6f45'),
  white: std('#f3f1ea'),
  cream: std('#e8dfc8'),
  taupe: std('#c4b8a0'),
  charcoal: std('#33383b', { roughness: 0.6 }),
  roof: std('#9aa2a7', { roughness: 0.55 }),
  roofGold: std('#b9834f'),
  annex: std('#3b4448', { roughness: 0.7 }),
  glass: new THREE.MeshStandardMaterial({ color: '#2a3a44', roughness: 0.15, metalness: 0.3 }),
  sail: new THREE.MeshStandardMaterial({ color: '#efe9dc', roughness: 0.95, side: THREE.DoubleSide }),
  silver: new THREE.MeshStandardMaterial({ color: '#d9e0e5', roughness: 0.3, metalness: 0.75 }),
  red: std('#d4452f'),
  yellow: std('#f0b429'),
  green: std('#2f9e6a'),
  water: new THREE.MeshStandardMaterial({ color: '#7cc7de', roughness: 0.1, metalness: 0.1, emissive: '#2a7f98', emissiveIntensity: 0.18, transparent: true, opacity: 0.92 }),
  pool: new THREE.MeshStandardMaterial({ color: '#68e3ea', roughness: 0.08, metalness: 0.05, emissive: '#2fc6d3', emissiveIntensity: 0.25 }),
  glow: new THREE.MeshStandardMaterial({ color: '#ffe2a6', emissive: '#ffb347', emissiveIntensity: 0 }),
  fire: new THREE.MeshStandardMaterial({ color: '#ff9a2e', emissive: '#ff6a00', emissiveIntensity: 2.2 }),
}
