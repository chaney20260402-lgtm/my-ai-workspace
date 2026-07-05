// @ts-nocheck
'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ---------- 螺旋星系粒子系统 ----------
function SpiralGalaxy() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const count = 4000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const armCount = 4;
    const radius = 12;
    const armsSpread = 0.6;
    const heightSpread = 1.0;

    for (let i = 0; i < count; i++) {
      const armIndex = i % armCount;
      const armAngleOffset = (armIndex / armCount) * Math.PI * 2;

      const t = Math.random();
      const r = t * radius;
      const angle = armAngleOffset + t * 4.5 + (Math.random() - 0.5) * armsSpread * (1 - t);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = (Math.random() - 0.5) * heightSpread * (1 - t * 0.7);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixFactor = t;
      const rCol = 1.0 - mixFactor * 0.6;
      const gCol = 0.9 - mixFactor * 0.5;
      const bCol = 0.7 + mixFactor * 0.7;
      colors[i * 3] = rCol;
      colors[i * 3 + 1] = gCol;
      colors[i * 3 + 2] = bCol;

      sizes[i] = 0.02 + (1 - t) * 0.04 + Math.random() * 0.02;
    }

    return { positions, colors, sizes };
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.03;
    }
  });

  const spriteTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <Points ref={pointsRef} positions={positions} colors={colors} sizes={sizes}>
      <PointMaterial
        size={0.12}
        map={spriteTexture}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        vertexColors
        sizeAttenuation
        opacity={0.95}
      />
    </Points>
  );
}

// ---------- 星系核球 ----------
function GalacticCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group>
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshBasicMaterial color="#ffcc77" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.0, 32, 32]} />
        <meshBasicMaterial color="#ffaa44" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

// ---------- 小行星带 ----------
function AsteroidBelt() {
  const groupRef = useRef<THREE.Group>(null);

  const asteroids = useMemo(() => {
    const count = 60;
    const data = [];
    const radius = 14;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 2.5;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const y = (Math.random() - 0.5) * 1.2;
      const rotX = Math.random() * Math.PI * 2;
      const rotY = Math.random() * Math.PI * 2;
      const rotZ = Math.random() * Math.PI * 2;
      const scale = 0.08 + Math.random() * 0.18;
      const speed = 0.002 + Math.random() * 0.003;
      data.push({
        pos: new THREE.Vector3(x, y, z),
        rot: new THREE.Euler(rotX, rotY, rotZ),
        scale,
        speed,
        angle,
        orbitRadius: r,
      });
    }
    return data;
  }, []);

  const geometry = new THREE.IcosahedronGeometry(0.35, 1);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, index) => {
        if (index < asteroids.length) {
          const data = asteroids[index];
          data.angle += delta * data.speed;
          const x = Math.cos(data.angle) * data.orbitRadius;
          const z = Math.sin(data.angle) * data.orbitRadius;
          child.position.set(x, data.pos.y, z);
          child.rotation.x += delta * 0.3;
          child.rotation.y += delta * 0.5;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {asteroids.map((data, i) => {
        const color = new THREE.Color().setHSL(0.08, 0.1, 0.3 + Math.random() * 0.3);
        return (
          <mesh
            key={i}
            geometry={geometry}
            position={data.pos}
            rotation={data.rot}
            scale={data.scale}
          >
            <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
}

// ---------- 主场景 ----------
export default function StarScene() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [8, 4, 14], fov: 50 }}
        style={{ width: '100%', height: '100%', display: 'block' }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 15, 35]} />

        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <pointLight position={[-10, -5, -10]} intensity={0.2} color="#4466ff" />

        <Stars radius={50} depth={50} count={2500} factor={4} saturation={0.2} fade speed={0.1} />

        <SpiralGalaxy />
        <GalacticCore />
        <AsteroidBelt />

        <OrbitControls
          autoRotate
          autoRotateSpeed={0.6}
          enableRotate={false}
          enableZoom={false}
          enablePan={false}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}