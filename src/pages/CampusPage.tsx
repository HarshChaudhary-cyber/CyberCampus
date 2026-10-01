// ============================================================
// CyberCampus — CampusPage
// Shows an interactive 3D campus scene (lazy-loaded) with an
// accessible 2D room list always visible below.
// Toggle between 3D and 2D via the top-right button, or via
// Settings › Low performance mode.
// ============================================================

import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail, Monitor, Network, Search, Lock,
  ArrowRight, Building2, Layers, Map,
} from 'lucide-react';
import { useCyberStore } from '../store';
import { LIVE_CHALLENGE_IDS } from '../challenges';
import { ROOM_CONFIGS } from '../campus/roomConfig';
import styles from './CampusPage.module.css';

// Lazy-load the heavy 3D scene so Three.js never enters the landing page bundle.
const CampusScene = lazy(() =>
  import('../campus/CampusScene').then((m) => ({ default: m.CampusScene }))
);

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<
  string,
  React.FC<{ size?: number; color?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>
> = { Mail, Monitor, Network, Search, Lock };

// ── WebGL probe ───────────────────────────────────────────────────────────────

function webGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// ── 3D Scene wrapper ──────────────────────────────────────────────────────────

const SceneWrapper: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => (
  <div className={styles.sceneContainer} role="img" aria-label="Interactive 3D campus map — click a building to enter that room">
    <Suspense
      fallback={
        <div className={styles.sceneLoading}>
          <div className={styles.sceneLoadingDot} />
          <span>Rendering campus…</span>
        </div>
      }
    >
      <CampusScene reducedMotion={reducedMotion} />
    </Suspense>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

export const CampusPage: React.FC = () => {
  const { profile, progress, updateSettings } = useCyberStore();
  const { settings } = profile;

  // 3D is on by default if WebGL is available and low-performance mode is off
  const [show3D, setShow3D] = useState<boolean>(() => {
    if (settings.lowPerformanceMode) return false;
    return webGLAvailable();
  });

  // Keep show3D in sync when lowPerformanceMode changes from Settings page
  useEffect(() => {
    if (settings.lowPerformanceMode) setShow3D(false);
  }, [settings.lowPerformanceMode]);

  const toggle3D = () => {
    const next = !show3D;
    setShow3D(next);
    // Persist the preference: switching TO 2D sets lowPerformanceMode true; TO 3D clears it
    updateSettings({ lowPerformanceMode: !next });
  };

  return (
    <div className={styles.page}>
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
          {/* 3D / 2D toggle */}
          <button
            className={styles.toggleBtn}
            onClick={toggle3D}
            aria-label={show3D ? 'Switch to 2D map' : 'Switch to 3D view'}
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

      {/* ── 3D Campus scene ── */}
      {show3D && (
        <SceneWrapper reducedMotion={settings.reducedMotion} />
      )}

      {/* ── Accessible 2D room list (always rendered for screen readers / keyboard) ── */}
      <div
        className={styles.content}
        aria-label="Room list"
        // Hide visually only when 3D is visible, but always readable by AT
        {...(show3D ? { 'aria-hidden': 'true' as const } : {})}
      >
        {!show3D && (
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
                    style={{
                      '--room-accent': room.accent,
                      '--room-accent-dim': room.accentDim,
                    } as React.CSSProperties}
                    aria-label={`${room.title} — coming soon`}
                  >
                    <div className={styles.lockOverlay} aria-hidden="true">
                      <Lock size={16} />
                    </div>

                    <div className={styles.roomCardTop}>
                      <div className={styles.roomIcon} aria-hidden="true">
                        <IconComp size={22} color={room.accent} />
                      </div>
                      <span className={`${styles.roomBadge} ${styles['roomBadge--soon']}`}>
                        Coming soon
                      </span>
                    </div>

                    <div>
                      <h2 className={styles.roomTitle}>{room.title}</h2>
                      <p className={styles.roomDesc}>{room.description}</p>
                    </div>

                    <div className={styles.roomFooter}>
                      <span className={styles.challengeCount}>3 challenges planned</span>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={room.id}
                  to={`/room/${room.id}`}
                  className={styles.roomCard}
                  style={{
                    '--room-accent': room.accent,
                    '--room-accent-dim': room.accentDim,
                  } as React.CSSProperties}
                  aria-label={`Enter ${room.title}${passedCount > 0 ? ` — ${passedCount} of 3 completed` : ''}`}
                >
                  <div className={styles.roomCardTop}>
                    <div className={styles.roomIcon} aria-hidden="true">
                      <IconComp size={22} color={room.accent} />
                    </div>
                    <span className={`${styles.roomBadge} ${styles['roomBadge--live']}`}>
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
        )}

        {/* Accessible room list also available below 3D view */}
        {show3D && (
          <section className={styles.roomListBelow} aria-label="Room navigation list">
            <p className={styles.roomListCaption}>
              ↑ Click a building in the 3D view, or use the links below:
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

                if (!hasLive) {
                  return (
                    <div
                      key={room.id}
                      className={styles.roomChip}
                      style={{
                        '--room-accent': room.accent,
                        opacity: 0.45,
                      } as React.CSSProperties}
                      aria-label={`${room.title} — coming soon`}
                    >
                      <IconComp size={14} color={room.accent} aria-hidden="true" />
                      <span>{room.title}</span>
                      <span className={styles.chipBadge} style={{ background: '#555' }}>
                        Soon
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={room.id}
                    to={`/room/${room.id}`}
                    className={styles.roomChip}
                    style={{ '--room-accent': room.accent } as React.CSSProperties}
                    aria-label={`Enter ${room.title}${passedCount > 0 ? ` — ${passedCount}/3 done` : ''}`}
                  >
                    <IconComp size={14} color={room.accent} aria-hidden="true" />
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
          </section>
        )}
      </div>
    </div>
  );
};
