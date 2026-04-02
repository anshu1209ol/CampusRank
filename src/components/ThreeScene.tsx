import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, PerspectiveCamera, OrbitControls, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere args={[1, 100, 200]} scale={2} ref={meshRef}>
        <MeshDistortMaterial
          color="#8b5cf6"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function FloatingCards() {
  return (
    <>
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1} position={[-3, 1, -2]}>
        <mesh>
          <boxGeometry args={[1.5, 2, 0.1]} />
          <MeshWobbleMaterial color="#3b82f6" factor={0.2} speed={1} />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={0.8} floatIntensity={1.5} position={[3, -1, -1]}>
        <mesh>
          <boxGeometry args={[1.2, 1.8, 0.1]} />
          <MeshWobbleMaterial color="#ec4899" factor={0.3} speed={1.5} />
        </mesh>
      </Float>
    </>
  );
}

export default function ThreeScene() {
  return (
    <div className="absolute inset-0 -z-10 bg-black overflow-hidden">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        
        <AnimatedSphere />
        <FloatingCards />
        
        <OrbitControls enableZoom={false} enablePan={false} />
        
        <fog attach="fog" args={['#000', 5, 15]} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />
    </div>
  );
}
