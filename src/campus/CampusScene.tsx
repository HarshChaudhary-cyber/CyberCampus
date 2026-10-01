// ============================================================
// CyberCampus — 3D Campus Scene
// Built with @react-three/fiber (R3F) + @react-three/drei.
// Lazy-loaded; never imported on landing page bundle.
// ============================================================

import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  Suspense,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';
import { ROOM_CONFIGS, type RoomConfig } from './roomConfig';
import { LIVE_CHALLENGE_IDS } from '../challenges';
import { useCyberStore } from '../store';
import styles from './CampusScene.module.css';

// ── Colour helpers ────────────────────────────────────────────────────────────

function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

// ── Building component ────────────────────────────────────────────────────────

interface BuildingProps {
  config: RoomConfig;
  passedCount: number;
  isLive: boolean;
  reducedMotion: boolean;
}

const Building: React.FC<BuildingProps> = ({
  config,
  passedCount,
  isLive,
  reducedMotion,
}) => {
  const navigate = useNavigate();
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const color = useMemo(() => hexToThreeColor(config.accent), [config.accent]);

  const w = 2.4;
  const d = 2.4;
  const h = config.buildingHeight;

  // Hover animation: gentle float
  useFrame((_, delta) => {
    if (reducedMotion || !meshRef.current) return;
    const target = hovered ? 0.25 : 0;
    meshRef.current.position.y +=
      (target - meshRef.current.position.y) * Math.min(delta * 6, 1);
  });

  const handleClick = useCallback(() => {
    if (!isLive) return;
    setClicked(true);
    setTimeout(() => setClicked(false), 300);
    navigate(`/room/${config.id}`);
  }, [isLive, navigate, config.id]);

  const opacity = isLive ? 1.0 : 0.45;
  const emissiveIntensity = hovered ? 1.8 : isLive ? 0.6 : 0.2;

  return (
    <group position={config.position3d}>
      {/* Main building body */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerEnter={() => {
          setHovered(true);
          if (isLive) document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = '';
        }}
        castShadow
        receiveShadow
        scale={clicked ? 0.94 : 1}
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

      {/* Glowing base ring */}
      <mesh position={[0, -h / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[w * 0.6, w * 0.9, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.55 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Roof accent bar */}
      <mesh position={[0, h / 2 + 0.12, 0]}>
        <boxGeometry args={[w + 0.1, 0.12, d + 0.1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 4 : 2}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Grid lines on front face (decorative) */}
      {[0.33, 0.66].map((t, i) => (
        <mesh key={i} position={[0, h * (t - 0.5), d / 2 + 0.01]}>
          <planeGeometry args={[w - 0.1, 0.04]} />
          <meshBasicMaterial color={color} transparent opacity={0.25} />
        </mesh>
      ))}

      {/* Floating HTML label */}
      <Html
        position={[0, h / 2 + 0.7, 0]}
        center
        distanceFactor={12}
        occlude={false}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={styles.buildingLabel}
          style={{
            borderColor: config.accent,
            color: hovered ? '#fff' : '#ffffffcc',
            background: hovered
              ? `${config.accent}22`
              : 'rgba(10,10,18,0.82)',
            boxShadow: hovered ? `0 0 16px ${config.accent}55` : 'none',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
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

// ── Ambient particles ─────────────────────────────────────────────────────────

const NUM_PARTICLES = 60;

const Particles: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const ref = useRef<THREE.Points>(null!);

  const [positions] = useState(() => {
    const arr = new Float32Array(NUM_PARTICLES * 3);
    for (let i = 0; i < NUM_PARTICLES; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = Math.random() * 12 + 0.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  });

  useFrame(({ clock }) => {
    if (reducedMotion || !ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.015;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#6366f1"
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
};

// ── Camera auto-orbit on idle ─────────────────────────────────────────────────

const CameraIdleOrbit: React.FC<{
  reducedMotion: boolean;
  userInteracted: boolean;
}> = ({ reducedMotion, userInteracted }) => {
  const { camera } = useThree();

  useFrame(({ clock }) => {
    if (reducedMotion || userInteracted) return;
    const t = clock.getElapsedTime() * 0.08;
    const radius = 22;
    camera.position.x = Math.sin(t) * radius;
    camera.position.z = Math.cos(t) * radius;
    camera.position.y = 14 + Math.sin(t * 0.5) * 1.5;
    camera.lookAt(0, 1, -3);
  });

  return null;
};

// ── Inner scene ───────────────────────────────────────────────────────────────

const InnerScene: React.FC<{
  reducedMotion: boolean;
  userInteracted: boolean;
}> = ({ reducedMotion, userInteracted }) => {
  const { progress } = useCyberStore();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.35} />
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

      {!reducedMotion && <Particles reducedMotion={reducedMotion} />}

      <CameraIdleOrbit
        reducedMotion={reducedMotion}
        userInteracted={userInteracted}
      />

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
          />
        );
      })}
    </>
  );
};

// ── Public component ──────────────────────────────────────────────────────────

export interface CampusSceneProps {
  reducedMotion: boolean;
}

export const CampusScene: React.FC<CampusSceneProps> = ({ reducedMotion }) => {
  const [userInteracted, setUserInteracted] = useState(false);

  return (
    <div className={styles.canvasWrapper} aria-hidden="true">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        onPointerDown={() => setUserInteracted(true)}
        onWheel={() => setUserInteracted(true)}
      >
        <PerspectiveCamera
          makeDefault
          position={[0, 14, 22]}
          fov={55}
          near={0.1}
          far={200}
        />
        <OrbitControls
          enablePan={false}
          minDistance={8}
          maxDistance={40}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 1, -3]}
          onChange={() => setUserInteracted(true)}
          enabled={!reducedMotion}
        />
        <Suspense fallback={null}>
          <InnerScene
            reducedMotion={reducedMotion}
            userInteracted={userInteracted}
          />
        </Suspense>
      </Canvas>

      {/* Keyboard hint */}
      {!reducedMotion && (
        <div className={styles.orbitHint}>
          Drag to orbit · Scroll to zoom
        </div>
      )}
    </div>
  );
};
