import { Suspense, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Html,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import type { Asset, AssetMetadata } from "@shared/schema";

interface VisionRoomProps {
  assets: Asset[];
  onAssetClick?: (asset: Asset) => void;
  onAssetMove?: (assetId: number, position: { x: number; y: number; z: number }) => void;
  selectedAssetId?: number | null;
}

function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
      </mesh>

      {/* Grid on floor */}
      <gridHelper args={[20, 20, "#333355", "#222244"]} position={[0, 0.01, 0]} />

      {/* Back wall */}
      <mesh position={[0, 4, -10]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#16213e" roughness={0.8} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-10, 4, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#1a1a3e" roughness={0.8} />
      </mesh>

      {/* Right wall */}
      <mesh position={[10, 4, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial color="#1a1a3e" roughness={0.8} />
      </mesh>
    </group>
  );
}

interface AssetPanelProps {
  asset: Asset;
  onClick?: () => void;
  isSelected?: boolean;
}

function AssetPanel({ asset, onClick, isSelected }: AssetPanelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const metadata = (asset.metadata as AssetMetadata) || {};
  const position = metadata.position || { x: 0, y: 3, z: -9.9 };
  const scale = metadata.scale || { x: 2, y: 2, z: 1 };

  // Load texture
  const texture = useTexture(asset.url);
  texture.colorSpace = THREE.SRGBColorSpace;

  // Calculate aspect ratio from texture
  const aspectRatio = texture.image
    ? texture.image.width / texture.image.height
    : 1;
  const adjustedScale = {
    x: scale.x,
    y: scale.x / aspectRatio,
    z: scale.z,
  };

  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      castShadow
    >
      <planeGeometry args={[adjustedScale.x, adjustedScale.y]} />
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        emissive={isSelected ? "#7c3aed" : "#000000"}
        emissiveIntensity={isSelected ? 0.2 : 0}
      />
      {isSelected && (
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[adjustedScale.x + 0.1, adjustedScale.y + 0.1]} />
          <meshBasicMaterial color="#7c3aed" transparent opacity={0.3} />
        </mesh>
      )}
    </mesh>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="text-white text-center">
        <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm">Loading assets...</p>
      </div>
    </Html>
  );
}

function Scene({
  assets,
  onAssetClick,
  selectedAssetId,
}: {
  assets: Asset[];
  onAssetClick?: (asset: Asset) => void;
  selectedAssetId?: number | null;
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={60} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minPolarAngle={0.2}
        target={[0, 3, 0]}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-5, 8, -5]} intensity={0.3} color="#8b5cf6" />
      <pointLight position={[5, 8, -5]} intensity={0.3} color="#6366f1" />

      <Room />

      <Suspense fallback={<LoadingFallback />}>
        {assets.map((asset) => (
          <AssetPanel
            key={asset.id}
            asset={asset}
            onClick={() => onAssetClick?.(asset)}
            isSelected={selectedAssetId === asset.id}
          />
        ))}
      </Suspense>

      <Environment preset="night" />
    </>
  );
}

export function VisionRoom({
  assets,
  onAssetClick,
  onAssetMove,
  selectedAssetId,
}: VisionRoomProps) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#0f0f1a] to-[#1a1a2e] rounded-lg overflow-hidden">
      <Canvas shadows dpr={[1, 2]}>
        <Scene
          assets={assets}
          onAssetClick={onAssetClick}
          selectedAssetId={selectedAssetId}
        />
      </Canvas>
    </div>
  );
}
