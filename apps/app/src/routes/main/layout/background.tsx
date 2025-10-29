import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function WavyPlane() {
  // biome-ignore lint/style/noNonNullAssertion: ignore
  const meshRef = useRef<THREE.Mesh>(null!);

  // Create plane geometry with many segments for smooth waves
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(8, 8, 50, 50);
    return geo;
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime * 0.3; // Slow motion multiplier
      const position = geometry.attributes.position;

      // Animate vertices in a wave pattern
      for (let i = 0; i < (position?.count ?? 0); i++) {
        const x = position?.getX(i) ?? 0;
        const y = position?.getY(i) ?? 0;

        // Create multiple wave layers for complexity
        const wave1 = Math.sin(x * 0.5 + time) * 0.3;
        const wave2 = Math.cos(y * 0.5 + time * 0.8) * 0.2;
        const wave3 = Math.sin((x + y) * 0.3 + time * 0.5) * 0.15;

        const z = wave1 + wave2 + wave3;
        position?.setZ(i, z);
      }

      (position as THREE.BufferAttribute).needsUpdate = true;
      geometry.computeVertexNormals();

      // Gentle rotation
      meshRef.current.rotation.z = Math.sin(time * 0.2) * 0.05;
    }
  });

  return (
    <mesh position={[0, 0, -2]} ref={meshRef} rotation={[-Math.PI / 6, 0, 0]}>
      <primitive object={geometry} />
      <meshStandardMaterial
        color="#e67e50"
        metalness={0.3}
        opacity={0.4}
        roughness={0.7}
        side={THREE.DoubleSide}
        transparent
        wireframe={false}
      />
    </mesh>
  );
}

export default function ThreeBackground() {
  return (
    <div className="-z-10 absolute inset-0">
      <Canvas camera={{ position: [0, 0, 3], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight intensity={0.8} position={[5, 5, 5]} />
        <WavyPlane />
      </Canvas>
    </div>
  );
}
