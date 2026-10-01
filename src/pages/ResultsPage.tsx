import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Award, RotateCcw, LayoutDashboard, FolderKanban, AlertCircle,
} from 'lucide-react';
import { useCyberStore } from '../store';
import { loadChallenge, getLoadedChallenge } from '../challenges';
import { getCorrectAnswerDisplay } from '../challenges/evaluator';
import { Button, LinkButton } from '../components/ui/Button';
import { HintDrawer } from '../components/ui/HintDrawer';
import { formatScore } from '../utils/format';
import styles from './ResultsPage.module.css';
import type { Challenge, Step, StepResponse } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatSubmitted(
  submitted: StepResponse['submitted'],
  step: Step
): string {
  if (step.interaction === 'flag-selection') {
    const obj = (typeof submitted === 'object' && submitted !== null && !Array.isArray(submitted))
      ? (submitted as Record<string, boolean>)
      : {};
    const flagged = step.items
      .filter((it) => obj[it.id])
      .map((it) => it.label);
    return flagged.length ? flagged.join('; ') : 'Nothing flagged';
  }
  if (step.interaction === 'single-choice') {
    const chosen = typeof submitted === 'string' ? submitted : '';
    const item = step.items.find((it) => it.id === chosen);
    return item?.label ?? chosen ?? '—';
  }
  if (step.interaction === 'multi-choice') {
    const chosen = Array.isArray(submitted) ? submitted : [];
    const items = step.items.filter((it) => chosen.includes(it.id));
    return items.map((it) => it.label).join(', ') || '—';
  }
  if (step.interaction === 'classification') {
    if (typeof submitted === 'object' && submitted !== null && !Array.isArray(submitted)) {
      const obj = submitted as Record<string, string>;
      return step.items
        .map((it) => `${it.label} → ${obj[it.id] ?? 'Unclassified'}`)
        .join('\n');
    }
  }
  return String(submitted) || '—';
}

function getStepScoreClass(earned: number, max: number): string {
  if (earned === max) return styles['stepScore--full'];
  if (earned > 0) return styles['stepScore--partial'];
  return styles['stepScore--zero'];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const ResultsPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { progress } = useCyberStore();

  // Look up the attempt from the store (survives page refresh)
  const attempt = progress.attempts.find((a) => a.id === attemptId);

  const [challenge, setChallenge] = useState<Challenge | null>(() =>
    attempt ? (getLoadedChallenge(attempt.challengeId) ?? null) : null
  );

  useEffect(() => {
    if (attempt?.challengeId && !challenge) {
      loadChallenge(attempt.challengeId).then((loaded) => {
        if (loaded) setChallenge(loaded);
      });
    }
  }, [attempt?.challengeId, challenge]);

  // If the ID is simply invalid show a friendly error
  if (!attempt) {
    return (
      <div className={styles.notFound}>
        <AlertCircle size={48} style={{ color: 'var(--color-danger)' }} aria-hidden="true" />
        <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>Attempt Not Found</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          This attempt ID ({attemptId}) doesn't exist or belongs to a different device.
        </p>
        <LinkButton to="/campus" variant="primary">Back to Campus</LinkButton>
      </div>
    );
  }

  // Challenge data may theoretically be unavailable if we ever remove it,
  // but we can still show score from the stored attempt.
  const passed = attempt.passed;
  const portfolioEntry = progress.portfolio.find((e) => e.challengeId === attempt.challengeId);
  const isFirstPass = passed && portfolioEntry?.passedAt === attempt.completedAt;

  const handleRetry = () => {
    navigate(`/challenge/${attempt.challengeId}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* ── Hero ── */}
        <div className={`${styles.hero} ${passed ? styles['hero--passed'] : styles['hero--failed']}`}>
          <div className={styles.heroIcon}>
            {passed
              ? <CheckCircle2 size={56} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
              : <XCircle size={56} style={{ color: 'var(--color-danger)' }} aria-hidden="true" />
            }
          </div>

          <h1 className={`${styles.heroTitle} ${passed ? styles['heroTitle--passed'] : styles['heroTitle--failed']}`}>
            {passed ? 'Challenge Passed!' : 'Not Quite — Try Again'}
          </h1>

          {/* Score */}
          <div className={styles.scoreRow}>
            <span className={`${styles.scoreMain} ${passed ? styles['scoreMain--passed'] : styles['scoreMain--failed']}`}>
              {formatScore(attempt.finalScore)}
            </span>
            <span className={styles.scoreDenom}>/100</span>
          </div>

          {/* Breakdown */}
          <div className={styles.scoreBreakdown} aria-label="Score breakdown">
            <span className={styles.breakdownItem}>
              Earned: {formatScore(attempt.earnedScore)}/100
            </span>
            {attempt.hintsUsed > 0 && (
              <span className={`${styles.breakdownItem} ${styles.breakdownNeg}`}>
                Hints: −{attempt.hintsUsed * 10} pts ({attempt.hintsUsed} used)
              </span>
            )}
            {challenge && (
              <span className={styles.breakdownItem}>
                Threshold: {challenge.passThreshold}/100 to pass
              </span>
            )}
          </div>
        </div>

        {/* ── Explanation ── */}
        {challenge && (
          <div className={styles.explanation} role="region" aria-label="Explanation">
            <h2 className={styles.explanationTitle}>
              {passed ? '✅ What you got right' : '📘 What to look for'}
            </h2>
            <p className={styles.explanationText}>
              {passed ? challenge.successExplanation : challenge.failureExplanation}
            </p>
          </div>
        )}

        {/* ── Skill badges earned ── */}
        {passed && isFirstPass && challenge && (
          <div className={styles.skillsEarned} role="region" aria-label="Skills earned">
            <p className={styles.skillsTitle}>
              <Award size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} aria-hidden="true" />
              Skills Earned
            </p>
            <div className={styles.skillsList}>
              {challenge.skills.map((skill) => (
                <span key={skill} className={styles.skillBadge}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Per-step breakdown ── */}
        {challenge && (
          <section className={styles.stepBreakdown} aria-label="Step-by-step breakdown">
            <p className={styles.stepBreakdownTitle}>Step Breakdown</p>
            {challenge.steps.map((step, i) => {
              const resp = attempt.stepResponses.find((r) => r.stepId === step.id);
              const earned = resp?.pointsEarned ?? 0;
              const correct = getCorrectAnswerDisplay(step);
              const submitted = resp
                ? formatSubmitted(resp.submitted, step)
                : '—';
              const isCorrect = earned === step.pointValue;
              const isPartial = earned > 0 && earned < step.pointValue;

              return (
                <div key={step.id} className={styles.stepResult}>
                  <div className={styles.stepResultHeader}>
                    <div className={styles.stepResultTitle}>
                      {isCorrect
                        ? <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
                        : isPartial
                          ? <AlertCircle size={16} style={{ color: 'var(--color-warning)' }} aria-hidden="true" />
                          : <XCircle size={16} style={{ color: 'var(--color-danger)' }} aria-hidden="true" />
                      }
                      Step {i + 1}: {step.prompt.slice(0, 60)}{step.prompt.length > 60 ? '…' : ''}
                    </div>
                    <span className={`${styles.stepScore} ${getStepScoreClass(earned, step.pointValue)}`}>
                      {formatScore(earned)}/{formatScore(step.pointValue)} pts
                    </span>
                  </div>

                  <div className={styles.stepResultBody}>
                    <div className={styles.answerRow}>
                      <span className={styles.answerLabel}>Yours</span>
                      <span className={`${styles.answerText} ${isCorrect ? styles['answerText--correct'] : styles['answerText--incorrect']}`}>
                        {submitted}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div className={styles.answerRow}>
                        <span className={styles.answerLabel}>Correct</span>
                        <span className={`${styles.answerText} ${styles['answerText--correct']}`}>
                          {correct}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ── All hints in review mode ── */}
        {challenge && attempt.hintsUsed > 0 && (
          <HintDrawer
            hints={challenge.hints}
            revealedCount={challenge.hints.length}
            onRevealHint={() => {/* review mode — no-op */}}
            reviewMode
          />
        )}

        {/* ── Actions ── */}
        <div className={styles.actions}>
          <Button variant="ghost" size="md" onClick={handleRetry} aria-label="Retry this challenge">
            <RotateCcw size={15} aria-hidden="true" />
            {passed ? 'Play Again' : 'Retry'}
          </Button>
          <LinkButton to="/dashboard" variant="secondary" size="md" aria-label="Go to dashboard">
            <LayoutDashboard size={15} aria-hidden="true" />
            Dashboard
          </LinkButton>
          <LinkButton to="/portfolio" variant="primary" size="md" aria-label="View portfolio">
            <FolderKanban size={15} aria-hidden="true" />
            Portfolio
          </LinkButton>
        </div>
      </div>
    </div>
  );
};
