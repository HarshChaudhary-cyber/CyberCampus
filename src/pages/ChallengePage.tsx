import React, { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Mail, FileText, AlertCircle, Paperclip,
} from 'lucide-react';
import { useCyberStore } from '../store';
import { getChallenge } from '../challenges';
import { buildStepResponses } from '../challenges/evaluator';
import { HintDrawer } from '../components/ui/HintDrawer';
import { Button } from '../components/ui/Button';
import { NotFoundPage } from './NotFoundPage';
import type { EvidenceItem, Step, StepResponse } from '../types';
import styles from './ChallengePage.module.css';

// ── Evidence Viewers ──────────────────────────────────────────────────────────

type EmailContent = {
  from_display: string;
  from_address: string;
  reply_to: string;
  to: string;
  subject: string;
  date: string;
  body: string;
  link_display: string;
  link_actual: string;
  attachment: string;
};

const EmailViewer: React.FC<{ content: EmailContent }> = ({ content }) => {
  const replyDomainMismatch =
    content.reply_to.split('@')[1]?.toLowerCase() !==
    content.from_address.split('@')[1]?.toLowerCase();
  const linkMismatch = content.link_display !== content.link_actual;

  return (
    <div className={styles.emailViewer}>
      <div className={styles.emailHeader}>
        {[
          { field: 'From',     value: `${content.from_display} <${content.from_address}>` },
          { field: 'Reply-To', value: content.reply_to, warn: replyDomainMismatch },
          { field: 'To',       value: content.to },
          { field: 'Subject',  value: content.subject },
          { field: 'Date',     value: content.date },
        ].map(({ field, value, warn }) => (
          <div key={field} className={styles.emailRow}>
            <span className={styles.emailField}>{field}:</span>
            <span className={warn ? styles.emailValueWarning : styles.emailValue}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.emailBody} role="region" aria-label="Email body">
        {content.body}
      </div>

      {/* Link inspector */}
      <div className={styles.linkInspect} role="region" aria-label="Link inspection">
        <p className={styles.linkInspectLabel}>🔍 Link Inspection</p>
        <div className={styles.linkRow}>
          <span className={styles.linkRowLabel}>Displayed:</span>
          <span className={styles.linkRowDisplay}>{content.link_display}</span>
        </div>
        <div className={styles.linkRow}>
          <span className={styles.linkRowLabel}>Actual URL:</span>
          <span className={linkMismatch ? styles.linkRowActual : styles.linkRowDisplay}>
            {content.link_actual}
          </span>
        </div>
        {linkMismatch && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', marginTop: 'var(--space-2)' }}>
            ⚠ The displayed URL does not match the actual destination.
          </p>
        )}
      </div>

      {/* Attachment */}
      <div className={styles.attachmentRow} role="region" aria-label="Attachment">
        <Paperclip size={16} className={styles.attachIcon} aria-hidden="true" />
        <span className={styles.attachName}>{content.attachment}</span>
      </div>
    </div>
  );
};

type HeaderRow = { field: string; value: string };
type LogContent = { rows: HeaderRow[] };

const LogViewer: React.FC<{ content: LogContent }> = ({ content }) => (
  <div className={styles.logViewer} role="region" aria-label="Email header analysis">
    <table className={styles.logTable}>
      <thead>
        <tr>
          <th scope="col">Header Field</th>
          <th scope="col">Value</th>
        </tr>
      </thead>
      <tbody>
        {content.rows.map(({ field, value }) => {
          const isFail = value.toUpperCase().startsWith('FAIL');
          const isSoftFail = value.toUpperCase().startsWith('SOFTFAIL');
          return (
            <tr key={field}>
              <td className={styles.logField}>{field}</td>
              <td className={isFail ? styles.logFail : isSoftFail ? styles.logSoftFail : ''}>
                {value}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const EvidenceViewer: React.FC<{ item: EvidenceItem }> = ({ item }) => {
  if (item.type === 'email') return <EmailViewer content={item.content as unknown as EmailContent} />;
  if (item.type === 'log') return <LogViewer content={item.content as unknown as LogContent} />;
  return (
    <div style={{ padding: 'var(--space-4)', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
      {JSON.stringify(item.content, null, 2)}
    </div>
  );
};

// ── Interaction Widgets ───────────────────────────────────────────────────────

const FlagSelection: React.FC<{
  step: Step;
  value: Record<string, boolean>;
  onChange: (v: Record<string, boolean>) => void;
  submitted: boolean;
}> = ({ step, value, onChange, submitted }) => (
  <div className={styles.flagList} role="group" aria-label={step.prompt}>
    {step.items.map((item) => {
      const checked = Boolean(value[item.id]);
      return (
        <label
          key={item.id}
          className={`${styles.flagItem} ${checked ? styles['flagItem--checked'] : ''}`}
          aria-label={item.label}
        >
          <input
            type="checkbox"
            className={styles.flagCheckbox}
            checked={checked}
            disabled={submitted}
            onChange={(e) => onChange({ ...value, [item.id]: e.target.checked })}
            id={`flag-${item.id}`}
          />
          <span className={styles.flagLabel}>{item.label}</span>
        </label>
      );
    })}
  </div>
);

const SingleChoice: React.FC<{
  step: Step;
  value: string;
  onChange: (v: string) => void;
  submitted: boolean;
}> = ({ step, value, onChange, submitted }) => (
  <div className={styles.choiceList} role="radiogroup" aria-label={step.prompt}>
    {step.items.map((item) => {
      const selected = value === item.id;
      return (
        <label
          key={item.id}
          className={`${styles.choiceItem} ${selected ? styles['choiceItem--selected'] : ''}`}
          aria-label={item.label}
        >
          <input
            type="radio"
            name={`choice-${step.id}`}
            className={styles.choiceRadio}
            value={item.id}
            checked={selected}
            disabled={submitted}
            onChange={() => onChange(item.id)}
            id={`choice-${item.id}`}
          />
          <span className={styles.choiceLabel}>{item.label}</span>
        </label>
      );
    })}
  </div>
);

const Classification: React.FC<{
  step: Step;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  submitted: boolean;
}> = ({ step, value, onChange, submitted }) => (
  <div className={styles.classifyList} role="group" aria-label={step.prompt}>
    {step.items.map((item) => (
      <div key={item.id} className={styles.classifyItem}>
        <span className={styles.classifyItemLabel}>{item.label}</span>
        <select
          className={styles.classifySelect}
          value={value[item.id] ?? ''}
          disabled={submitted}
          aria-label={`Classification for: ${item.label}`}
          onChange={(e) => onChange({ ...value, [item.id]: e.target.value })}
        >
          <option value="" disabled>Select…</option>
          {(item.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    ))}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────

type StepState = Record<string, StepResponse['submitted']>;

export const ChallengePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { progress, recordAttempt } = useCyberStore();

  const challenge = id ? getChallenge(id) : undefined;

  // ── Local state ──
  const [activeEvidence, setActiveEvidence] = useState(0);
  const [stepState, setStepState] = useState<StepState>(() => {
    const initial: StepState = {};
    if (!challenge) return initial;
    for (const step of challenge.steps) {
      if (step.interaction === 'flag-selection') {
        initial[step.id] = {};
      } else if (step.interaction === 'single-choice') {
        initial[step.id] = '';
      } else if (step.interaction === 'classification') {
        initial[step.id] = {};
      } else {
        initial[step.id] = '';
      }
    }
    return initial;
  });
  const [hintsUsed, setHintsUsed] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const submitting = useRef(false); // prevent duplicate submission

  const totalHints = challenge?.hints.length ?? 0;
  const handleRevealHint = useCallback(() => {
    setHintsUsed((n) => Math.min(n + 1, totalHints));
  }, [totalHints]);

  if (!challenge) return <NotFoundPage />;

  // Determine retry number
  const pastAttempts = progress.attempts.filter((a) => a.challengeId === challenge.id);
  const retryNumber = pastAttempts.length;

  const difficulty = challenge.difficulty;
  const diffLabel = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }[difficulty];

  // ── Handlers ──

  const handleStepChange = (stepId: string, value: StepResponse['submitted']) => {
    setStepState((prev) => ({ ...prev, [stepId]: value }));
    setValidationError('');
  };

  const validate = (): boolean => {
    for (const step of challenge.steps) {
      const val = stepState[step.id];
      if (step.interaction === 'single-choice' && !val) {
        setValidationError(`Please select an option for step ${challenge.steps.indexOf(step) + 1}.`);
        return false;
      }
      if (step.interaction === 'classification') {
        const classVal = (val as Record<string, string>) || {};
        const unset = step.items.some((item) => !classVal[item.id]);
        if (unset) {
          setValidationError(`Please classify all items in step ${challenge.steps.indexOf(step) + 1}.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (submitting.current || isSubmitted) return;
    if (!validate()) return;

    submitting.current = true;
    setIsSubmitted(true);

    const stepResponses = buildStepResponses(challenge.steps, stepState);
    const attempt = recordAttempt(challenge, stepResponses, hintsUsed, retryNumber);

    navigate(`/results/${attempt.id}`, { replace: false });
  };

  // ── Evidence icon map ──
  const evidenceIcons: React.ReactNode[] = challenge.evidence.map((ev) => {
    if (ev.type === 'email') return <Mail size={14} aria-hidden="true" />;
    if (ev.type === 'log') return <FileText size={14} aria-hidden="true" />;
    return <FileText size={14} aria-hidden="true" />;
  });

  return (
    <div className={`${styles.page} ${challenge.roomId === 'phishing' ? 'room-phishing' : ''}`}>
      <div className={styles.content}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <Link to={`/room/${challenge.roomId}`} className={styles.backLink}>
            <ArrowLeft size={15} aria-hidden="true" />
            {challenge.roomId === 'phishing' ? 'Phishing Defense' : challenge.roomId}
          </Link>
          <div className={styles.topMeta}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)', padding: '3px var(--space-3)',
            }}>
              {challenge.id}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: 'var(--text-xs)', fontWeight: 600,
              padding: '3px var(--space-2)', borderRadius: 'var(--radius-full)',
              background: difficulty === 'beginner' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
              color: difficulty === 'beginner' ? '#22c55e' : '#f59e0b',
              border: difficulty === 'beginner' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(245,158,11,0.3)',
            }}>
              {diffLabel}
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'var(--text-2xl)', margin: 0 }}>{challenge.title}</h1>

        {/* Briefing */}
        <div className={styles.briefing} role="region" aria-label="Scenario briefing">
          <p className={styles.briefingLabel}>Scenario</p>
          <p className={styles.briefingText}>{challenge.briefing}</p>
        </div>

        {/* Two-column workspace */}
        <div className={styles.workspace}>
          {/* ── Left: Evidence ── */}
          <section className={styles.evidencePanel} aria-label="Evidence">
            <p className={styles.panelTitle}>Evidence</p>

            {/* Evidence tabs */}
            <div className={styles.evidenceTabs} role="tablist" aria-label="Evidence tabs">
              {challenge.evidence.map((ev, i) => (
                <button
                  key={ev.id}
                  role="tab"
                  aria-selected={i === activeEvidence}
                  aria-controls={`evidence-panel-${i}`}
                  id={`evidence-tab-${i}`}
                  className={`${styles.evidenceTab} ${i === activeEvidence ? styles['evidenceTab--active'] : ''}`}
                  onClick={() => setActiveEvidence(i)}
                >
                  {evidenceIcons[i]}
                  {ev.label}
                </button>
              ))}
            </div>

            {/* Active evidence */}
            {challenge.evidence.map((ev, i) => (
              <div
                key={ev.id}
                id={`evidence-panel-${i}`}
                role="tabpanel"
                aria-labelledby={`evidence-tab-${i}`}
                hidden={i !== activeEvidence}
              >
                <EvidenceViewer item={ev} />
              </div>
            ))}
          </section>

          {/* ── Right: Decision panel ── */}
          <aside className={styles.decisionPanel} aria-label="Decisions">
            {/* Steps */}
            {challenge.steps.map((step, stepIndex) => (
              <div key={step.id} className={styles.stepCard}>
                <div className={styles.stepHeader}>
                  <div className={styles.stepHeaderLeft}>
                    <span className={styles.stepNum} aria-hidden="true">{stepIndex + 1}</span>
                    <span className={styles.stepLabel}>Step {stepIndex + 1}</span>
                  </div>
                  <span className={styles.pointBadge}>{step.pointValue} pts</span>
                </div>
                <div className={styles.stepBody}>
                  <p className={styles.stepPrompt}>{step.prompt}</p>

                  {step.interaction === 'flag-selection' && (
                    <FlagSelection
                      step={step}
                      value={stepState[step.id] as Record<string, boolean> ?? {}}
                      onChange={(v) => handleStepChange(step.id, v)}
                      submitted={isSubmitted}
                    />
                  )}
                  {step.interaction === 'single-choice' && (
                    <SingleChoice
                      step={step}
                      value={stepState[step.id] as string ?? ''}
                      onChange={(v) => handleStepChange(step.id, v)}
                      submitted={isSubmitted}
                    />
                  )}
                  {step.interaction === 'classification' && (
                    <Classification
                      step={step}
                      value={stepState[step.id] as Record<string, string> ?? {}}
                      onChange={(v) => handleStepChange(step.id, v)}
                      submitted={isSubmitted}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Hints */}
            <HintDrawer
              hints={challenge.hints}
              revealedCount={hintsUsed}
              onRevealHint={handleRevealHint}
            />

            {/* Submit */}
            <div className={styles.submitArea}>
              {validationError && (
                <div className={styles.validationError} role="alert">
                  <AlertCircle size={16} aria-hidden="true" />
                  {validationError}
                </div>
              )}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleSubmit}
                disabled={isSubmitted}
                aria-label="Submit your answers"
                id="submit-challenge"
              >
                {isSubmitted ? 'Submitting…' : 'Submit Answers'}
              </Button>
            </div>

            <p className={styles.disclaimer}>
              All evidence is entirely fictional. This is a learning simulation only.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
};
