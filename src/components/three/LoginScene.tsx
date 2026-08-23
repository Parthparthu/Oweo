/**
 * LoginScene.tsx
 * Lazy-loaded React Three Fiber scene for the Login page background.
 * Features:
 *  - 3 floating wireframe geometries (dodecahedron, torus knot, icosahedron)
 *  - Ambient particle field (80 points)
 *  - Mouse-responsive subtle rotation
 *  - Teal accent colour inherited from CSS variable
 *  - Graceful WebGL fallback
 *
 * This file is React.lazy() imported — it is NOT included in the main bundle.
 */
import React, { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

/* ─── Primary teal color (matches CSS --primary: 173 80% 36%) ─── */
const PRIMARY_COLOR = new THREE.Color().setHSL(173 / 360, 0.8, 0.45)
const PRIMARY_DIM   = new THREE.Color().setHSL(173 / 360, 0.6, 0.28)

/* ──────────────────────────────────────────
   Floating geometric mesh
   ────────────────────────────────────────── */
interface FloatingGeomProps {
  geometry: THREE.BufferGeometry
  position: [number, number, number]
  rotationSpeed: [number, number, number]
  scale: number
  color: THREE.Color
}

const FloatingGeom: React.FC<FloatingGeomProps> = ({
  geometry,
  position,
  rotationSpeed,
  scale,
  color,
}) => {
  const meshRef = useRef<THREE.Mesh>(null!)
  const baseY = position[1]
  const timeOffset = useMemo(() => Math.random() * Math.PI * 2, [])

  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime()
    const mesh = meshRef.current

    // Gentle float on Y axis
    mesh.position.y = baseY + Math.sin(t * 0.4 + timeOffset) * 0.18

    // Constant slow rotation
    mesh.rotation.x += rotationSpeed[0]
    mesh.rotation.y += rotationSpeed[1]
    mesh.rotation.z += rotationSpeed[2]

    // Subtle mouse parallax on X/Y
    mesh.position.x = position[0] + mouse.x * 0.12
    mesh.position.z = position[2] + mouse.y * 0.06
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale} geometry={geometry}>
      <meshBasicMaterial
        color={color}
        wireframe
        transparent
        opacity={0.55}
      />
    </mesh>
  )
}

/* ──────────────────────────────────────────
   Particle field
   ────────────────────────────────────────── */
const ParticleField: React.FC = () => {
  const count = 90
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 9
      arr[i * 3 + 1] = (Math.random() - 0.5) * 7
      arr[i * 3 + 2] = (Math.random() - 0.5) * 5
    }
    return arr
  }, [])

  const pointsRef = useRef<THREE.Points>(null!)

  useFrame(({ clock }) => {
    pointsRef.current.rotation.y = clock.getElapsedTime() * 0.018
    pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.009) * 0.05
  })

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        color={PRIMARY_COLOR}
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </Points>
  )
}

/* ──────────────────────────────────────────
   Scene graph
   ────────────────────────────────────────── */
const SceneContent: React.FC = () => {
  // Pre-build geometries once
  const geoms = useMemo(
    () => ({
      dodeca: new THREE.DodecahedronGeometry(0.9, 0),
      torusKnot: new THREE.TorusKnotGeometry(0.55, 0.18, 80, 12),
      icosa: new THREE.IcosahedronGeometry(0.7, 0),
    }),
    []
  )

  return (
    <>
      {/* Ambient + directional light (for future solid meshes) */}
      <ambientLight intensity={0.6} color={PRIMARY_COLOR} />
      <pointLight position={[3, 4, 3]} intensity={0.8} color={PRIMARY_COLOR} />
      <pointLight position={[-4, -3, 2]} intensity={0.4} color={new THREE.Color(0x60efff)} />

      {/* Wireframe geometries */}
      <FloatingGeom
        geometry={geoms.dodeca}
        position={[-2.2, 0.5, -1.5]}
        rotationSpeed={[0.003, 0.005, 0.002]}
        scale={1}
        color={PRIMARY_COLOR}
      />
      <FloatingGeom
        geometry={geoms.torusKnot}
        position={[2.4, -0.4, -2]}
        rotationSpeed={[0.004, 0.003, 0.006]}
        scale={0.9}
        color={PRIMARY_DIM}
      />
      <FloatingGeom
        geometry={geoms.icosa}
        position={[0.3, 1.8, -3]}
        rotationSpeed={[0.002, 0.007, 0.003]}
        scale={0.75}
        color={PRIMARY_COLOR}
      />

      {/* Particle field */}
      <ParticleField />
    </>
  )
}

/* ──────────────────────────────────────────
   Exported Canvas wrapper
   ────────────────────────────────────────── */
export const LoginScene: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none select-none"
      data-no-transition
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'low-power',
        }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default LoginScene
