import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Trophy, RotateCcw } from 'lucide-react';
import { useCyberStore } from '../store';
import { CHALLENGE_MAP } from '../challenges';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import styles from './pages.module.css';

export const PortfolioPage: React.FC = () => {
  const { progress } = useCyberStore();

  // Show all attempted challenges; show pass status
  const attempted = progress.portfolio;
  const passed = attempted.filter((e) => e.passedAt !== null);
  const inProgress = attempted.filter((e) => e.passedAt === null);

  return (
    <div className={styles.page}>
      <span className={styles.tag}>
        <FolderKanban size={12} style={{ display: 'inline', verticalAlign: 'middle' }} aria-hidden="true" />
        {' '}Portfolio — Saved Locally on this Device
      </span>
      <h1 className={styles.heading}>Your Portfolio</h1>
      <p className={styles.sub}>
        Completed challenges and earned skills, stored locally. Portfolio sharing requires a future account feature.
      </p>

      {attempted.length === 0 ? (
        <div style={{ marginTop: 'var(--space-8)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
            No challenges attempted yet. Head to the campus to get started!
          </p>
          <Link to="/campus">
            <Button variant="primary">Enter Campus</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Passed */}
          {passed.length > 0 && (
            <section style={{ width: '100%', maxWidth: '900px', marginTop: 'var(--space-8)' }} aria-label="Completed challenges">
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                Completed ({passed.length})
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                {passed.map((entry) => {
                  const ch = CHALLENGE_MAP[entry.challengeId];
                  return (
                    <article
                      key={entry.challengeId}
                      style={{
                        background: 'var(--color-surface)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-4)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                        <div>
                          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
                            {ch?.title ?? entry.challengeId}
                          </h2>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {entry.totalAttempts} attempt{entry.totalAttempts !== 1 ? 's' : ''}
                            {entry.passedAt && (
                              <> · Passed {new Date(entry.passedAt).toLocaleDateString()}</>
                            )}
                          </p>
                        </div>
                        <Trophy size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-success)' }}>
                          Best: {entry.bestFinalScore}/100
                        </span>
                        <Link to={`/challenge/${entry.challengeId}`}>
                          <Button variant="ghost" size="sm" aria-label={`Play ${ch?.title ?? entry.challengeId} again`}>
                            <RotateCcw size={13} aria-hidden="true" />
                            Play Again
                          </Button>
                        </Link>
                      </div>

                      {entry.skillsEarned.length > 0 && (
                        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          {entry.skillsEarned.map((skill) => (
                            <Badge key={skill} variant="accent">{skill}</Badge>
                          ))}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {/* In Progress */}
          {inProgress.length > 0 && (
            <section style={{ width: '100%', maxWidth: '900px', marginTop: 'var(--space-8)' }} aria-label="In-progress challenges">
              <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                In Progress ({inProgress.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {inProgress.map((entry) => {
                  const ch = CHALLENGE_MAP[entry.challengeId];
                  return (
                    <div key={entry.challengeId} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 'var(--space-4)',
                      padding: 'var(--space-4)',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                          {ch?.title ?? entry.challengeId}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          Best so far: {entry.bestFinalScore}/100 · {entry.totalAttempts} attempt{entry.totalAttempts !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <Link to={`/challenge/${entry.challengeId}`}>
                        <Button variant="secondary" size="sm">Retry</Button>
                      </Link>
                    </div>
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
