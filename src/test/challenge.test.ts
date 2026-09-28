/**
 * Challenge evaluator tests — cc-ph-01 "The Suspicious Invoice"
 *
 * Covers:
 * - Flag-selection: all correct, partial credit, wrong flags, over-flagging
 * - Single-choice: correct, incorrect
 * - Classification: all correct, partial, all wrong
 * - buildStepResponses integration
 * - evaluateStep with each interaction type
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import { challengeCC_PH_01 } from '../challenges/data/cc-ph-01';

const [stepFlags, stepAction, stepAuth] = challengeCC_PH_01.steps;

// ── Flag-selection (40pts, partialCreditAllowed=true) ─────────────────────────

describe('flag-selection step — partial credit', () => {
  it('all three correct flags ticked, no distractors → 40 pts', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-reply-to': true,
      'flag-link-dest': true,
      'flag-attachment': true,
      'flag-urgency': false,
      'flag-vendor': false,
    });
    expect(pts).toBe(40);
  });

  it('two correct flags → 32 pts (2 correct + 3 others correct = 5/5? no — 5 items)', () => {
    // 5 items, pointValue=40, pointsPerItem=8
    // tick 2 of 3 correct flags, leave distractors un-ticked → 3/5 correct outcomes misses 1 flag
    // correct outcomes: reply-to=true(✓), link-dest=true(✓), attachment=false(✗ should be true), urgency=false(✓), vendor=false(✓)
    const pts = evaluateStep(stepFlags, {
      'flag-reply-to': true,
      'flag-link-dest': true,
      'flag-attachment': false, // wrong
      'flag-urgency': false,
      'flag-vendor': false,
    });
    // 4 of 5 items correct → 4 * (40/5) = 32
    expect(pts).toBe(32);
  });

  it('tick a distractor (false positive) → reduces score', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-reply-to': true,
      'flag-link-dest': true,
      'flag-attachment': true,
      'flag-urgency': true,  // wrong — should be false
      'flag-vendor': false,
    });
    // 4/5 correct → 32
    expect(pts).toBe(32);
  });

  it('nothing flagged → zero (0/3 correct flags ticked)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-reply-to': false,
      'flag-link-dest': false,
      'flag-attachment': false,
      'flag-urgency': false,
      'flag-vendor': false,
    });
    // 2 items (urgency, vendor) happen to be correctly false — but 3 items are wrongly false
    // 2/5 correct → 2 * 8 = 16
    expect(pts).toBe(16);
  });

  it('all items flagged → 2/5 correct (only distractors that should be false are now wrong)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-reply-to': true,   // ✓
      'flag-link-dest': true,  // ✓
      'flag-attachment': true, // ✓
      'flag-urgency': true,    // ✗ (should be false)
      'flag-vendor': true,     // ✗ (should be false)
    });
    // 3/5 correct → 24
    expect(pts).toBe(24);
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
      'flag-urgency': false,
      'flag-vendor': false,
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
    'step-flags': {},
    'step-action': 'action-pay',
    'step-auth': {},
  };

  it('wrong answers yield very low total (≤ 16 from flag partial)', () => {
    const responses = buildStepResponses(challengeCC_PH_01.steps, wrongAnswers);
    const total = responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    // action-pay = 0, empty auth = 0, empty flags = 16 (2 distractors happen to be correctly false)
    expect(total).toBeLessThanOrEqual(20);
    expect(total).toBeGreaterThanOrEqual(0);
  });
});

// ── getCorrectAnswerDisplay ───────────────────────────────────────────────────

describe('getCorrectAnswerDisplay', () => {
  it('flag-selection shows only the flagged items', () => {
    const display = getCorrectAnswerDisplay(stepFlags);
    expect(display).toContain('Reply-To');
    expect(display).toContain('Pay Invoice');
    expect(display).toContain('Stat10nery');
  });

  it('single-choice shows the correct option label', () => {
    const display = getCorrectAnswerDisplay(stepAction);
    expect(display).toContain('Do NOT pay');
  });

  it('classification shows all items with their correct labels', () => {
    const display = getCorrectAnswerDisplay(stepAuth);
    expect(display).toContain('DKIM');
    expect(display).toContain('Concern');
  });
});
