import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Trophy, Target, Zap, TrendingUp } from 'lucide-react';
import { useCyberStore } from '../store';
import { CHALLENGE_MAP } from '../challenges';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import styles from './pages.module.css';

export const DashboardPage: React.FC = () => {
  const { progress, profile } = useCyberStore();

  const totalAttempts = progress.attempts.length;
  const totalPassed = progress.portfolio.filter((e) => e.passedAt !== null).length;
  const skillCount = Object.keys(progress.skillTags).length;
  const totalChallenges = 15; // launch count

  // Recent attempts (last 5)
  const recentAttempts = [...progress.attempts].reverse().slice(0, 5);

  return (
    <div className={styles.page}>
      <span className={styles.tag}>
        <LayoutDashboard size={12} style={{ display: 'inline', verticalAlign: 'middle' }} aria-hidden="true" />
        {' '}Progress Dashboard
      </span>
      <h1 className={styles.heading}>
        {profile.displayName ? `Welcome back, ${profile.displayName}` : 'Your Progress'}
      </h1>
      <p className={styles.sub}>
        Track your learning across all CyberCampus rooms and challenges.
      </p>

      {/* ── Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 'var(--space-4)',
        width: '100%',
        maxWidth: '800px',
        marginTop: 'var(--space-6)',
      }}>
        {[
          { icon: Target,   label: 'Attempts',          value: totalAttempts,                 color: 'var(--color-accent)' },
          { icon: Trophy,   label: 'Challenges Passed',  value: totalPassed,                   color: 'var(--color-success)' },
          { icon: Zap,      label: 'Skills Practised',   value: skillCount,                    color: 'var(--color-warning)' },
          { icon: TrendingUp, label: 'Completion',       value: `${Math.round((totalPassed / totalChallenges) * 100)}%`, color: 'var(--color-accent)' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}>
            <Icon size={18} style={{ color }} aria-hidden="true" />
            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
                {value}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Skill tags ── */}
      {skillCount > 0 && (
        <div style={{ marginTop: 'var(--space-6)', width: '100%', maxWidth: '800px' }}>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-3)' }}>
            Skills Practised
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {Object.entries(progress.skillTags).map(([skill, count]) => (
              <Badge key={skill} variant="accent">
                {skill} ×{count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent attempts ── */}
      {recentAttempts.length > 0 && (
        <div style={{ marginTop: 'var(--space-6)', width: '100%', maxWidth: '800px' }}>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-3)' }}>
            Recent Attempts
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {recentAttempts.map((attempt) => {
              const ch = CHALLENGE_MAP[attempt.challengeId];
              return (
                <Link
                  key={attempt.id}
                  to={`/results/${attempt.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-4)',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: 'var(--color-text-primary)',
                    transition: 'border-color 200ms',
                    gap: 'var(--space-4)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-accent)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = ''; }}
                  aria-label={`View results for ${ch?.title ?? attempt.challengeId}`}
                >
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                      {ch?.title ?? attempt.challengeId}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {new Date(attempt.completedAt ?? attempt.startedAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      color: attempt.passed ? 'var(--color-success)' : 'var(--color-danger)',
                    }}>
                      {attempt.finalScore}/100
                    </span>
                    <Badge variant={attempt.passed ? 'success' : 'danger'}>
                      {attempt.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CTA ── */}
      <div className={styles.actions} style={{ marginTop: 'var(--space-8)' }}>
        <Link to="/campus">
          <Button variant="primary">Enter Campus</Button>
        </Link>
        <Link to="/portfolio">
          <Button variant="secondary">View Portfolio</Button>
        </Link>
      </div>
    </div>
  );
};
