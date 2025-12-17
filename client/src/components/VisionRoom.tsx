import {
  Suspense,
  useRef,
  useState,
  useEffect,
  useCallback,
  Component,
  type ReactNode,
} from "react";
import { VisionToolbar } from "./toolbar/VisionToolbar";
import { VisionCanvas } from "./toolbar/VisionCanvas";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Html,
  useTexture,
  TransformControls,
} from "@react-three/drei";
import * as THREE from "three";
import type { Asset, AssetMetadata } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  RotateCcw,
  Maximize2,
  Home,
  Grid3X3,
  Play,
  Pause,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

class WebGLErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("WebGL Error:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

function FallbackView2D({ assets }: { assets: Asset[] }) {
  return (
    <div
      className="w-full h-full p-4 overflow-auto"
      data-testid="fallback-2d-view"
    >
      <div className="flex items-center gap-2 mb-4 text-muted-foreground">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">
          3D view unavailable - showing 2D gallery
        </span>
      </div>
      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
          <p>No assets yet. Upload images to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <Card key={asset.id} className="overflow-hidden">
              <CardContent className="p-0">
                <img
                  src={asset.url}
                  alt={asset.altText || `Asset ${asset.id}`}
                  className="w-full h-32 object-cover"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface CameraPreset {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  icon: React.ReactNode;
}

const CAMERA_PRESETS: CameraPreset[] = [
  {
    name: "Front",
    position: [0, 4, 8],
    target: [0, 3, 0],
    icon: <Home className="w-3 h-3" />,
  },
  {
    name: "Left",
    position: [-10, 4, 0],
    target: [0, 3, 0],
    icon: <ChevronLeft className="w-3 h-3" />,
  },
  {
    name: "Right",
    position: [10, 4, 0],
    target: [0, 3, 0],
    icon: <ChevronRight className="w-3 h-3" />,
  },
  {
    name: "Top",
    position: [0, 12, 0.1],
    target: [0, 3, 0],
    icon: <Grid3X3 className="w-3 h-3" />,
  },
  {
    name: "Overview",
    position: [8, 8, 8],
    target: [0, 3, 0],
    icon: <Maximize2 className="w-3 h-3" />,
  },
];

interface VisionRoomProps {
  assets: Asset[];
  onAssetClick?: (asset: Asset) => void;
  onAssetMove?: (
    assetId: number,
    position: { x: number; y: number; z: number }
  ) => void;
  onAssetEdit?: (asset: Asset) => void;
  onWallClick?: (wallName: string, position: { x: number; y: number; z: number }) => void;
  selectedAssetId?: number | null;
  showControls?: boolean;
}

interface RoomProps {
  onWallClick?: (wallName: string, position: { x: number; y: number; z: number }) => void;
}

function Room({ onWallClick }: RoomProps) {
  return (
    <group>
      {/* Floor - lighter and more visible */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2a2a3e" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Grid helper - brighter */}
      <gridHelper
        args={[20, 20, "#4a4a6e", "#3a3a5e"]}
        position={[0, 0.01, 0]}
      />

      {/* Back wall - main wall, lighter and interactive */}
      <mesh
        position={[0, 4, -10]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          const point = e.point;
          onWallClick?.("back", { x: point.x, y: point.y, z: -9.8 });
        }}
      >
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial
          color="#3a3a5e"
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>

      {/* Left wall - interactive */}
      <mesh
        position={[-10, 4, 0]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          const point = e.point;
          onWallClick?.("left", { x: -9.8, y: point.y, z: point.z });
        }}
      >
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial
          color="#34345a"
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>

      {/* Right wall - interactive */}
      <mesh
        position={[10, 4, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          const point = e.point;
          onWallClick?.("right", { x: 9.8, y: point.y, z: point.z });
        }}
      >
        <planeGeometry args={[20, 8]} />
        <meshStandardMaterial
          color="#34345a"
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

interface AssetPanelProps {
  asset: Asset;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onPositionChange?: (position: { x: number; y: number; z: number }) => void;
  isSelected?: boolean;
  animationTime?: number;
}

function AssetPanel({
  asset,
  onClick,
  onDoubleClick,
  onPositionChange,
  isSelected,
  animationTime = 0,
}: AssetPanelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const metadata = (asset.metadata as AssetMetadata) || {};
  const position = metadata.position || { x: 0, y: 3, z: -9.9 };
  const scale = metadata.scale || { x: 2, y: 2, z: 1 };
  const [isDragging, setIsDragging] = useState(false);

  useFrame(() => {
    if (meshRef.current && animationTime > 0 && !isDragging) {
      const floatAmount = Math.sin(animationTime * 2 + asset.id * 0.5) * 0.05;
      meshRef.current.position.y = position.y + floatAmount;
    }
  });

  // Handle sticky notes with dragging
  if (asset.type === "note") {
    const meta = metadata as any;
    return (
      <group
        ref={groupRef}
        position={[position.x, position.y, position.z]}
      >
        {isSelected && onPositionChange && (
          <TransformControls
            object={groupRef.current}
            mode="translate"
            onObjectChange={() => {
              if (groupRef.current) {
                const pos = groupRef.current.position;
                onPositionChange({ x: pos.x, y: pos.y, z: pos.z });
                setIsDragging(true);
              }
            }}
            onMouseUp={() => setIsDragging(false)}
          />
        )}
        <Html center distanceFactor={8}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onDoubleClick?.();
            }}
            className={`px-3 py-2 cursor-move transition-all shadow-lg ${
              isSelected ? "ring-2 ring-blue-400 scale-105" : ""
            }`}
            style={{
              backgroundColor: meta.backgroundColor || "#fef08a",
              fontSize: `${meta.fontSize || 16}px`,
              color: meta.color || "#000000",
              fontFamily: meta.fontFamily || "monospace",
              fontWeight: meta.bold ? "bold" : "normal",
              fontStyle: meta.italic ? "italic" : "normal",
              textDecoration: meta.underline ? "underline" : "none",
              textAlign: meta.alignment || "left",
              minWidth: "120px",
              minHeight: "80px",
              maxWidth: "200px",
              borderRadius: "2px",
              boxShadow: "2px 2px 8px rgba(0,0,0,0.3)",
              transform: "rotate(-2deg)",
              userSelect: "none",
            }}
          >
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {meta.text || "Note"}
            </div>
          </div>
        </Html>
      </group>
    );
  }

  // Handle pins with dragging
  if (asset.type === "pin") {
    return (
      <group
        ref={groupRef}
        position={[position.x, position.y, position.z]}
      >
        {isSelected && onPositionChange && (
          <TransformControls
            object={groupRef.current}
            mode="translate"
            onObjectChange={() => {
              if (groupRef.current) {
                const pos = groupRef.current.position;
                onPositionChange({ x: pos.x, y: pos.y, z: pos.z });
                setIsDragging(true);
              }
            }}
            onMouseUp={() => setIsDragging(false)}
          />
        )}
        <Html center distanceFactor={15}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className={`cursor-pointer transition-all ${
              isSelected ? "scale-150" : ""
            }`}
            style={{
              fontSize: "32px",
              filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3)) ${
                isSelected ? "drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))" : ""
              }`,
              userSelect: "none",
            }}
          >
            📌
          </div>
        </Html>
      </group>
    );
  }

  // Handle floating text assets with dragging
  if (asset.type === "text") {
    const meta = metadata as any;
    return (
      <group
        ref={groupRef}
        position={[position.x, position.y, position.z]}
      >
        {isSelected && onPositionChange && (
          <TransformControls
            object={groupRef.current}
            mode="translate"
            onObjectChange={() => {
              if (groupRef.current) {
                const pos = groupRef.current.position;
                onPositionChange({ x: pos.x, y: pos.y, z: pos.z });
                setIsDragging(true);
              }
            }}
            onMouseUp={() => setIsDragging(false)}
          />
        )}
        <Html center distanceFactor={10}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onDoubleClick?.();
            }}
            className={`px-4 py-2 rounded-lg cursor-move transition-all ${
              isSelected ? "ring-2 ring-purple-400 scale-105" : ""
            }`}
            style={{
              backgroundColor: meta.backgroundColor || "rgba(31, 41, 55, 0.9)",
              fontSize: `${meta.fontSize || 32}px`,
              color: meta.color || "#ffffff",
              fontFamily: meta.fontFamily || "sans-serif",
              fontWeight: meta.bold ? "bold" : "normal",
              fontStyle: meta.italic ? "italic" : "normal",
              textDecoration: meta.underline ? "underline" : "none",
              textAlign: meta.alignment || "left",
              textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              userSelect: "none",
              minWidth: "150px",
              maxWidth: "400px",
            }}
          >
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {meta.text || "Text"}
            </div>
          </div>
        </Html>
      </group>
    );
  }

  // Handle link/reference assets
  if (asset.type === "link") {
    return (
      <Html
        position={[position.x, position.y, position.z]}
        center
        distanceFactor={10}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className={`px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
            isSelected ? "bg-blue-600/90 ring-2 ring-blue-400" : "bg-gray-800/80"
          }`}
          style={{
            fontSize: "16px",
            color: "#ffffff",
            userSelect: "none",
          }}
        >
          <span>🔗</span>
          <span className="font-medium">{asset.altText || "Link"}</span>
        </div>
      </Html>
    );
  }

  // Handle image assets (existing behavior)
  let texture;
  let aspectRatio = 1;

  try {
    texture = useTexture(asset.url);
    texture.colorSpace = THREE.SRGBColorSpace;

    aspectRatio =
      texture.image && (texture.image as HTMLImageElement).width
        ? (texture.image as HTMLImageElement).width /
          (texture.image as HTMLImageElement).height
        : 1;
  } catch (error) {
    // Fallback for assets that can't be loaded as textures
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
        <planeGeometry args={[scale.x, scale.y]} />
        <meshStandardMaterial
          color="#444444"
          side={THREE.DoubleSide}
          emissive={isSelected ? "#7c3aed" : "#000000"}
          emissiveIntensity={isSelected ? 0.2 : 0}
        />
      </mesh>
    );
  }

  const adjustedScale = {
    x: scale.x,
    y: scale.x / aspectRatio,
    z: scale.z,
  };

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      {isSelected && onPositionChange && (
        <TransformControls
          object={groupRef.current}
          mode="translate"
          onObjectChange={() => {
            if (groupRef.current) {
              const pos = groupRef.current.position;
              onPositionChange({ x: pos.x, y: pos.y, z: pos.z });
              setIsDragging(true);
            }
          }}
          onMouseUp={() => setIsDragging(false)}
        />
      )}
      <mesh
        ref={meshRef}
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
            <planeGeometry
              args={[adjustedScale.x + 0.1, adjustedScale.y + 0.1]}
            />
            <meshBasicMaterial color="#7c3aed" transparent opacity={0.3} />
          </mesh>
        )}
      </mesh>
    </group>
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

interface CameraControllerProps {
  targetPosition: [number, number, number] | null;
  targetLookAt: [number, number, number] | null;
  onTransitionComplete?: () => void;
}

function CameraController({
  targetPosition,
  targetLookAt,
  onTransitionComplete,
}: CameraControllerProps) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const transitionProgress = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (targetPosition && targetLookAt) {
      startPosition.current.copy(camera.position);
      if (controlsRef.current) {
        startTarget.current.copy(controlsRef.current.target);
      }
      transitionProgress.current = 0;
      isTransitioning.current = true;
    }
  }, [targetPosition, targetLookAt, camera]);

  useFrame((_, delta) => {
    if (isTransitioning.current && targetPosition && targetLookAt) {
      transitionProgress.current = Math.min(
        transitionProgress.current + delta * 2,
        1
      );
      const t = transitionProgress.current;
      const eased = 1 - Math.pow(1 - t, 3);

      camera.position.lerpVectors(
        startPosition.current,
        new THREE.Vector3(...targetPosition),
        eased
      );

      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(
          startTarget.current,
          new THREE.Vector3(...targetLookAt),
          eased
        );
        controlsRef.current.update();
      }

      if (t >= 1) {
        isTransitioning.current = false;
        onTransitionComplete?.();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={3}
      maxDistance={15}
      maxPolarAngle={Math.PI / 2 - 0.1}
      minPolarAngle={0.2}
      target={[0, 3, 0]}
    />
  );
}

function Scene({
  assets,
  onAssetClick,
  onAssetEdit,
  onAssetMove,
  onWallClick,
  selectedAssetId,
  cameraTarget,
  lookAtTarget,
  onCameraTransitionComplete,
  animationTime,
}: {
  assets: Asset[];
  onAssetClick?: (asset: Asset) => void;
  onAssetEdit?: (asset: Asset) => void;
  onAssetMove?: (assetId: number, position: { x: number; y: number; z: number }) => void;
  onWallClick?: (wallName: string, position: { x: number; y: number; z: number }) => void;
  selectedAssetId?: number | null;
  cameraTarget: [number, number, number] | null;
  lookAtTarget: [number, number, number] | null;
  onCameraTransitionComplete?: () => void;
  animationTime: number;
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={60} />
      <CameraController
        targetPosition={cameraTarget}
        targetLookAt={lookAtTarget}
        onTransitionComplete={onCameraTransitionComplete}
      />

      {/* Improved lighting for better visibility */}
      <ambientLight intensity={0.6} color="#f0f0ff" />

      {/* Main directional light - brighter and warmer */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Fill lights for better visibility */}
      <pointLight position={[-8, 6, -5]} intensity={0.5} color="#a5b4fc" />
      <pointLight position={[8, 6, -5]} intensity={0.5} color="#c4b5fd" />
      <pointLight position={[0, 6, 8]} intensity={0.4} color="#e9d5ff" />

      {/* Rim light for depth */}
      <spotLight
        position={[0, 8, -10]}
        angle={0.8}
        intensity={0.6}
        color="#fef3c7"
        penumbra={0.5}
      />

      <Room onWallClick={onWallClick} />

      <Suspense fallback={<LoadingFallback />}>
        {assets.map((asset) => (
          <AssetPanel
            key={asset.id}
            asset={asset}
            onClick={() => onAssetClick?.(asset)}
            onDoubleClick={() => onAssetEdit?.(asset)}
            onPositionChange={(position) => onAssetMove?.(asset.id, position)}
            isSelected={selectedAssetId === asset.id}
            animationTime={animationTime}
          />
        ))}
      </Suspense>

      <Environment preset="night" />
    </>
  );
}

function Minimap({
  assets,
  onPositionClick,
}: {
  assets: Asset[];
  onPositionClick: (x: number, z: number) => void;
}) {
  const mapSize = 80;
  const roomSize = 20;
  const scale = mapSize / roomSize;

  return (
    <div
      className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm border rounded-lg p-2 z-10"
      data-testid="minimap"
    >
      <div
        className="relative bg-muted rounded cursor-crosshair"
        style={{ width: mapSize, height: mapSize }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / mapSize - 0.5) * roomSize;
          const z = ((e.clientY - rect.top) / mapSize - 0.5) * roomSize;
          onPositionClick(x, z);
        }}
      >
        <div
          className="absolute border border-muted-foreground/30"
          style={{
            left: "10%",
            top: "10%",
            width: "80%",
            height: "80%",
            borderRadius: 2,
          }}
        />

        {assets.map((asset) => {
          const metadata = (asset.metadata as AssetMetadata) || {};
          const pos = metadata.position || { x: 0, y: 3, z: -5 };
          const left = (pos.x / roomSize + 0.5) * mapSize;
          const top = (pos.z / roomSize + 0.5) * mapSize;

          return (
            <div
              key={asset.id}
              className="absolute w-2 h-2 bg-primary rounded-full transform -translate-x-1 -translate-y-1"
              style={{ left, top }}
              title={asset.altText || `Asset ${asset.id}`}
            />
          );
        })}

        <div
          className="absolute w-0 h-0 transform -translate-x-1 -translate-y-1"
          style={{
            left: mapSize / 2,
            top: mapSize * 0.7,
            borderLeft: "4px solid transparent",
            borderRight: "4px solid transparent",
            borderBottom: "8px solid hsl(var(--primary))",
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center mt-1">Minimap</p>
    </div>
  );
}

function TimelineControls({
  isPlaying,
  onPlayPause,
  onReset,
  progress,
  onProgressChange,
}: {
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  progress: number;
  onProgressChange: (value: number) => void;
}) {
  return (
    <div
      className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm border rounded-lg p-3 z-10 flex items-center gap-3"
      data-testid="timeline-controls"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={onReset}
            data-testid="button-timeline-reset"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reset Animation</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={onPlayPause}
            data-testid="button-timeline-play"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isPlaying ? "Pause" : "Play"} Animation
        </TooltipContent>
      </Tooltip>

      <div className="w-32">
        <Slider
          value={[progress * 100]}
          onValueChange={([value]) => onProgressChange(value / 100)}
          max={100}
          step={1}
          className="cursor-pointer"
          data-testid="slider-timeline"
        />
      </div>

      <span className="text-xs text-muted-foreground w-10">
        {Math.round(progress * 100)}%
      </span>
    </div>
  );
}

function CameraPresetButtons({
  onPresetSelect,
  activePreset,
}: {
  onPresetSelect: (preset: CameraPreset) => void;
  activePreset: string | null;
}) {
  return (
    <div
      className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm border rounded-lg p-2 z-10 flex flex-col gap-1"
      data-testid="camera-presets"
    >
      <p className="text-xs text-muted-foreground mb-1 px-1">Camera Views</p>
      {CAMERA_PRESETS.map((preset) => (
        <Tooltip key={preset.name}>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={activePreset === preset.name ? "secondary" : "ghost"}
              onClick={() => onPresetSelect(preset)}
              className="justify-start gap-2"
              data-testid={`button-preset-${preset.name.toLowerCase()}`}
            >
              {preset.icon}
              <span className="text-xs">{preset.name}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{preset.name} View</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function ZoomControls({
  onZoom,
}: {
  onZoom: (direction: "in" | "out") => void;
}) {
  return (
    <div
      className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm border rounded-lg p-1 z-10 flex flex-col gap-1"
      data-testid="zoom-controls"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onZoom("in")}
            data-testid="button-zoom-in"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom In</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onZoom("out")}
            data-testid="button-zoom-out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Zoom Out</TooltipContent>
      </Tooltip>
    </div>
  );
}

// Existing VisionRoom component continues below with 3D scene and controls
export function VisionRoom({
  assets,
  onAssetClick,
  onAssetMove,
  onAssetEdit,
  onWallClick,
  selectedAssetId,
  showControls = true,
}: VisionRoomProps) {
  const [cameraTarget, setCameraTarget] = useState<
    [number, number, number] | null
  >(null);
  const [lookAtTarget, setLookAtTarget] = useState<
    [number, number, number] | null
  >(null);
  const [activePreset, setActivePreset] = useState<string | null>("Front");
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationTime, setAnimationTime] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const [webglSupported] = useState(() => checkWebGLSupport());

  const handlePresetSelect = useCallback((preset: CameraPreset) => {
    setCameraTarget(preset.position);
    setLookAtTarget(preset.target);
    setActivePreset(preset.name);
  }, []);

  const handleMinimapClick = useCallback((x: number, z: number) => {
    const newPosition: [number, number, number] = [x, 6, z + 8];
    const newTarget: [number, number, number] = [x, 3, z];
    setCameraTarget(newPosition);
    setLookAtTarget(newTarget);
    setActivePreset(null);
  }, []);

  const handleZoom = useCallback((direction: "in" | "out") => {
    const zoomPreset =
      direction === "in"
        ? {
            position: [0, 3, 5] as [number, number, number],
            target: [0, 3, 0] as [number, number, number],
          }
        : {
            position: [0, 6, 12] as [number, number, number],
            target: [0, 3, 0] as [number, number, number],
          };
    setCameraTarget(zoomPreset.position);
    setLookAtTarget(zoomPreset.target);
    setActivePreset(null);
  }, []);

  useEffect(() => {
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      if (isPlaying) {
        const delta = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        setAnimationTime((prev) => prev + delta);
        setAnimationProgress((prev) => {
          const newProgress = prev + delta * 0.05;
          return newProgress > 1 ? 0 : newProgress;
        });

        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      lastTime = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setAnimationTime(0);
    setAnimationProgress(0);
  }, []);

  const handleProgressChange = useCallback((value: number) => {
    setAnimationProgress(value);
    setAnimationTime(value * 20);
  }, []);

  const fallback = <FallbackView2D assets={assets} />;

  if (!webglSupported) {
    return (
      <div className="relative w-full h-full bg-gradient-to-b from-[#0f0f1a] to-[#1a1a2e] rounded-lg overflow-hidden">
        {fallback}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#1a1a2e] to-[#2a2a3e] rounded-lg overflow-hidden">
      <WebGLErrorBoundary fallback={fallback}>
        <Canvas shadows dpr={[1, 2]}>
          <Scene
            assets={assets}
            onAssetClick={onAssetClick}
            onAssetEdit={onAssetEdit}
            onAssetMove={onAssetMove}
            onWallClick={onWallClick}
            selectedAssetId={selectedAssetId}
            cameraTarget={cameraTarget}
            lookAtTarget={lookAtTarget}
            onCameraTransitionComplete={() => {
              setCameraTarget(null);
              setLookAtTarget(null);
            }}
            animationTime={animationTime}
          />
        </Canvas>
      </WebGLErrorBoundary>

      {showControls && (
        <>
          <CameraPresetButtons
            onPresetSelect={handlePresetSelect}
            activePreset={activePreset}
          />
          <ZoomControls onZoom={handleZoom} />
          <Minimap assets={assets} onPositionClick={handleMinimapClick} />
          <TimelineControls
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onReset={handleReset}
            progress={animationProgress}
            onProgressChange={handleProgressChange}
          />
        </>
      )}
    </div>
  );
}
