/**
 * Challenge evaluator tests — cc-ph-01 "The Suspicious Invoice"
 *
 * Covers:
 * - Evidence correctness: reserved example domains (.example) and RFC 5737 documentation IP
 * - Flag-selection: all 5 warning signs (technical + urgency + vendor), partial credit, fair scoring
 * - Single-choice: correct, incorrect
 * - Classification: all correct, partial, all wrong
 * - buildStepResponses integration: perfect (100 pts) and all wrong (0 pts)
 * - Explanations: educational coverage of urgency and unfamiliar vendor
 * - getCorrectAnswerDisplay formatting
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import { challengeCC_PH_01 } from '../challenges/data/cc-ph-01';

const [stepFlags, stepAction, stepAuth] = challengeCC_PH_01.steps;

// ── Evidence Integrity (Task 3A Requirement 1) ───────────────────────────────

describe('evidence integrity — domains and IP addresses', () => {
  const emailEv = challengeCC_PH_01.evidence.find((e) => e.id === 'ev-email');
  const headerEv = challengeCC_PH_01.evidence.find((e) => e.id === 'ev-header');

  it('email actual link uses reserved .example domain and NOT .example.xyz', () => {
    const content = emailEv?.content as { link_actual: string };
    expect(content.link_actual).toBeDefined();
    expect(content.link_actual).not.toContain('.xyz');
    expect(content.link_actual).toMatch(/https?:\/\/[a-z0-9-]+\.example(\/.*)?$/);
  });

  it('email header Received-From uses RFC 5737 documentation IP address and NOT public 185.220.101.42', () => {
    const content = headerEv?.content as { rows: { field: string; value: string }[] };
    const received = content.rows.find((r) => r.field === 'Received: from');
    expect(received?.value).toBeDefined();
    expect(received?.value).not.toContain('185.220.101.42');
    // 198.51.100.0/24 (TEST-NET-2) or 192.0.2.0/24 or 203.0.113.0/24
    expect(received?.value).toMatch(/\(198\.51\.100\.\d{1,3}\)|\(192\.0\.2\.\d{1,3}\)|\(203\.0\.113\.\d{1,3}\)/);
  });
});

// ── Flag-selection (40pts, partialCreditAllowed=true) (Task 3A Requirement 3) ──

describe('flag-selection step — partial credit & fair scoring', () => {
  it('all five warning signs flagged (technical + urgency + vendor) → full 40 pts', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-reply-to': true,
      'flag-link-dest': true,
      'flag-attachment': true,
      'flag-urgency': true,
      'flag-vendor': true,
    });
    expect(pts).toBe(40);
  });

  it('four warning signs flagged (e.g. missed vendor) → 32 pts (4/5 * 40)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-reply-to': true,
      'flag-link-dest': true,
      'flag-attachment': true,
      'flag-urgency': true,
      'flag-vendor': false, // missed
    });
    expect(pts).toBe(32);
  });

  it('three technical warning signs flagged (missed urgency and vendor) → 24 pts (3/5 * 40)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-reply-to': true,
      'flag-link-dest': true,
      'flag-attachment': true,
      'flag-urgency': false, // missed
      'flag-vendor': false,  // missed
    });
    expect(pts).toBe(24);
  });

  it('two warning signs flagged → 16 pts (2/5 * 40)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-reply-to': true,
      'flag-link-dest': true,
      'flag-attachment': false,
      'flag-urgency': false,
      'flag-vendor': false,
    });
    expect(pts).toBe(16);
  });

  it('one warning sign flagged → 8 pts (1/5 * 40)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-reply-to': true,
      'flag-link-dest': false,
      'flag-attachment': false,
      'flag-urgency': false,
      'flag-vendor': false,
    });
    expect(pts).toBe(8);
  });

  it('nothing flagged → 0 pts (fair scoring: no free points for inactivity)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-reply-to': false,
      'flag-link-dest': false,
      'flag-attachment': false,
      'flag-urgency': false,
      'flag-vendor': false,
    });
    expect(pts).toBe(0);
  });
});

// ── Single-choice (40pts, partialCreditAllowed=false) ─────────────────────────

describe('single-choice step', () => {
  it('correct action (action-flag) → 40 pts', () => {
    expect(evaluateStep(stepAction, 'action-flag')).toBe(40);
  });

  it('wrong action (action-pay) → 0 pts', () => {
    expect(evaluateStep(stepAction, 'action-pay')).toBe(0);
  });

  it('wrong action (action-reply) → 0 pts', () => {
    expect(evaluateStep(stepAction, 'action-reply')).toBe(0);
  });

  it('wrong action (action-call-num) → 0 pts', () => {
    expect(evaluateStep(stepAction, 'action-call-num')).toBe(0);
  });

  it('empty string → 0 pts', () => {
    expect(evaluateStep(stepAction, '')).toBe(0);
  });
});

// ── Classification (20pts, partialCreditAllowed=true) ─────────────────────────

describe('classification step', () => {
  const allCorrect = {
    'auth-dkim': 'Concern',
    'auth-spf': 'Concern',
    'auth-dmarc': 'Concern',
  };

  it('all three classified as Concern → 20 pts', () => {
    expect(evaluateStep(stepAuth, allCorrect)).toBe(20);
  });

  it('two correct, one wrong → 13.3 pts (≈ 20/3*2)', () => {
    const pts = evaluateStep(stepAuth, {
      'auth-dkim': 'Concern',
      'auth-spf': 'Concern',
      'auth-dmarc': 'Expected / Normal', // wrong
    });
    // 2/3 → ~13.3 rounded to 1dp
    expect(pts).toBeCloseTo(13.3, 0);
  });

  it('all classified as Expected → 0 pts', () => {
    expect(evaluateStep(stepAuth, {
      'auth-dkim': 'Expected / Normal',
      'auth-spf': 'Expected / Normal',
      'auth-dmarc': 'Expected / Normal',
    })).toBe(0);
  });

  it('empty selections → 0 pts', () => {
    expect(evaluateStep(stepAuth, {})).toBe(0);
  });
});

// ── buildStepResponses integration ────────────────────────────────────────────

describe('buildStepResponses — perfect attempt', () => {
  const perfectAnswers = {
    'step-flags': {
      'flag-reply-to': true,
      'flag-link-dest': true,
      'flag-attachment': true,
      'flag-urgency': true,
      'flag-vendor': true,
    },
    'step-action': 'action-flag',
    'step-auth': {
      'auth-dkim': 'Concern',
      'auth-spf': 'Concern',
      'auth-dmarc': 'Concern',
    },
  };

  it('returns 3 StepResponses', () => {
    const responses = buildStepResponses(challengeCC_PH_01.steps, perfectAnswers);
    expect(responses).toHaveLength(3);
  });

  it('perfect answers earn 40 + 40 + 20 = 100 pts total', () => {
    const responses = buildStepResponses(challengeCC_PH_01.steps, perfectAnswers);
    const total = responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    expect(total).toBe(100);
  });

  it('each StepResponse has the correct stepId', () => {
    const responses = buildStepResponses(challengeCC_PH_01.steps, perfectAnswers);
    expect(responses.map((r) => r.stepId)).toEqual(['step-flags', 'step-action', 'step-auth']);
  });
});

describe('buildStepResponses — all wrong attempt', () => {
  const wrongAnswers = {
    'step-flags': {
      'flag-reply-to': false,
      'flag-link-dest': false,
      'flag-attachment': false,
      'flag-urgency': false,
      'flag-vendor': false,
    },
    'step-action': 'action-pay',
    'step-auth': {
      'auth-dkim': 'Expected / Normal',
      'auth-spf': 'Expected / Normal',
      'auth-dmarc': 'Expected / Normal',
    },
  };

  it('completely wrong answers yield 0 pts', () => {
    const responses = buildStepResponses(challengeCC_PH_01.steps, wrongAnswers);
    const total = responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    expect(total).toBe(0);
  });
});

// ── Explanations & Answer Key Display (Task 3A Requirement 3) ─────────────────

describe('explanations and answer display', () => {
  it('success explanation highlights urgency and vendor as reasonable warning signs', () => {
    const expl = challengeCC_PH_01.successExplanation;
    expect(expl).toContain('urgency');
    expect(expl).toContain('vendor');
    expect(expl).toContain('deserve verification');
    expect(expl).not.toContain('.xyz');
  });

  it('failure explanation highlights urgency and vendor as reasonable warning signs', () => {
    const expl = challengeCC_PH_01.failureExplanation;
    expect(expl).toContain('urgency');
    expect(expl).toContain('vendor');
    expect(expl).toContain('deserve verification');
    expect(expl).not.toContain('.xyz');
  });

  it('getCorrectAnswerDisplay for flag-selection includes all 5 warning signs', () => {
    const display = getCorrectAnswerDisplay(stepFlags);
    expect(display).toContain('Reply-To');
    expect(display).toContain('Pay Invoice');
    expect(display).toContain('Stat10nery');
    expect(display).toContain('urgency');
    expect(display).toContain('vendor');
  });

  it('getCorrectAnswerDisplay for single-choice shows correct action', () => {
    const display = getCorrectAnswerDisplay(stepAction);
    expect(display).toContain('Do NOT pay');
  });

  it('getCorrectAnswerDisplay for classification shows Concern for all headers', () => {
    const display = getCorrectAnswerDisplay(stepAuth);
    expect(display).toContain('DKIM');
    expect(display).toContain('Concern');
  });
});
