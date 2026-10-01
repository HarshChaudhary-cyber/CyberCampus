// ============================================================
// CyberCampus — 3D Campus Scene
// Built with @react-three/fiber (R3F) + @react-three/drei.
// Lazy-loaded; demand-rendered; fully accessible.
// ============================================================

import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
  Suspense,
} from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { RotateCcw } from 'lucide-react';
import { ROOM_CONFIGS, type RoomConfig } from './roomConfig';
import { LIVE_CHALLENGE_IDS } from '../challenges';
import { useCyberStore } from '../store';
import { isDragMovement } from './campusUtils';
import styles from './CampusScene.module.css';

// ── Color helpers ────────────────────────────────────────────────────────────

function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

// ── Building component ────────────────────────────────────────────────────────

interface BuildingProps {
  config: RoomConfig;
  passedCount: number;
  isLive: boolean;
  reducedMotion: boolean;
  isSelected: boolean;
  onSelect: (roomId: string) => void;
}

const Building: React.FC<BuildingProps> = ({
  config,
  passedCount,
  isLive,
  reducedMotion,
  isSelected,
  onSelect,
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  const { invalidate } = useThree();
  const color = useMemo(() => hexToThreeColor(config.accent), [config.accent]);

  const w = 2.4;
  const d = 2.4;
  const h = config.buildingHeight;

  // Restore ground position immediately when reduced motion becomes active
  useEffect(() => {
    if (reducedMotion && meshRef.current) {
      meshRef.current.position.y = 0;
      invalidate();
    }
  }, [reducedMotion, invalidate]);

  // Clean up cursor when unmounting
  useEffect(() => {
    return () => {
      if (hovered) {
        document.body.style.cursor = '';
      }
    };
  }, [hovered]);

  // Smooth hover float with demand rendering (disabled under reduced motion)
  useFrame((_, delta) => {
    if (reducedMotion || !meshRef.current) return;
    const target = hovered ? 0.25 : 0;
    const diff = target - meshRef.current.position.y;
    if (Math.abs(diff) > 0.001) {
      meshRef.current.position.y += diff * Math.min(delta * 10, 1);
      invalidate();
    } else if (meshRef.current.position.y !== target) {
      meshRef.current.position.y = target;
      invalidate();
    }
  });

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isLive) return;
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  }, [isLive]);

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!isLive) return;
      if (pointerDownPos.current) {
        const wasDrag = isDragMovement(
          pointerDownPos.current.x,
          pointerDownPos.current.y,
          e.clientX,
          e.clientY
        );
        pointerDownPos.current = null;
        // Distinguish click from camera drag (> 5px is a drag, not a selection)
        if (wasDrag) {
          return;
        }
      } else {
        // Pointer down happened outside this mesh (e.g. drag released over building)
        return;
      }

      onSelect(config.id);
      invalidate();
    },
    [isLive, onSelect, config.id, invalidate]
  );

  const opacity = isLive ? 1.0 : 0.45;
  const emissiveIntensity = isSelected
    ? 2.2
    : hovered
      ? 1.6
      : isLive
        ? 0.6
        : 0.2;

  return (
    <group position={config.position3d}>
      {/* Main building body */}
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onPointerEnter={() => {
          setHovered(true);
          if (isLive) document.body.style.cursor = 'pointer';
          invalidate();
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = '';
          invalidate();
        }}
        castShadow
        receiveShadow
        scale={1}
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.35}
          metalness={0.7}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Base ring */}
      <mesh position={[0, -h / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[w * 0.6, w * (isSelected ? 1.05 : 0.9), 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isSelected ? 0.75 : hovered ? 0.55 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Roof accent bar */}
      <mesh position={[0, h / 2 + 0.12, 0]}>
        <boxGeometry args={[w + 0.1, 0.12, d + 0.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 4.5 : hovered ? 3.5 : 1.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Grid lines on front face */}
      {[0.33, 0.66].map((t, i) => (
        <mesh key={i} position={[0, h * (t - 0.5), d / 2 + 0.01]}>
          <planeGeometry args={[w - 0.1, 0.04]} />
          <meshBasicMaterial color={color} transparent opacity={0.25} />
        </mesh>
      ))}

      {/* Floating building label */}
      <Html
        position={[0, h / 2 + 0.7, 0]}
        center
        distanceFactor={12}
        occlude={false}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`${styles.buildingLabel} ${isSelected ? styles.buildingLabelSelected : ''}`}
          style={{
            borderColor: isSelected ? '#ffffff' : config.accent,
            color: hovered || isSelected ? '#fff' : '#ffffffcc',
            background: isSelected
              ? `${config.accent}55`
              : hovered
                ? `${config.accent}25`
                : 'rgba(10,10,18,0.85)',
            boxShadow: isSelected
              ? `0 0 20px ${config.accent}aa`
              : hovered
                ? `0 0 16px ${config.accent}55`
                : 'none',
          }}
        >
          <span className={styles.buildingLabelTitle}>{config.title}</span>
          <span
            className={styles.buildingLabelBadge}
            style={{ background: isLive ? config.accent : '#555' }}
          >
            {isLive ? `${passedCount}/3` : 'Soon'}
          </span>
        </div>
      </Html>
    </group>
  );
};

// ── Ground plane ──────────────────────────────────────────────────────────────

const Ground: React.FC = () => (
  <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial
        color="#0a0a12"
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
    <Grid
      args={[80, 80]}
      position={[0, 0.01, 0]}
      cellSize={2}
      cellThickness={0.4}
      cellColor="#1e1e3a"
      sectionSize={10}
      sectionThickness={0.8}
      sectionColor="#3a3a6a"
      fadeDistance={45}
      fadeStrength={1.5}
      followCamera={false}
      infiniteGrid
    />
  </>
);

// ── WebGL Context Loss Listener ───────────────────────────────────────────────

const ContextLossHandler: React.FC<{ onContextLost?: () => void }> = ({
  onContextLost,
}) => {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    const handleLoss = (event: Event) => {
      event.preventDefault();
      onContextLost?.();
    };

    canvas.addEventListener('webglcontextlost', handleLoss);
    return () => {
      canvas.removeEventListener('webglcontextlost', handleLoss);
    };
  }, [gl, onContextLost]);

  return null;
};

// ── Inner scene ───────────────────────────────────────────────────────────────

interface InnerSceneProps {
  reducedMotion: boolean;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onRegisterReset: (resetFn: () => void) => void;
  onContextLost?: () => void;
}

const INITIAL_CAMERA_POS: [number, number, number] = [0, 14, 22];
const INITIAL_TARGET_POS: [number, number, number] = [0, 1, -3];

const InnerScene: React.FC<InnerSceneProps> = ({
  reducedMotion,
  selectedRoomId,
  onSelectRoom,
  onRegisterReset,
  onContextLost,
}) => {
  const { camera, invalidate } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const { progress } = useCyberStore();

  // Register reset function with parent
  useEffect(() => {
    onRegisterReset(() => {
      if (controlsRef.current) {
        controlsRef.current.target.set(
          INITIAL_TARGET_POS[0],
          INITIAL_TARGET_POS[1],
          INITIAL_TARGET_POS[2]
        );
        controlsRef.current.update();
      }
      camera.position.set(
        INITIAL_CAMERA_POS[0],
        INITIAL_CAMERA_POS[1],
        INITIAL_CAMERA_POS[2]
      );
      camera.lookAt(
        INITIAL_TARGET_POS[0],
        INITIAL_TARGET_POS[1],
        INITIAL_TARGET_POS[2]
      );
      invalidate();
    });
  }, [camera, invalidate, onRegisterReset]);

  return (
    <>
      <ContextLossHandler onContextLost={onContextLost} />

      {/* Camera controls: bounded, auto-rotation disabled, damping disabled under reduced motion */}
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={8}
        maxDistance={40}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.1}
        target={INITIAL_TARGET_POS}
        autoRotate={false}
        enableDamping={!reducedMotion}
        dampingFactor={0.05}
        enabled={!reducedMotion}
        onChange={() => invalidate()}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[12, 20, 8]}
        intensity={1.4}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[0, 8, 0]} intensity={0.8} color="#6366f1" />
      <pointLight position={[-14, 4, 0]} intensity={0.5} color="#f59e0b" />
      <pointLight position={[14, 4, 0]} intensity={0.5} color="#818cf8" />

      <Ground />

      {ROOM_CONFIGS.map((cfg) => {
        const isLive = (cfg.challengeIds as string[]).some((id) =>
          LIVE_CHALLENGE_IDS.has(id)
        );
        const passedCount = progress.portfolio.filter(
          (e) =>
            (cfg.challengeIds as string[]).includes(e.challengeId) &&
            e.passedAt !== null
        ).length;
        return (
          <Building
            key={cfg.id}
            config={cfg}
            passedCount={passedCount}
            isLive={isLive}
            reducedMotion={reducedMotion}
            isSelected={selectedRoomId === cfg.id}
            onSelect={onSelectRoom}
          />
        );
      })}
    </>
  );
};

// ── Public component ──────────────────────────────────────────────────────────

export interface CampusSceneProps {
  reducedMotion: boolean;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onContextLost?: () => void;
}

export const CampusScene: React.FC<CampusSceneProps> = ({
  reducedMotion,
  selectedRoomId,
  onSelectRoom,
  onContextLost,
}) => {
  const resetCameraRef = useRef<(() => void) | null>(null);

  const handleRegisterReset = useCallback((fn: () => void) => {
    resetCameraRef.current = fn;
  }, []);

  const handleResetClick = useCallback(() => {
    if (resetCameraRef.current) {
      resetCameraRef.current();
    }
  }, []);

  // Clean up global cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
    };
  }, []);

  return (
    <div className={styles.canvasWrapper}>
      <Canvas
        frameloop="demand"
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <PerspectiveCamera
          makeDefault
          position={INITIAL_CAMERA_POS}
          fov={55}
          near={0.1}
          far={200}
        />
        <Suspense fallback={null}>
          <InnerScene
            reducedMotion={reducedMotion}
            selectedRoomId={selectedRoomId}
            onSelectRoom={onSelectRoom}
            onRegisterReset={handleRegisterReset}
            onContextLost={onContextLost}
          />
        </Suspense>
      </Canvas>

      {/* Accessible Reset View button */}
      <button
        type="button"
        className={styles.resetViewBtn}
        onClick={handleResetClick}
        aria-label="Reset campus camera view"
      >
        <RotateCcw size={14} aria-hidden="true" />
        <span>Reset View</span>
      </button>

      {/* Orbit hint (hidden when reduced motion is requested) */}
      {!reducedMotion && (
        <div className={styles.orbitHint} aria-hidden="true">
          Drag to orbit · Scroll to zoom · Click building to select
        </div>
      )}
    </div>
  );
};
