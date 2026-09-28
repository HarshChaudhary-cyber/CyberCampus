/**
 * Challenge evaluator tests — cc-ph-02 "CEO Fraud"
 *
 * Covers:
 * - Challenge data & registration (in ALL_CHALLENGES and LIVE_CHALLENGE_IDS)
 * - Evidence integrity (RFC 2606 .example domains, RFC 5737 documentation IPs)
 * - Step 1: flag-selection (35 pts, partial credit, 5 warning signs)
 * - Step 2: safe verification method (35 pts, single choice)
 * - Step 3: operational decision / handling request (30 pts, single choice)
 * - buildStepResponses integration: perfect (100 pts), passing partial (86 pts), failing (0 pts)
 * - Explanations and getCorrectAnswerDisplay formatting
 * - Independent portfolio recording alongside cc-ph-01
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import { challengeCC_PH_02 } from '../challenges/data/cc-ph-02';
import { challengeCC_PH_01 } from '../challenges/data/cc-ph-01';
import { getChallenge, LIVE_CHALLENGE_IDS } from '../challenges';
import { computeScore } from '../store';
import type { StepResponse } from '../types';

const [stepFlags, stepVerify, stepAction] = challengeCC_PH_02.steps;

// ── Registration & Metadata ──────────────────────────────────────────────────

describe('cc-ph-02 registration & metadata', () => {
  it('is registered in CHALLENGE_MAP via getChallenge', () => {
    const ch = getChallenge('cc-ph-02');
    expect(ch).toBeDefined();
    expect(ch?.id).toBe('cc-ph-02');
    expect(ch?.title).toBe('CEO Fraud');
    expect(ch?.difficulty).toBe('intermediate');
    expect(ch?.roomId).toBe('phishing');
  });

  it('is marked as live in LIVE_CHALLENGE_IDS', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-02')).toBe(true);
    // Preserves cc-ph-01 as live
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-01')).toBe(true);
  });

  it('step pointValues sum to exactly 100', () => {
    const total = challengeCC_PH_02.steps.reduce((sum, s) => sum + s.pointValue, 0);
    expect(total).toBe(100);
  });

  it('passThreshold is 70', () => {
    expect(challengeCC_PH_02.passThreshold).toBe(70);
  });

  it('has 3 hints and appropriate skills', () => {
    expect(challengeCC_PH_02.hints).toHaveLength(3);
    expect(challengeCC_PH_02.skills).toContain('business-email-compromise');
    expect(challengeCC_PH_02.skills).toContain('out-of-band-verification');
  });
});

// ── Evidence Integrity ────────────────────────────────────────────────────────

describe('cc-ph-02 evidence integrity', () => {
  it('contains 3 evidence items: thread, directory, and header analysis', () => {
    expect(challengeCC_PH_02.evidence).toHaveLength(3);
    expect(challengeCC_PH_02.evidence.map((e) => e.id)).toEqual(['ev-thread', 'ev-directory', 'ev-header']);
  });

  it('thread evidence contains 4 messages depicting the conversation', () => {
    const threadEv = challengeCC_PH_02.evidence.find((e) => e.id === 'ev-thread')!;
    const content = threadEv.content as { isThread: boolean; messages: { id: string }[] };
    expect(content.isThread).toBe(true);
    expect(content.messages).toHaveLength(4);
  });

  it('company directory provides trusted contact details and policy FIN-402', () => {
    const dirEv = challengeCC_PH_02.evidence.find((e) => e.id === 'ev-directory')!;
    const content = dirEv.content as {
      type: string;
      employee: { officialEmail: string; internalPhone: string; assistant: string };
      policy: { code: string; rules: string[] };
    };
    expect(content.type).toBe('directory');
    expect(content.employee.officialEmail).toBe('v.sterling@veridian-logistics.example');
    expect(content.employee.internalPhone).toContain('Ext. 401');
    expect(content.policy.code).toBe('FIN-402');
    expect(content.policy.rules.length).toBeGreaterThanOrEqual(2);
  });

  it('all domains use reserved .example TLD and no unreserved domains', () => {
    const jsonStr = JSON.stringify(challengeCC_PH_02.evidence);
    const domainMatches = jsonStr.match(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
    for (const d of domainMatches) {
      expect(d.endsWith('.example')).toBe(true);
    }
  });

  it('header analysis uses RFC 5737 documentation IP and no public routable IPs', () => {
    const headerEv = challengeCC_PH_02.evidence.find((e) => e.id === 'ev-header')!;
    const rows = (headerEv.content as { rows: { field: string; value: string }[] }).rows;
    const received = rows.find((r) => r.field.startsWith('Received'));
    expect(received?.value).toMatch(/\(198\.51\.100\.\d{1,3}\)|\(192\.0\.2\.\d{1,3}\)|\(203\.0\.113\.\d{1,3}\)/);
  });
});

// ── Step 1: Flag Selection (35 pts, partial credit) ───────────────────────────

describe('cc-ph-02 step 1: flag-selection', () => {
  it('all 5 warning signs flagged → full 35 pts (7 pts each)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain': true,
      'flag-bypass': true,
      'flag-isolation': true,
      'flag-pressure': true,
      'flag-external': true,
    });
    expect(pts).toBe(35);
  });

  it('4 of 5 warning signs flagged → 28 pts', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain': true,
      'flag-bypass': true,
      'flag-isolation': true,
      'flag-pressure': true,
      'flag-external': false,
    });
    expect(pts).toBe(28);
  });

  it('3 of 5 warning signs flagged → 21 pts', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain': true,
      'flag-bypass': true,
      'flag-isolation': true,
      'flag-pressure': false,
      'flag-external': false,
    });
    expect(pts).toBe(21);
  });

  it('2 of 5 warning signs flagged → 14 pts', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain': true,
      'flag-bypass': true,
      'flag-isolation': false,
      'flag-pressure': false,
      'flag-external': false,
    });
    expect(pts).toBe(14);
  });

  it('1 of 5 warning signs flagged → 7 pts', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain': true,
      'flag-bypass': false,
      'flag-isolation': false,
      'flag-pressure': false,
      'flag-external': false,
    });
    expect(pts).toBe(7);
  });

  it('0 warning signs flagged → 0 pts', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain': false,
      'flag-bypass': false,
      'flag-isolation': false,
      'flag-pressure': false,
      'flag-external': false,
    });
    expect(pts).toBe(0);
  });
});

// ── Step 2: Safe Verification Method (35 pts, single choice) ──────────────────

describe('cc-ph-02 step 2: safe verification method', () => {
  it('correct choice (verify-directory) → 35 pts', () => {
    expect(evaluateStep(stepVerify, 'verify-directory')).toBe(35);
  });

  it('wrong choice (verify-reply) → 0 pts (attacker controls reply channel)', () => {
    expect(evaluateStep(stepVerify, 'verify-reply')).toBe(0);
  });

  it('wrong choice (verify-vendor-email) → 0 pts', () => {
    expect(evaluateStep(stepVerify, 'verify-vendor-email')).toBe(0);
  });

  it('wrong choice (verify-mobile-sms) → 0 pts (number in message is attacker-provided)', () => {
    expect(evaluateStep(stepVerify, 'verify-mobile-sms')).toBe(0);
  });
});

// ── Step 3: Operational Decision (30 pts, single choice) ──────────────────────

describe('cc-ph-02 step 3: operational decision', () => {
  it('correct choice (action-refuse-report) → 30 pts', () => {
    expect(evaluateStep(stepAction, 'action-refuse-report')).toBe(30);
  });

  it('wrong choice (action-pay-now) → 0 pts (irreversible wire loss)', () => {
    expect(evaluateStep(stepAction, 'action-pay-now')).toBe(0);
  });

  it('wrong choice (action-partial-wire) → 0 pts (violates policy, loses funds)', () => {
    expect(evaluateStep(stepAction, 'action-partial-wire')).toBe(0);
  });

  it('wrong choice (action-forward-all) → 0 pts (spreads phishing internally)', () => {
    expect(evaluateStep(stepAction, 'action-forward-all')).toBe(0);
  });
});

// ── buildStepResponses Integration ────────────────────────────────────────────

describe('cc-ph-02 buildStepResponses integration', () => {
  const perfectAnswers = {
    'step-flags': {
      'flag-domain': true,
      'flag-bypass': true,
      'flag-isolation': true,
      'flag-pressure': true,
      'flag-external': true,
    },
    'step-verify': 'verify-directory',
    'step-action': 'action-refuse-report',
  };

  it('perfect answers yield 35 + 35 + 30 = 100 pts and passes threshold', () => {
    const responses = buildStepResponses(challengeCC_PH_02.steps, perfectAnswers);
    expect(responses).toHaveLength(3);
    const earned = responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    expect(earned).toBe(100);

    const score = computeScore(responses, 0, challengeCC_PH_02.passThreshold);
    expect(score.finalScore).toBe(100);
    expect(score.passed).toBe(true);
  });

  it('partial credit (3 flags + correct verification + correct action) = 86 pts (passes)', () => {
    const partialAnswers = {
      'step-flags': {
        'flag-domain': true,
        'flag-bypass': true,
        'flag-isolation': true,
        'flag-pressure': false,
        'flag-external': false,
      },
      'step-verify': 'verify-directory',
      'step-action': 'action-refuse-report',
    };
    const responses = buildStepResponses(challengeCC_PH_02.steps, partialAnswers);
    const earned = responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    expect(earned).toBe(86); // 21 + 35 + 30

    const score = computeScore(responses, 1, challengeCC_PH_02.passThreshold);
    expect(score.finalScore).toBe(76); // 86 - 10
    expect(score.passed).toBe(true);
  });

  it('all-wrong answers yield 0 pts', () => {
    const wrongAnswers = {
      'step-flags': {
        'flag-domain': false,
        'flag-bypass': false,
        'flag-isolation': false,
        'flag-pressure': false,
        'flag-external': false,
      },
      'step-verify': 'verify-reply',
      'step-action': 'action-pay-now',
    };
    const responses = buildStepResponses(challengeCC_PH_02.steps, wrongAnswers);
    const earned = responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    expect(earned).toBe(0);

    const score = computeScore(responses, 0, challengeCC_PH_02.passThreshold);
    expect(score.finalScore).toBe(0);
    expect(score.passed).toBe(false);
  });
});

// ── Explanations & Answer Key Display ─────────────────────────────────────────

describe('cc-ph-02 explanations & getCorrectAnswerDisplay', () => {
  it('explanations cover BEC, CEO Fraud, and directory verification', () => {
    expect(challengeCC_PH_02.successExplanation).toContain('Business Email Compromise');
    expect(challengeCC_PH_02.successExplanation).toContain('FIN-402');
    expect(challengeCC_PH_02.failureExplanation).toContain('CEO Fraud');
    expect(challengeCC_PH_02.failureExplanation).toContain('Marcus Vance');
  });

  it('getCorrectAnswerDisplay formats all 3 steps properly', () => {
    const displayFlags = getCorrectAnswerDisplay(stepFlags);
    expect(displayFlags).toContain('sender address');
    expect(displayFlags).toContain('FIN-402');

    const displayVerify = getCorrectAnswerDisplay(stepVerify);
    expect(displayVerify).toContain('trusted directory');

    const displayAction = getCorrectAnswerDisplay(stepAction);
    expect(displayAction).toContain('Refuse the transfer');
  });
});

// ── Independent Portfolio & Progress Coexistence ──────────────────────────────

describe('cc-ph-02 independent coexistence with cc-ph-01', () => {
  it('both challenges can have distinct attempts and portfolio entries', () => {
    const ph01Responses: StepResponse[] = [
      { stepId: 'step-flags', submitted: {}, pointsEarned: 40 },
      { stepId: 'step-action', submitted: 'action-flag', pointsEarned: 40 },
      { stepId: 'step-auth', submitted: {}, pointsEarned: 20 },
    ];
    const ph02Responses: StepResponse[] = [
      { stepId: 'step-flags', submitted: {}, pointsEarned: 35 },
      { stepId: 'step-verify', submitted: 'verify-directory', pointsEarned: 35 },
      { stepId: 'step-action', submitted: 'action-refuse-report', pointsEarned: 30 },
    ];

    const ph01Score = computeScore(ph01Responses, 0, challengeCC_PH_01.passThreshold);
    const ph02Score = computeScore(ph02Responses, 1, challengeCC_PH_02.passThreshold);

    expect(ph01Score.finalScore).toBe(100);
    expect(ph01Score.passed).toBe(true);

    expect(ph02Score.finalScore).toBe(90);
    expect(ph02Score.passed).toBe(true);

    // Skills from both challenges are distinct and non-overlapping
    const combinedSkills = new Set([...challengeCC_PH_01.skills, ...challengeCC_PH_02.skills]);
    expect(combinedSkills.has('link-inspection')).toBe(true);
    expect(combinedSkills.has('business-email-compromise')).toBe(true);
    expect(combinedSkills.has('out-of-band-verification')).toBe(true);
  });
});
