import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Monitor, Network, Search, Lock, ArrowRight, Building2 } from 'lucide-react';
import { useCyberStore } from '../store';
import { LIVE_CHALLENGE_IDS } from '../challenges';
import styles from './CampusPage.module.css';

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>> = {
  Mail, Monitor, Network, Search, Lock,
};

const ROOMS = [
  {
    id: 'phishing',
    title: 'Phishing Defense',
    description: 'Spot deceptive emails, spoofed domains, and social engineering attacks before they reach your inbox.',
    icon: 'Mail',
    accent: '#f59e0b',
    accentDim: 'rgba(245,158,11,0.12)',
    challengeIds: ['cc-ph-01', 'cc-ph-02', 'cc-ph-03'] as const,
  },
  {
    id: 'secops',
    title: 'Security Operations',
    description: 'Triage alerts, investigate suspicious logins, and reconstruct incident timelines.',
    icon: 'Monitor',
    accent: '#818cf8',
    accentDim: 'rgba(129,140,248,0.12)',
    challengeIds: ['cc-so-01', 'cc-so-02', 'cc-so-03'] as const,
  },
  {
    id: 'network',
    title: 'Network Security',
    description: 'Audit firewall rules, identify risky open ports, and detect hidden exfiltration.',
    icon: 'Network',
    accent: '#00d4ff',
    accentDim: 'rgba(0,212,255,0.12)',
    challengeIds: ['cc-nw-01', 'cc-nw-02', 'cc-nw-03'] as const,
  },
  {
    id: 'forensics',
    title: 'Digital Forensics',
    description: 'Recover deleted files, reconstruct browser history, and find data hidden in plain sight.',
    icon: 'Search',
    accent: '#22c55e',
    accentDim: 'rgba(34,197,94,0.12)',
    challengeIds: ['cc-df-01', 'cc-df-02', 'cc-df-03'] as const,
  },
  {
    id: 'privacy',
    title: 'Privacy & Account Security',
    description: 'Audit passwords, detect MFA attacks, and identify apps collecting excessive data.',
    icon: 'Lock',
    accent: '#f472b6',
    accentDim: 'rgba(244,114,182,0.12)',
    challengeIds: ['cc-pr-01', 'cc-pr-02', 'cc-pr-03'] as const,
  },
];

export const CampusPage: React.FC = () => {
  const { progress } = useCyberStore();

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <span className={styles.pill}>
            <Building2 size={12} aria-hidden="true" />
            2D Campus Map — Phase 1
          </span>
          <h1 className={styles.title}>Choose a Room</h1>
          <p className={styles.subtitle}>
            Each room contains three challenges. Explore Phishing Defense and Security Operations — the other rooms open as more challenges are built.
          </p>
        </header>

        {/* Room grid */}
        <nav aria-label="Campus rooms" className={styles.grid}>
          {ROOMS.map((room) => {
            const hasLive = (room.challengeIds as readonly string[]).some((id) =>
              LIVE_CHALLENGE_IDS.has(id)
            );
            const passedCount = progress.portfolio.filter(
              (e) => (room.challengeIds as readonly string[]).includes(e.challengeId) && e.passedAt !== null
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
      </div>
    </div>
  );
};
