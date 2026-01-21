import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import * as THREE from 'three';

function ParticleField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 500; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
          (Math.random() - 0.5) * 50,
        ] as [number, number, number],
        scale: Math.random() * 0.3 + 0.1,
        speed: Math.random() * 0.5 + 0.5,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    particles.forEach((particle, i) => {
      const time = state.clock.elapsedTime * particle.speed + particle.offset;

      dummy.position.set(
        particle.position[0] + Math.sin(time * 0.5) * 2,
        particle.position[1] + Math.cos(time * 0.3) * 2,
        particle.position[2] + Math.sin(time * 0.4) * 2
      );

      dummy.scale.setScalar(particle.scale * (1 + Math.sin(time * 2) * 0.2));
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshStandardMaterial
        color="#6366f1"
        emissive="#6366f1"
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
}

function FloatingOrbs() {
  const orbs = useMemo(
    () => [
      { position: [-8, 4, -10] as [number, number, number], color: '#8b5cf6', scale: 1.5 },
      { position: [10, -5, -15] as [number, number, number], color: '#ec4899', scale: 2 },
      { position: [-5, -8, -12] as [number, number, number], color: '#06b6d4', scale: 1.2 },
      { position: [8, 6, -8] as [number, number, number], color: '#10b981', scale: 1.8 },
    ],
    []
  );

  return (
    <>
      {orbs.map((orb, i) => (
        <Float key={i} speed={1.5} rotationIntensity={0.5} floatIntensity={2}>
          <mesh position={orb.position}>
            <sphereGeometry args={[orb.scale, 32, 32]} />
            <meshStandardMaterial
              color={orb.color}
              emissive={orb.color}
              emissiveIntensity={0.3}
              transparent
              opacity={0.15}
            />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function AnimatedGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.z = (state.clock.elapsedTime * 2) % 2;
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[100, 50, '#1e1b4b', '#312e81']}
      position={[0, -15, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#6366f1" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#ec4899" />

      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      <ParticleField />
      <FloatingOrbs />
      <AnimatedGrid />

      <fog attach="fog" args={['#0a0a1a', 20, 80]} />
    </>
  );
}

interface ThreeJSBackgroundProps {
  enabled?: boolean;
}

export function ThreeJSBackground({ enabled = true }: ThreeJSBackgroundProps) {
  if (!enabled) {
    return (
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900" />
    );
  }

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 20], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'linear-gradient(to bottom right, #0a0a1a, #1e1b4b, #0a0a1a)' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
