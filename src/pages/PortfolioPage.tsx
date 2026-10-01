import React from 'react';
import {
  FolderKanban,
  Trophy,
  RotateCcw,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useCyberStore } from '../store';
import { CHALLENGE_MAP, ROOM_MAP } from '../challenges';
import { LinkButton } from '../components/ui/Button';
import { Badge, DifficultyBadge } from '../components/ui/Badge';
import { formatScore, formatDate } from '../utils/format';
import { getBestAttemptForChallenge } from '../utils/progress';
import styles from './PortfolioPage.module.css';

export const PortfolioPage: React.FC = () => {
  const { progress } = useCyberStore();

  // Show all attempted challenges; separate completed vs in-progress
  const attempted = progress.portfolio;
  const passed = attempted.filter((e) => e.passedAt !== null);
  const inProgress = attempted.filter((e) => e.passedAt === null);

  return (
    <div className={styles.portfolioPage}>
      {/* ── Page Header ── */}
      <header className={styles.header}>
        <div className={styles.pill}>
          <FolderKanban size={13} aria-hidden="true" />
          <span>Portfolio — Saved Locally on this Device</span>
        </div>
        <h1 className={styles.title}>Your Portfolio</h1>
        <p className={styles.subtitle}>
          Completed challenges and earned skills, stored locally in your browser. Portfolio sharing requires a future account feature.
        </p>
      </header>

      {attempted.length === 0 ? (
        <div className={styles.emptyCard}>
          <p className={styles.emptyText}>
            No challenges attempted yet. Enter the campus to start your first cybersecurity mission!
          </p>
          <LinkButton to="/campus" variant="primary" size="md">
            Enter Campus
          </LinkButton>
        </div>
      ) : (
        <>
          {/* ── Completed Challenges Section ── */}
          {passed.length > 0 && (
            <section className={styles.section} aria-labelledby="portfolio-completed-heading">
              <div className={styles.sectionHeader}>
                <h2 id="portfolio-completed-heading" className={styles.sectionTitle}>
                  Completed ({passed.length})
                </h2>
              </div>

              <div className={styles.portfolioGrid}>
                {passed.map((entry) => {
                  const ch = CHALLENGE_MAP[entry.challengeId];
                  const room = ch ? ROOM_MAP[ch.roomId] : undefined;
                  const bestAttempt = getBestAttemptForChallenge(
                    progress.attempts,
                    entry.challengeId
                  );
                  const skills =
                    entry.skillsEarned.length > 0
                      ? entry.skillsEarned
                      : (ch?.skills ?? []);

                  return (
                    <article
                      key={entry.challengeId}
                      className={`${styles.challengeCard} ${styles.challengeCardPassed}`}
                      aria-labelledby={`completed-${entry.challengeId}-title`}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderLeft}>
                          <div className={styles.badgeRow}>
                            {room && (
                              <Badge variant="default">{room.title}</Badge>
                            )}
                            {ch && (
                              <DifficultyBadge difficulty={ch.difficulty} />
                            )}
                          </div>
                          <h3
                            id={`completed-${entry.challengeId}-title`}
                            className={styles.cardTitle}
                          >
                            {ch?.title ?? entry.challengeId}
                          </h3>
                          <p className={styles.cardMeta}>
                            {entry.totalAttempts} attempt{entry.totalAttempts !== 1 ? 's' : ''}
                            {entry.passedAt && (
                              <> · Passed {formatDate(entry.passedAt)}</>
                            )}
                          </p>
                        </div>
                        <Trophy
                          size={20}
                          style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 4 }}
                          aria-hidden="true"
                        />
                      </div>

                      <div className={styles.scoreGroup}>
                        <span className={styles.scoreLabel}>Best Final Score</span>
                        <span
                          className={styles.scoreValue}
                          style={{ color: 'var(--color-success)' }}
                        >
                          {formatScore(entry.bestFinalScore)}/100
                        </span>
                      </div>

                      {skills.length > 0 && (
                        <div className={styles.skillsContainer}>
                          <span className={styles.scoreLabel}>Skills Earned</span>
                          <div className={styles.skillsList}>
                            {skills.map((skill) => (
                              <Badge key={skill} variant="accent">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={styles.cardActions}>
                        {bestAttempt && (
                          <LinkButton
                            to={`/results/${bestAttempt.id}`}
                            variant="secondary"
                            size="sm"
                            aria-label={`Review results for ${ch?.title ?? entry.challengeId}`}
                          >
                            <FileText size={13} aria-hidden="true" />
                            Review Results
                          </LinkButton>
                        )}
                        <LinkButton
                          to={`/challenge/${entry.challengeId}`}
                          variant="ghost"
                          size="sm"
                          aria-label={`Play ${ch?.title ?? entry.challengeId} again`}
                        >
                          <RotateCcw size={13} aria-hidden="true" />
                          Play Again
                        </LinkButton>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── In-Progress / Attempted Challenges Section ── */}
          {inProgress.length > 0 && (
            <section className={styles.section} aria-labelledby="portfolio-inprogress-heading">
              <div className={styles.sectionHeader}>
                <h2 id="portfolio-inprogress-heading" className={styles.sectionTitle}>
                  In Progress ({inProgress.length})
                </h2>
              </div>

              <div className={styles.portfolioGrid}>
                {inProgress.map((entry) => {
                  const ch = CHALLENGE_MAP[entry.challengeId];
                  const room = ch ? ROOM_MAP[ch.roomId] : undefined;
                  const bestAttempt = getBestAttemptForChallenge(
                    progress.attempts,
                    entry.challengeId
                  );
                  const skills = ch?.skills ?? [];

                  return (
                    <article
                      key={entry.challengeId}
                      className={`${styles.challengeCard} ${styles.challengeCardInProgress}`}
                      aria-labelledby={`inprogress-${entry.challengeId}-title`}
                    >
                      <div className={styles.cardHeader}>
                        <div className={styles.cardHeaderLeft}>
                          <div className={styles.badgeRow}>
                            {room && (
                              <Badge variant="default">{room.title}</Badge>
                            )}
                            {ch && (
                              <DifficultyBadge difficulty={ch.difficulty} />
                            )}
                          </div>
                          <h3
                            id={`inprogress-${entry.challengeId}-title`}
                            className={styles.cardTitle}
                          >
                            {ch?.title ?? entry.challengeId}
                          </h3>
                          <p className={styles.cardMeta}>
                            {entry.totalAttempts} attempt{entry.totalAttempts !== 1 ? 's' : ''} · Not yet passed
                          </p>
                        </div>
                        <AlertCircle
                          size={20}
                          style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 4 }}
                          aria-hidden="true"
                        />
                      </div>

                      <div className={styles.scoreGroup}>
                        <span className={styles.scoreLabel}>Best Score So Far</span>
                        <span
                          className={styles.scoreValue}
                          style={{ color: 'var(--color-warning)' }}
                        >
                          {formatScore(entry.bestFinalScore)}/100
                        </span>
                      </div>

                      {skills.length > 0 && (
                        <div className={styles.skillsContainer}>
                          <span className={styles.scoreLabel}>Target Skills</span>
                          <div className={styles.skillsList}>
                            {skills.map((skill) => (
                              <Badge key={skill} variant="default">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className={styles.cardActions}>
                        {bestAttempt && (
                          <LinkButton
                            to={`/results/${bestAttempt.id}`}
                            variant="secondary"
                            size="sm"
                            aria-label={`Review last results for ${ch?.title ?? entry.challengeId}`}
                          >
                            <FileText size={13} aria-hidden="true" />
                            Review Results
                          </LinkButton>
                        )}
                        <LinkButton
                          to={`/challenge/${entry.challengeId}`}
                          variant="primary"
                          size="sm"
                          aria-label={`Retry ${ch?.title ?? entry.challengeId}`}
                        >
                          <RotateCcw size={13} aria-hidden="true" />
                          Retry
                        </LinkButton>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
