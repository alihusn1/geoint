import * as THREE from 'three'

interface SatObjInput {
  color: string
  category: string
}

export function createSatelliteObject(sat: SatObjInput): THREE.Group {
  const group = new THREE.Group()
  const color = new THREE.Color(sat.color || '#9B5DE5')

  // Tiny dot — works well at scale with thousands of satellites
  const dotGeo = new THREE.SphereGeometry(0.6, 6, 6)
  const dotMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })
  const dot = new THREE.Mesh(dotGeo, dotMat)
  group.add(dot)

  // Subtle glow halo
  const glowGeo = new THREE.SphereGeometry(1.2, 6, 6)
  const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12 })
  const glow = new THREE.Mesh(glowGeo, glowMat)
  group.add(glow)

  return group
}
