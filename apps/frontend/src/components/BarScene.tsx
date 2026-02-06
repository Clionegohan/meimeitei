'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useBarStore } from '@/stores/useBarStore'

function Counter() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[8, 0.2, 2]} />
      <meshStandardMaterial color="#8B4513" />
    </mesh>
  )
}

function Avatar({ position, name }: { position: [number, number, number]; name: string }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>
    </group>
  )
}

function Scene() {
  const users = useBarStore((state) => state.users)
  const seatedUsers = users.filter((u) => u.seated)

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 3, 0]} intensity={100} color="#FFA500" />
      <Counter />
      {seatedUsers.map((user, index) => {
        const x = -3 + index * 1.5
        return <Avatar key={user.id} position={[x, 0.5, 0]} name={user.name} />
      })}
      <OrbitControls />
    </>
  )
}

export default function BarScene() {
  return (
    <div className="w-full h-96">
      <Canvas camera={{ position: [0, 3, 5], fov: 50 }}>
        <Scene />
      </Canvas>
    </div>
  )
}
