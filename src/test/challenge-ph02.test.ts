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

  it('thread evidence contains 4 messages with mismatched Reply-To domain', () => {
    const threadEv = challengeCC_PH_02.evidence.find((e) => e.id === 'ev-thread')!;
    const content = threadEv.content as { isThread: boolean; messages: { id: string; from_address?: string; reply_to?: string }[] };
    expect(content.isThread).toBe(true);
    expect(content.messages).toHaveLength(4);

    const msg2 = content.messages.find((m) => m.id === 'msg-2');
    expect(msg2?.from_address).toBe('victoria.sterling-ceo@mail-executive.example');
    expect(msg2?.reply_to).toBe('exec-transfers@wire-portal-routing.example');
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

  it('header analysis shows SPF, DKIM, and DMARC pass for external sender domain and uses RFC 5737 IP', () => {
    const headerEv = challengeCC_PH_02.evidence.find((e) => e.id === 'ev-header')!;
    const rows = (headerEv.content as { rows: { field: string; value: string }[] }).rows;
    const received = rows.find((r) => r.field.startsWith('Received'));
    expect(received?.value).toMatch(/\(198\.51\.100\.\d{1,3}\)|\(192\.0\.2\.\d{1,3}\)|\(203\.0\.113\.\d{1,3}\)/);

    const spf = rows.find((r) => r.field === 'SPF');
    const dkim = rows.find((r) => r.field === 'DKIM');
    const dmarc = rows.find((r) => r.field === 'DMARC');
    const replyTo = rows.find((r) => r.field === 'Reply-To');

    expect(spf?.value).toContain('PASS');
    expect(dkim?.value).toContain('PASS');
    expect(dmarc?.value).toContain('PASS for domain mail-executive.example');
    expect(replyTo?.value).toContain('wire-portal-routing.example');
    // Ensure no inaccurate veridian DMARC fail claim
    expect(rows.some((r) => r.field.toLowerCase().includes('veridian'))).toBe(false);
  });
});

// ── Step 1: Flag Selection (35 pts, partial credit: 7 items = 5 pts each) ─────

describe('cc-ph-02 step 1: flag-selection', () => {
  it('has 7 items including at least one believable choice that is NOT fraud', () => {
    expect(stepFlags.items).toHaveLength(7);
    const key = stepFlags.answerKey as Record<string, boolean>;
    const falseItems = stepFlags.items.filter((it) => key[it.id] === false);
    expect(falseItems.length).toBeGreaterThanOrEqual(1);
    expect(falseItems.some((it) => it.id === 'flag-auth-pass')).toBe(true);
    expect(falseItems.some((it) => it.id === 'flag-travel')).toBe(true);
  });

  it('selecting only the 5 true warning signs → full 35 pts (7 items matching key)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain':    true,
      'flag-bypass':    true,
      'flag-isolation': true,
      'flag-pressure':  true,
      'flag-reply-to':  true,
      'flag-auth-pass': false,
      'flag-travel':    false,
    });
    expect(pts).toBe(35);
  });

  it('selecting all choices CANNOT earn full points (earns 25 pts because distractors are flagged)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain':    true,
      'flag-bypass':    true,
      'flag-isolation': true,
      'flag-pressure':  true,
      'flag-reply-to':  true,
      'flag-auth-pass': true,
      'flag-travel':    true,
    });
    // 5 correct matches (25 pts), 2 incorrect matches (0 pts)
    expect(pts).toBe(25);
    expect(pts).toBeLessThan(35);
  });

  it('4 of 5 true flags + 2 non-fraud items left unflagged → 30 pts (6 of 7 correct)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain':    true,
      'flag-bypass':    true,
      'flag-isolation': true,
      'flag-pressure':  true,
      'flag-reply-to':  false,
      'flag-auth-pass': false,
      'flag-travel':    false,
    });
    expect(pts).toBe(30);
  });

  it('3 of 5 true flags + 2 non-fraud items left unflagged → 25 pts (5 of 7 correct)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain':    true,
      'flag-bypass':    true,
      'flag-isolation': true,
      'flag-pressure':  false,
      'flag-reply-to':  false,
      'flag-auth-pass': false,
      'flag-travel':    false,
    });
    expect(pts).toBe(25);
  });

  it('2 of 5 true flags + 2 non-fraud items left unflagged → 20 pts (4 of 7 correct)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain':    true,
      'flag-bypass':    true,
      'flag-isolation': false,
      'flag-pressure':  false,
      'flag-reply-to':  false,
      'flag-auth-pass': false,
      'flag-travel':    false,
    });
    expect(pts).toBe(20);
  });

  it('1 of 5 true flags + 2 non-fraud items left unflagged → 15 pts (3 of 7 correct)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain':    true,
      'flag-bypass':    false,
      'flag-isolation': false,
      'flag-pressure':  false,
      'flag-reply-to':  false,
      'flag-auth-pass': false,
      'flag-travel':    false,
    });
    expect(pts).toBe(15);
  });

  it('0 true flags + 2 non-fraud items left unflagged → 10 pts (2 of 7 correct)', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain':    false,
      'flag-bypass':    false,
      'flag-isolation': false,
      'flag-pressure':  false,
      'flag-reply-to':  false,
      'flag-auth-pass': false,
      'flag-travel':    false,
    });
    expect(pts).toBe(10);
  });

  it('only wrong flags selected (0 of 7 correct) → 0 pts', () => {
    const pts = evaluateStep(stepFlags, {
      'flag-domain':    false,
      'flag-bypass':    false,
      'flag-isolation': false,
      'flag-pressure':  false,
      'flag-reply-to':  false,
      'flag-auth-pass': true,
      'flag-travel':    true,
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
      'flag-domain':    true,
      'flag-bypass':    true,
      'flag-isolation': true,
      'flag-pressure':  true,
      'flag-reply-to':  true,
      'flag-auth-pass': false,
      'flag-travel':    false,
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

  it('selecting all flags (over-flagging) yields 25 + 35 + 30 = 90 pts (passes, but loses 10 pts for distractors)', () => {
    const allFlagsAnswers = {
      'step-flags': {
        'flag-domain':    true,
        'flag-bypass':    true,
        'flag-isolation': true,
        'flag-pressure':  true,
        'flag-reply-to':  true,
        'flag-auth-pass': true,
        'flag-travel':    true,
      },
      'step-verify': 'verify-directory',
      'step-action': 'action-refuse-report',
    };
    const responses = buildStepResponses(challengeCC_PH_02.steps, allFlagsAnswers);
    const earned = responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    expect(earned).toBe(90); // 25 + 35 + 30
    expect(earned).toBeLessThan(100);

    const score = computeScore(responses, 0, challengeCC_PH_02.passThreshold);
    expect(score.finalScore).toBe(90);
    expect(score.passed).toBe(true);
  });

  it('partial credit (3 flags + correct verification + correct action) = 90 pts (passes)', () => {
    const partialAnswers = {
      'step-flags': {
        'flag-domain':    true,
        'flag-bypass':    true,
        'flag-isolation': true,
        'flag-pressure':  false,
        'flag-reply-to':  false,
        'flag-auth-pass': false,
        'flag-travel':    false,
      },
      'step-verify': 'verify-directory',
      'step-action': 'action-refuse-report',
    };
    const responses = buildStepResponses(challengeCC_PH_02.steps, partialAnswers);
    const earned = responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    expect(earned).toBe(90); // 25 + 35 + 30

    const score = computeScore(responses, 1, challengeCC_PH_02.passThreshold);
    expect(score.finalScore).toBe(80); // 90 - 10
    expect(score.passed).toBe(true);
  });

  it('all-wrong answers yield 0 pts', () => {
    const wrongAnswers = {
      'step-flags': {
        'flag-domain':    false,
        'flag-bypass':    false,
        'flag-isolation': false,
        'flag-pressure':  false,
        'flag-reply-to':  false,
        'flag-auth-pass': true,
        'flag-travel':    true,
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
  it('explanations cover external authentication limits, directory verification, and policy', () => {
    expect(challengeCC_PH_02.successExplanation).toContain('Business Email Compromise');
    expect(challengeCC_PH_02.successExplanation).toContain('FIN-402');
    expect(challengeCC_PH_02.successExplanation).toContain('wire-portal-routing.example');
    expect(challengeCC_PH_02.successExplanation).toContain('authenticating an external sender domain does NOT establish that the sender is the CEO');

    expect(challengeCC_PH_02.failureExplanation).toContain('CEO Fraud');
    expect(challengeCC_PH_02.failureExplanation).toContain('Marcus Vance');
    expect(challengeCC_PH_02.failureExplanation).toContain('wire-portal-routing.example');
    expect(challengeCC_PH_02.failureExplanation).toContain('authentication of an external sender domain does not establish that the sender is the CEO');
    expect(challengeCC_PH_02.failureExplanation).toContain('trusted company directory and payment policy are the decisive checks');
  });

  it('getCorrectAnswerDisplay formats all 3 steps properly without showing false items', () => {
    const displayFlags = getCorrectAnswerDisplay(stepFlags);
    expect(displayFlags).toContain('sender address');
    expect(displayFlags).toContain('FIN-402');
    expect(displayFlags).toContain('wire-portal-routing.example');
    // Non-fraud items should not be listed as things to flag
    expect(displayFlags).not.toContain('flag-auth-pass');
    expect(displayFlags).not.toContain('flag-travel');

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

// ── Route & URL Contract Verification ─────────────────────────────────────────

describe('route & URL conventions', () => {
  it('room URL for Phishing Defense is /room/phishing', () => {
    const roomId = challengeCC_PH_02.roomId;
    expect(`/room/${roomId}`).toBe('/room/phishing');
  });

  it('results URL uses attempt ID format /results/:attemptId', () => {
    const sampleAttemptId = 'att-1727539200000-abcd';
    const resultsUrl = `/results/${sampleAttemptId}`;
    expect(resultsUrl).toMatch(/^\/results\/att-[a-zA-Z0-9-]+$/);
    expect(resultsUrl).not.toContain('/results/cc-ph-02');
  });
});
