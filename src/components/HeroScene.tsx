"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Mesh } from "three";
import { useFrame } from "@react-three/fiber";

/** Ascending "growth line" path, echoing the IBB logo icon */
function GrowthArrow() {
  const tipRef = useRef<Mesh>(null);

  const tubeGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.6, -1.6, 0),
      new THREE.Vector3(-1.4, -1.0, 0.3),
      new THREE.Vector3(-0.3, -0.1, -0.2),
      new THREE.Vector3(0.9, 0.6, 0.2),
      new THREE.Vector3(2.4, 1.7, 0),
    ]);
    return new THREE.TubeGeometry(curve, 64, 0.09, 16, false);
  }, []);

  useFrame(({ clock }) => {
    if (tipRef.current) {
      const t = clock.getElapsedTime();
      tipRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.06);
    }
  });

  return (
    <group rotation={[0, 0, 0.08]}>
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial
          color="#d85a30"
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>

      {/* arrowhead */}
      <mesh ref={tipRef} position={[2.4, 1.7, 0]} rotation={[0, 0, 0.95]}>
        <coneGeometry args={[0.26, 0.55, 24]} />
        <meshStandardMaterial color="#5dcaa5" roughness={0.3} metalness={0.15} />
      </mesh>

      {/* small dots marking "data points" along the line */}
      {[
        [-2.6, -1.6, 0],
        [-0.3, -0.1, -0.2],
        [0.9, 0.6, 0.2],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshStandardMaterial
            color="#2c2c2a"
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

function FloatingRing({
  position,
  scale,
  color,
  speed,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  speed: number;
}) {
  return (
    <Float speed={speed} rotationIntensity={1.1} floatIntensity={1.6}>
      <mesh position={position} scale={scale} rotation={[1.1, 0.4, 0]}>
        <torusGeometry args={[1, 0.06, 16, 64]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 4, 5]} intensity={1.4} />
        <directionalLight position={[-4, -2, -3]} intensity={0.4} />

        <Suspense fallback={null}>
          <Float speed={1.4} rotationIntensity={0.35} floatIntensity={0.9}>
            <GrowthArrow />
          </Float>

          <FloatingRing
            position={[2.6, -1.4, -1]}
            scale={0.5}
            color="#5dcaa5"
            speed={1.6}
          />
          <FloatingRing
            position={[-2.4, 1.6, -1.5]}
            scale={0.3}
            color="#d85a30"
            speed={2.1}
          />

          <Environment preset="city" environmentIntensity={0.35} />
        </Suspense>
      </Canvas>
    </div>
  );
}
