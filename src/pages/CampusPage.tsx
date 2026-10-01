// ============================================================
// CyberCampus — CampusPage
// Shows an interactive 3D campus scene (lazy-loaded, demand-rendered)
// with an accessible HTML room navigation list always usable by AT
// and keyboard in both 2D and 3D modes.
// ============================================================

import React, {
  lazy,
  Suspense,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Monitor,
  Network,
  Search,
  Lock,
  ArrowRight,
  Building2,
  Layers,
  Map,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useCyberStore } from '../store';
import { LIVE_CHALLENGE_IDS } from '../challenges';
import { ROOM_CONFIGS, ROOM_CONFIG_MAP } from '../campus/roomConfig';
import { getWebGLAvailability } from '../campus/webglSupport';
import { CampusErrorBoundary } from '../campus/CampusErrorBoundary';
import styles from './CampusPage.module.css';

// Lazy-load 3D scene so Three.js is not loaded unless 3D is active
const CampusScene = lazy(() =>
  import('../campus/CampusScene').then((m) => ({ default: m.CampusScene }))
);

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<
  string,
  React.FC<{
    size?: number;
    color?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
  }>
> = { Mail, Monitor, Network, Search, Lock };

// ── OS Reduced Motion Hook ────────────────────────────────────────────────────

function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  return prefersReduced;
}

// ── 3D Scene Wrapper ──────────────────────────────────────────────────────────

interface SceneWrapperProps {
  reducedMotion: boolean;
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onContextLost: () => void;
  onError: (error: Error) => void;
}

const SceneWrapper: React.FC<SceneWrapperProps> = ({
  reducedMotion,
  selectedRoomId,
  onSelectRoom,
  onContextLost,
  onError,
}) => (
  <div
    className={styles.sceneContainer}
    role="region"
    aria-label="Interactive 3D campus view"
  >
    <CampusErrorBoundary
      fallback={(err, retry) => (
        <div className={styles.sceneErrorFallback} role="alert">
          <AlertTriangle size={20} color="#f59e0b" aria-hidden="true" />
          <div className={styles.sceneErrorBody}>
            <p className={styles.sceneErrorText}>
              3D campus scene failed to render ({err.message || 'Runtime error'}).
            </p>
            <button
              type="button"
              className={styles.retryBtn}
              onClick={retry}
            >
              Retry 3D view
            </button>
          </div>
        </div>
      )}
      onError={onError}
    >
      <Suspense
        fallback={
          <div className={styles.sceneLoading}>
            <div className={styles.sceneLoadingDot} />
            <span>Loading 3D campus…</span>
          </div>
        }
      >
        <CampusScene
          reducedMotion={reducedMotion}
          selectedRoomId={selectedRoomId}
          onSelectRoom={onSelectRoom}
          onContextLost={onContextLost}
        />
      </Suspense>
    </CampusErrorBoundary>
  </div>
);

// ── Main Page Component ───────────────────────────────────────────────────────

export const CampusPage: React.FC = () => {
  const { profile, progress, updateSettings } = useCyberStore();
  const { settings } = profile;

  const osReducedMotion = usePrefersReducedMotion();
  const effectiveReducedMotion = settings.reducedMotion || osReducedMotion;

  // Single-probe WebGL check, cached module-wide
  const isWebGLSupported = useMemo(() => getWebGLAvailability(), []);

  // Temporary runtime failure state (kept separate from user's persistent preferences)
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // Selected room for detailed HTML panel
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Derive 3D visibility: enabled only if WebGL is supported, low-performance mode is off, and no runtime error
  const show3D =
    isWebGLSupported && !settings.lowPerformanceMode && !runtimeError;

  const toggle3D = useCallback(() => {
    if (!isWebGLSupported) return;

    if (show3D) {
      // Switching to 2D: persist lowPerformanceMode: true
      updateSettings({ lowPerformanceMode: true });
    } else {
      // Switching to 3D: clear runtime error and persist lowPerformanceMode: false
      setRuntimeError(null);
      updateSettings({ lowPerformanceMode: false });
    }
  }, [isWebGLSupported, show3D, updateSettings]);

  const handleRetry = useCallback(() => {
    setRuntimeError(null);
  }, []);

  const handleSelectRoom = useCallback((roomId: string) => {
    setSelectedRoomId(roomId);
  }, []);

  // Compute selected room details if active
  const selectedRoom = selectedRoomId ? ROOM_CONFIG_MAP[selectedRoomId] : null;
  const selectedPassedCount = useMemo(() => {
    if (!selectedRoom) return 0;
    return progress.portfolio.filter(
      (e) =>
        (selectedRoom.challengeIds as string[]).includes(e.challengeId) &&
        e.passedAt !== null
    ).length;
  }, [selectedRoom, progress.portfolio]);

  const SelectedIcon = selectedRoom ? ICON_MAP[selectedRoom.icon] : null;

  return (
    <div
      className={styles.page}
      data-reduced-motion={effectiveReducedMotion ? 'true' : 'false'}
    >
      {/* ── Header ── */}
      <header className={styles.header}>
        <span className={styles.pill}>
          <Building2 size={12} aria-hidden="true" />
          Campus Map
        </span>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Choose a Room</h1>
            <p className={styles.subtitle}>
              Five rooms · fifteen challenges — select a room to begin.
            </p>
          </div>
          {/* 3D / 2D toggle button */}
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={toggle3D}
            disabled={!isWebGLSupported}
            title={
              !isWebGLSupported
                ? '3D view is unavailable on this device or browser'
                : show3D
                  ? 'Switch to 2D map'
                  : 'Switch to 3D view'
            }
            aria-label={
              !isWebGLSupported
                ? '3D view unavailable (WebGL not supported)'
                : show3D
                  ? 'Switch to 2D map'
                  : 'Switch to 3D view'
            }
            aria-pressed={show3D}
          >
            {show3D ? (
              <>
                <Map size={14} aria-hidden="true" />
                Use 2D Map
              </>
            ) : (
              <>
                <Layers size={14} aria-hidden="true" />
                Use 3D View
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Fallback message when 3D encountered a runtime error ── */}
      {runtimeError && (
        <div className={styles.fallbackNotice} role="status">
          <AlertTriangle size={18} color="#f59e0b" aria-hidden="true" />
          <span className={styles.fallbackNoticeText}>
            3D campus view is unavailable ({runtimeError}). Showing 2D navigation.
          </span>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={handleRetry}
          >
            Retry 3D View
          </button>
        </div>
      )}

      {/* ── 3D Campus scene (mounted only when 3D is active) ── */}
      {show3D && (
        <SceneWrapper
          reducedMotion={effectiveReducedMotion}
          selectedRoomId={selectedRoomId}
          onSelectRoom={handleSelectRoom}
          onContextLost={() =>
            setRuntimeError('WebGL graphics context was lost')
          }
          onError={(err) =>
            setRuntimeError(err.message || 'Scene initialization error')
          }
        />
      )}

      {/* ── Selected Room Panel (shown when user selects a building in 3D or 2D) ── */}
      {selectedRoom && SelectedIcon && (
        <aside
          className={styles.selectedRoomPanel}
          role="region"
          aria-label={`${selectedRoom.title} details`}
          style={
            {
              '--room-accent': selectedRoom.accent,
              '--room-accent-dim': selectedRoom.accentDim,
            } as React.CSSProperties
          }
        >
          <div className={styles.panelHeader}>
            <div className={styles.panelIcon} aria-hidden="true">
              <SelectedIcon size={24} color={selectedRoom.accent} />
            </div>
            <div className={styles.panelTitleBlock}>
              <div className={styles.panelMetaRow}>
                <span
                  className={styles.panelTag}
                  style={{ background: selectedRoom.accent }}
                >
                  Selected Room
                </span>
                <span className={styles.panelCount}>
                  {selectedPassedCount}/3 completed
                </span>
              </div>
              <h2 className={styles.panelTitle}>{selectedRoom.title}</h2>
            </div>
            <button
              type="button"
              className={styles.closePanelBtn}
              onClick={() => setSelectedRoomId(null)}
              aria-label="Close room details panel"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <p className={styles.panelDesc}>{selectedRoom.description}</p>

          <div className={styles.panelActions}>
            <Link
              to={`/room/${selectedRoom.id}`}
              className={styles.enterRoomBtn}
              style={{ background: selectedRoom.accent }}
            >
              <span>Enter Room</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </aside>
      )}

      {/* ── Accessible Room Navigation (all 5 links ALWAYS accessible to AT & keyboard) ── */}
      <div className={styles.content}>
        {!show3D ? (
          <nav aria-label="Campus rooms" className={styles.grid}>
            {ROOM_CONFIGS.map((room) => {
              const hasLive = (room.challengeIds as string[]).some((id) =>
                LIVE_CHALLENGE_IDS.has(id)
              );
              const passedCount = progress.portfolio.filter(
                (e) =>
                  (room.challengeIds as string[]).includes(e.challengeId) &&
                  e.passedAt !== null
              ).length;
              const IconComp = ICON_MAP[room.icon];

              if (!hasLive) {
                return (
                  <div
                    key={room.id}
                    className={`${styles.roomCard} ${styles['roomCard--locked']}`}
                    style={
                      {
                        '--room-accent': room.accent,
                        '--room-accent-dim': room.accentDim,
                      } as React.CSSProperties
                    }
                    aria-label={`${room.title} — coming soon`}
                  >
                    <div className={styles.lockOverlay} aria-hidden="true">
                      <Lock size={16} />
                    </div>

                    <div className={styles.roomCardTop}>
                      <div className={styles.roomIcon} aria-hidden="true">
                        <IconComp size={22} color={room.accent} />
                      </div>
                      <span
                        className={`${styles.roomBadge} ${styles['roomBadge--soon']}`}
                      >
                        Coming soon
                      </span>
                    </div>

                    <div>
                      <h2 className={styles.roomTitle}>{room.title}</h2>
                      <p className={styles.roomDesc}>{room.description}</p>
                    </div>

                    <div className={styles.roomFooter}>
                      <span className={styles.challengeCount}>
                        3 challenges planned
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={room.id}
                  to={`/room/${room.id}`}
                  className={styles.roomCard}
                  style={
                    {
                      '--room-accent': room.accent,
                      '--room-accent-dim': room.accentDim,
                    } as React.CSSProperties
                  }
                  aria-label={`Enter ${room.title}${
                    passedCount > 0
                      ? ` — ${passedCount} of 3 completed`
                      : ''
                  }`}
                >
                  <div className={styles.roomCardTop}>
                    <div className={styles.roomIcon} aria-hidden="true">
                      <IconComp size={22} color={room.accent} />
                    </div>
                    <span
                      className={`${styles.roomBadge} ${styles['roomBadge--live']}`}
                    >
                      {passedCount > 0 ? `${passedCount}/3 done` : 'Open'}
                    </span>
                  </div>

                  <div>
                    <h2 className={styles.roomTitle}>{room.title}</h2>
                    <p className={styles.roomDesc}>{room.description}</p>
                  </div>

                  <div className={styles.roomFooter}>
                    <span className={styles.challengeCount}>
                      {passedCount}/3 completed
                    </span>
                    <span className={styles.enterArrow} aria-hidden="true">
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav
            className={styles.roomListBelow}
            aria-label="Campus rooms navigation"
          >
            <p className={styles.roomListCaption}>
              Select a building above or open a room directly:
            </p>
            <div className={styles.roomChips}>
              {ROOM_CONFIGS.map((room) => {
                const hasLive = (room.challengeIds as string[]).some((id) =>
                  LIVE_CHALLENGE_IDS.has(id)
                );
                const passedCount = progress.portfolio.filter(
                  (e) =>
                    (room.challengeIds as string[]).includes(e.challengeId) &&
                    e.passedAt !== null
                ).length;
                const IconComp = ICON_MAP[room.icon];
                const isSelected = selectedRoomId === room.id;

                if (!hasLive) {
                  return (
                    <div
                      key={room.id}
                      className={styles.roomChip}
                      style={
                        {
                          '--room-accent': room.accent,
                          opacity: 0.45,
                        } as React.CSSProperties
                      }
                      aria-label={`${room.title} — coming soon`}
                    >
                      <IconComp
                        size={14}
                        color={room.accent}
                        aria-hidden="true"
                      />
                      <span>{room.title}</span>
                      <span
                        className={styles.chipBadge}
                        style={{ background: '#555' }}
                      >
                        Soon
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={room.id}
                    to={`/room/${room.id}`}
                    className={`${styles.roomChip} ${
                      isSelected ? styles.roomChipSelected : ''
                    }`}
                    style={
                      {
                        '--room-accent': room.accent,
                      } as React.CSSProperties
                    }
                    aria-label={`Enter ${room.title}${
                      passedCount > 0 ? ` — ${passedCount}/3 done` : ''
                    }`}
                  >
                    <IconComp
                      size={14}
                      color={room.accent}
                      aria-hidden="true"
                    />
                    <span>{room.title}</span>
                    <span
                      className={styles.chipBadge}
                      style={{ background: room.accent }}
                    >
                      {passedCount}/3
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};
