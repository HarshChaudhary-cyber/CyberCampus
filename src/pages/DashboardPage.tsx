import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  Target,
  Zap,
  TrendingUp,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Mail,
  Monitor,
  Network,
  Search,
  Lock,
} from 'lucide-react';
import { useCyberStore } from '../store';
import {
  ALL_CHALLENGES,
  CHALLENGE_MAP,
  LIVE_CHALLENGE_IDS,
  ROOMS,
  ROOM_MAP,
} from '../challenges';
import { LinkButton } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatScore, formatDate } from '../utils/format';
import {
  calculateProgressStats,
  getDeterministicRecommendation,
} from '../utils/progress';
import styles from './DashboardPage.module.css';

const ROOM_ICONS: Record<string, React.FC<{ size?: number; color?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>> = {
  Mail,
  Monitor,
  Network,
  Search,
  Lock,
};

const ROOM_ACCENTS: Record<string, string> = {
  phishing: '#00d4ff',
  secops: '#a855f7',
  network: '#22c55e',
  forensics: '#eab308',
  privacy: '#f97316',
};

export const DashboardPage: React.FC = () => {
  const { progress, profile } = useCyberStore();

  // ── Derive live challenge totals and unique completion from registry ───────
  const liveChallenges = useMemo(
    () => ALL_CHALLENGES.filter((c) => LIVE_CHALLENGE_IDS.has(c.id)),
    []
  );

  const {
    totalChallenges,
    totalPassed,
    completionPercent,
    isCampusComplete,
    completedIds: completedLiveChallengeIds,
  } = useMemo(
    () => calculateProgressStats(progress.portfolio, liveChallenges),
    [progress.portfolio, liveChallenges]
  );

  const totalAttempts = progress.attempts.length;
  const skillCount = Object.keys(progress.skillTags).length;
  const isEmptyState = totalAttempts === 0;

  // ── Deterministic "Continue Learning" recommendation ───────────────────────
  const { recommendedChallenge, isResume } = useMemo(
    () =>
      getDeterministicRecommendation(
        progress.attempts,
        progress.portfolio,
        liveChallenges
      ),
    [progress.attempts, progress.portfolio, liveChallenges]
  );

  // Recent attempts (last 5)
  const recentAttempts = useMemo(
    () => [...progress.attempts].reverse().slice(0, 5),
    [progress.attempts]
  );

  return (
    <div className={styles.dashboardPage}>
      {/* ── Page Header ── */}
      <header className={styles.header}>
        <span className={styles.pill}>
          <LayoutDashboard size={12} aria-hidden="true" />
          Progress Dashboard
        </span>
        <h1 className={styles.title}>
          {profile.displayName
            ? `Welcome back, ${profile.displayName}`
            : 'Your Progress'}
        </h1>
        <p className={styles.subtitle}>
          Track your learning across all five CyberCampus rooms and fifteen challenge simulations.
        </p>
      </header>

      {/* ── Stat Cards ── */}
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <Target size={18} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
          <div>
            <div className={styles.statValue} style={{ color: 'var(--color-accent)' }}>
              {totalAttempts}
            </div>
            <div className={styles.statLabel}>Attempts</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <Trophy size={18} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
          <div>
            <div className={styles.statValue} style={{ color: 'var(--color-success)' }}>
              {totalPassed}
            </div>
            <div className={styles.statLabel}>
              Challenges Passed ({totalPassed}/{totalChallenges})
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <Zap size={18} style={{ color: 'var(--color-warning)' }} aria-hidden="true" />
          <div>
            <div className={styles.statValue} style={{ color: 'var(--color-warning)' }}>
              {skillCount}
            </div>
            <div className={styles.statLabel}>Skills Practised</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <TrendingUp size={18} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
          <div>
            <div className={styles.statValue} style={{ color: 'var(--color-accent)' }}>
              {completionPercent}%
            </div>
            <div className={styles.statLabel}>Campus Completion</div>
          </div>
        </div>
      </div>

      {/* ── Dynamic State Banners (Empty State / Campus Complete / Continue Learning) ── */}
      {isEmptyState ? (
        <section
          className={`${styles.bannerCard} ${styles.bannerCardEmpty}`}
          aria-label="Get started with your first challenge"
        >
          <Sparkles size={28} color="#818cf8" aria-hidden="true" />
          <h2 className={styles.bannerTitle}>Begin Your Cybersecurity Training</h2>
          <p className={styles.bannerDesc} style={{ maxWidth: '540px' }}>
            Welcome to CyberCampus! Learn foundational cybersecurity skills through hands-on,
            guided simulation challenges across five specialized rooms.
          </p>
          <div className={styles.bannerActions} style={{ justifyContent: 'center', marginTop: 'var(--space-2)' }}>
            <LinkButton to="/challenge/cc-ph-01" variant="primary">
              Start First Challenge: The Suspicious Invoice
            </LinkButton>
            <LinkButton to="/campus" variant="secondary">
              Explore Campus Map
            </LinkButton>
          </div>
        </section>
      ) : isCampusComplete ? (
        <section
          className={`${styles.bannerCard} ${styles.bannerCardComplete}`}
          aria-label="Campus complete celebration"
        >
          <div className={styles.bannerHeader}>
            <Trophy size={28} color="#22c55e" className={styles.bannerHeaderIcon} aria-hidden="true" />
            <div>
              <h2 className={styles.bannerTitle}>Campus Complete!</h2>
              <p className={styles.bannerDesc}>
                Outstanding work! You have solved all {totalChallenges} live challenges across all
                five campus rooms. All verified skill badges are recorded in your local portfolio.
              </p>
            </div>
          </div>
          <div className={styles.bannerActions}>
            <LinkButton to="/portfolio" variant="primary">
              View Verified Portfolio
            </LinkButton>
            <LinkButton to="/campus" variant="secondary">
              Replay Any Room
            </LinkButton>
          </div>
        </section>
      ) : recommendedChallenge ? (
        <section
          className={`${styles.bannerCard} ${styles.bannerCardRecommend}`}
          aria-label="Continue learning recommendation"
        >
          <div className={styles.bannerHeader}>
            {isResume ? (
              <RotateCcw size={24} color="#00d4ff" className={styles.bannerHeaderIcon} aria-hidden="true" />
            ) : (
              <ArrowRight size={24} color="#00d4ff" className={styles.bannerHeaderIcon} aria-hidden="true" />
            )}
            <div>
              <h2 className={styles.bannerTitle}>
                {isResume ? 'Continue Investigation' : 'Next Recommended Challenge'}
              </h2>
              <p className={styles.bannerDesc}>
                <strong>{recommendedChallenge.title}</strong> · {ROOM_MAP[recommendedChallenge.roomId]?.title ?? recommendedChallenge.roomId} ({recommendedChallenge.difficulty})
                <br />
                {isResume
                  ? 'You previously attempted this challenge. Return to complete the investigation and earn the room skill badge.'
                  : recommendedChallenge.briefing.slice(0, 160) + '…'}
              </p>
            </div>
          </div>
          <div className={styles.bannerActions}>
            <LinkButton to={`/challenge/${recommendedChallenge.id}`} variant="primary">
              {isResume ? 'Resume Challenge' : 'Start Challenge'}
            </LinkButton>
            <LinkButton to={`/room/${recommendedChallenge.roomId}`} variant="secondary">
              View Room
            </LinkButton>
          </div>
        </section>
      ) : null}

      {/* ── Room Progress (Five Rooms) ── */}
      <section className={styles.section} aria-label="Room progress breakdown">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Room Progress</h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
            Five Specialized Wings
          </span>
        </div>
        <div className={styles.roomGrid}>
          {ROOMS.map((room) => {
            const Icon = ROOM_ICONS[room.icon] ?? Monitor;
            const accent = ROOM_ACCENTS[room.id] ?? '#00d4ff';
            const roomLiveIds = room.challengeIds.filter((id) => LIVE_CHALLENGE_IDS.has(id));
            const roomTotal = roomLiveIds.length;
            const roomPassedCount = roomLiveIds.filter((id) => completedLiveChallengeIds.has(id)).length;
            const roomPercent = roomTotal > 0 ? Math.round((roomPassedCount / roomTotal) * 100) : 0;
            const isRoomComplete = roomTotal > 0 && roomPassedCount === roomTotal;

            return (
              <div
                key={room.id}
                className={styles.roomCard}
                style={{ '--room-accent': accent } as React.CSSProperties}
              >
                <div className={styles.roomCardTop}>
                  <div className={styles.roomIconBox} aria-hidden="true">
                    <Icon size={20} color={accent} />
                  </div>
                  <div>
                    <h3 className={styles.roomCardTitle}>{room.title}</h3>
                    <p className={styles.roomCardSub}>
                      {roomPassedCount} of {roomTotal} completed {isRoomComplete && '✓'}
                    </p>
                  </div>
                </div>

                <div
                  className={styles.progressBarTrack}
                  role="progressbar"
                  aria-valuenow={roomPassedCount}
                  aria-valuemin={0}
                  aria-valuemax={roomTotal}
                  aria-label={`${room.title} completion: ${roomPassedCount} of ${roomTotal} challenges`}
                >
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${roomPercent}%` }}
                  />
                </div>

                <div className={styles.roomCardFooter}>
                  <span className={styles.roomCardCount}>
                    {roomPercent}% complete
                  </span>
                  <LinkButton to={`/room/${room.id}`} variant="ghost" size="sm" aria-label={`Enter ${room.title}`}>
                    Enter Room →
                  </LinkButton>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Skills Practised ── */}
      {skillCount > 0 && (
        <section className={styles.section} aria-label="Simulation skills practised">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Simulation Skills Practised ({skillCount})</h2>
          </div>
          <div className={styles.skillBadgeList}>
            {Object.entries(progress.skillTags).map(([skill, count]) => (
              <Badge key={skill} variant="accent">
                {skill} ×{count}
              </Badge>
            ))}
          </div>
          <p className={styles.disclaimerText}>
            * Skills practised reflect completed hands-on simulation exercises in CyberCampus.
            These demonstrate interactive learning task completion and do not imply formal
            certification or professional qualification.
          </p>
        </section>
      )}

      {/* ── Recent Attempts ── */}
      {recentAttempts.length > 0 && (
        <section className={styles.section} aria-label="Recent challenge attempts">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Attempts</h2>
            <Link to="/portfolio" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', textDecoration: 'none' }}>
              View All in Portfolio →
            </Link>
          </div>
          <div className={styles.attemptList}>
            {recentAttempts.map((attempt) => {
              const ch = CHALLENGE_MAP[attempt.challengeId];
              const title = ch?.title ?? attempt.challengeId;
              const formattedScore = formatScore(attempt.finalScore);
              const timestamp = attempt.completedAt ?? attempt.startedAt;

              return (
                <Link
                  key={attempt.id}
                  to={`/results/${attempt.id}`}
                  className={styles.attemptRow}
                  aria-label={`View attempt result for ${title}: score ${formattedScore} out of 100, ${attempt.passed ? 'passed' : 'failed'}`}
                >
                  <div className={styles.attemptMeta}>
                    <div className={styles.attemptTitle}>{title}</div>
                    <div className={styles.attemptTime}>{formatDate(timestamp)}</div>
                  </div>
                  <div className={styles.attemptScoreGroup}>
                    <span
                      className={styles.attemptScore}
                      style={{
                        color: attempt.passed
                          ? 'var(--color-success)'
                          : 'var(--color-danger)',
                      }}
                    >
                      {formattedScore}/100
                    </span>
                    <Badge variant={attempt.passed ? 'success' : 'danger'}>
                      {attempt.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Page Footer Actions ── */}
      <footer className={styles.footerActions}>
        <LinkButton to="/campus" variant="primary">
          Enter Campus
        </LinkButton>
        <LinkButton to="/portfolio" variant="secondary">
          View Portfolio
        </LinkButton>
      </footer>
    </div>
  );
};
