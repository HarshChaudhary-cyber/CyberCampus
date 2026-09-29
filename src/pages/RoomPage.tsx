import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Mail, Monitor, Network, Search, Lock,
  ArrowLeft, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { useCyberStore } from '../store';
import { ROOMS, CHALLENGE_MAP, LIVE_CHALLENGE_IDS } from '../challenges';
import { NotFoundPage } from './NotFoundPage';
import styles from './RoomPage.module.css';

const ICON_MAP: Record<string, React.FC<{ size?: number; color?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>> = {
  Mail, Monitor, Network, Search, Lock,
};

const CHALLENGE_DESCRIPTIONS: Record<string, string> = {
  'cc-ph-01': 'Identify the three warning signs in a suspicious invoice email.',
  'cc-ph-02': 'Spot a CEO fraud attempt buried in an email chain.',
  'cc-ph-03': 'Classify three emails: two legitimate, one targeted spear-phish.',
  'cc-so-01': 'Triage 8 SIEM alerts — real threats vs false positives.',
  'cc-so-02': 'Investigate an off-hours administrative login, MFA fatigue, and rogue IAM keys.',
  'cc-so-03': 'Reconstruct a multi-system incident timeline, identify initial access, and execute containment.',
  'cc-nw-01': 'Audit listening services and public exposures on a company server.',
  'cc-nw-02': 'Audit 10 firewall rules and fix the dangerous ones.',
  'cc-nw-03': 'Find DNS tunnelling hidden in a packet trace.',
  'cc-df-01': 'Identify exfiltrated data in deleted file metadata.',
  'cc-df-02': 'Reconstruct a browser history with tampered timestamps.',
  'cc-df-03': 'Detect and decode a hidden steganography payload.',
  'cc-pr-01': 'Rank 8 passwords from weakest to strongest.',
  'cc-pr-02': 'Identify and stop an MFA fatigue attack in real time.',
  'cc-pr-03': 'Audit a privacy policy and flag data minimisation violations.',
};

export const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { progress } = useCyberStore();

  const room = roomId ? ROOMS.find((r) => r.id === roomId) : undefined;

  if (!room) return <NotFoundPage />;

  const IconComp = ICON_MAP[room.icon] ?? Mail;
  const accentColor = {
    phishing: '#f59e0b',
    secops:   '#818cf8',
    network:  '#00d4ff',
    forensics:'#22c55e',
    privacy:  '#f472b6',
  }[room.id] ?? '#00d4ff';

  return (
    <div className={`${styles.page} ${room.accentClass}`}>
      <div className={styles.content}>
        {/* Back link */}
        <Link to="/campus" className={styles.backLink}>
          <ArrowLeft size={15} aria-hidden="true" />
          Back to Campus
        </Link>

        {/* Room header */}
        <header className={styles.roomHeader}>
          <div className={styles.roomMeta}>
            <div className={styles.roomIconWrap} aria-hidden="true">
              <IconComp size={26} color={accentColor} />
            </div>
            <h1 className={styles.roomTitle}>{room.title}</h1>
          </div>
          <p className={styles.roomDesc}>{room.description ?? 'Investigate cybersecurity scenarios and sharpen your skills.'}</p>
        </header>

        {/* Challenge list */}
        <section aria-label="Challenges in this room">
          <p className={styles.sectionLabel}>Challenges</p>
          <div className={styles.challengeGrid}>
            {room.challengeIds.map((challengeId, index) => {
              const challenge = CHALLENGE_MAP[challengeId];
              const isLive = LIVE_CHALLENGE_IDS.has(challengeId);
              const portfolioEntry = progress.portfolio.find(
                (e) => e.challengeId === challengeId
              );
              const isPassed = portfolioEntry?.passedAt != null;
              const difficulty = challenge?.difficulty ?? ['beginner', 'intermediate', 'advanced'][index] as 'beginner' | 'intermediate' | 'advanced';
              const title = challenge?.title ?? 'Challenge Coming Soon';
              const description = CHALLENGE_DESCRIPTIONS[challengeId] ?? 'Details coming soon.';

              const cardClasses = [
                styles.challengeCard,
                !isLive ? styles['challengeCard--locked'] : '',
                isPassed ? styles['challengeCard--passed'] : '',
              ].filter(Boolean).join(' ');

              const cardContent = (
                <>
                  {/* Number / check */}
                  <div className={styles.cardNum} aria-hidden="true">
                    {isPassed ? (
                      <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
                    ) : (
                      String(index + 1).padStart(2, '0')
                    )}
                  </div>

                  {/* Title + description */}
                  <div className={styles.cardBody}>
                    <h2 className={styles.cardTitle}>{title}</h2>
                    <p className={styles.cardDesc}>{description}</p>
                  </div>

                  {/* Difficulty + score / lock */}
                  <div className={styles.cardRight}>
                    <span className={`${styles.diffBadge} ${styles[`diffBadge--${difficulty}`]}`}>
                      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                    </span>
                    {isLive && portfolioEntry && (
                      <span className={styles.bestScore}>
                        Best: {portfolioEntry.bestFinalScore}/100
                      </span>
                    )}
                    {!isLive && (
                      <Lock size={14} className={styles.lockIcon} aria-hidden="true" />
                    )}
                    {isLive && !portfolioEntry && (
                      <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} aria-hidden="true" />
                    )}
                  </div>
                </>
              );

              if (!isLive) {
                return (
                  <div
                    key={challengeId}
                    className={cardClasses}
                    aria-label={`${title} — coming soon`}
                    aria-disabled="true"
                  >
                    {cardContent}
                  </div>
                );
              }

              return (
                <Link
                  key={challengeId}
                  to={`/challenge/${challengeId}`}
                  className={cardClasses}
                  aria-label={`${title}${isPassed ? ' — completed' : ' — start challenge'}`}
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
