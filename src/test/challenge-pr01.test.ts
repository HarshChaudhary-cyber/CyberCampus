/**
 * Challenge evaluator & data consistency tests — cc-pr-01 "Password Audit"
 * Room: Privacy & Account Security | Difficulty: Beginner
 *
 * Covers:
 * - Challenge data & registration (in ALL_CHALLENGES and LIVE_CHALLENGE_IDS)
 * - Coexistence: preserves all 12 existing live challenges across rooms;
 *   cc-pr-01 is live while cc-pr-02 and cc-pr-03 remain coming soon
 * - Privacy room setup: contains cc-pr-01 as live
 * - Deterministic scoring: total 100 pts (40 / 30 / 30), passThreshold 70
 * - Ledger evidence integrity:
 *     - Exactly 8 fictional accounts with realistic risk/control attributes
 *     - 5 accounts requiring remediation (acc-1, acc-3, acc-4, acc-6, acc-7)
 *     - 3 acceptable accounts (acc-2, acc-5, acc-8)
 *     - Credential reuse between acc-1 (Cloud Admin) and acc-4 (Vendor Portal)
 *     - Predictable patterns vs high-entropy passphrases/random secrets
 *     - Multi-factor authentication nuances (FIDO2 vs TOTP vs SMS vs None)
 * - Step 1: Identifying accounts needing action (40 pts, flag-selection, partial credit allowed)
 * - Step 2: Prioritizing most urgent remediation (30 pts, single-choice, no partial credit)
 * - Step 3: Long-term hygiene & password management plan (30 pts, single-choice, no partial credit)
 * - Anti-guessing end-to-end evaluation:
 *     - Marking all accounts unsafe cannot achieve pass threshold
 *     - Full correct submission: 100 pts (PASS)
 *     - Missing urgent priority fails pass threshold if Step 1 has any error
 * - Hint penalty calculation (-10 pts per hint, floor 0)
 * - Educational explanations teaching password managers, MFA, and avoiding fake strength scores
 * - getCorrectAnswerDisplay formatting for all steps
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import {
  challengeCC_PR_01,
  type PasswordAuditContent,
  type PasswordPolicyContent,
} from '../challenges/data/cc-pr-01';
import { getChallenge, getRoom, LIVE_CHALLENGE_IDS, ALL_CHALLENGES } from '../challenges';
import { computeScore } from '../store';

const [stepIdentify, stepUrgency, stepHygiene] = challengeCC_PR_01.steps;

// ── Registration & Metadata ──────────────────────────────────────────────────

describe('cc-pr-01 registration & metadata', () => {
  it('is registered in CHALLENGE_MAP via getChallenge', () => {
    const ch = getChallenge('cc-pr-01');
    expect(ch).toBeDefined();
    expect(ch?.id).toBe('cc-pr-01');
    expect(ch?.title).toBe('Password Audit');
    expect(ch?.difficulty).toBe('beginner');
    expect(ch?.roomId).toBe('privacy');
  });

  it('is registered in ALL_CHALLENGES array', () => {
    const found = ALL_CHALLENGES.find((c) => c.id === 'cc-pr-01');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Password Audit');
  });

  it('is marked as live in LIVE_CHALLENGE_IDS while keeping cc-pr-02 and cc-pr-03 coming soon', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-pr-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-pr-02')).toBe(false);
    expect(LIVE_CHALLENGE_IDS.has('cc-pr-03')).toBe(false);
  });

  it('preserves all 12 previously built live challenges across all rooms (total 13 live challenges)', () => {
    // Phishing Defense
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-03')).toBe(true);

    // Security Operations
    expect(LIVE_CHALLENGE_IDS.has('cc-so-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-03')).toBe(true);

    // Network Security
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-03')).toBe(true);

    // Digital Forensics
    expect(LIVE_CHALLENGE_IDS.has('cc-df-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-df-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-df-03')).toBe(true);

    // Privacy & Account Security
    expect(LIVE_CHALLENGE_IDS.has('cc-pr-01')).toBe(true);

    expect(LIVE_CHALLENGE_IDS.size).toBe(13);
  });

  it('verifies the privacy room includes cc-pr-01 in its challenge list', () => {
    const room = getRoom('privacy');
    expect(room).toBeDefined();
    expect(room?.challengeIds).toEqual(['cc-pr-01', 'cc-pr-02', 'cc-pr-03']);
    expect(LIVE_CHALLENGE_IDS.has(room!.challengeIds[0])).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has(room!.challengeIds[1])).toBe(false);
    expect(LIVE_CHALLENGE_IDS.has(room!.challengeIds[2])).toBe(false);
  });

  it('has deterministic point values summing to exactly 100 with passThreshold 70', () => {
    const totalPoints = challengeCC_PR_01.steps.reduce((sum, s) => sum + s.pointValue, 0);
    expect(totalPoints).toBe(100);
    expect(challengeCC_PR_01.passThreshold).toBe(70);
    expect(stepIdentify.pointValue).toBe(40);
    expect(stepUrgency.pointValue).toBe(30);
    expect(stepHygiene.pointValue).toBe(30);
  });

  it('has two structured evidence items (Audit Ledger and Policy)', () => {
    expect(challengeCC_PR_01.evidence).toHaveLength(2);

    const audit = challengeCC_PR_01.evidence.find((e) => e.id === 'ev-password-audit');
    expect(audit).toBeDefined();
    expect(audit?.type).toBe('file');
    const auditContent = audit?.content as unknown as PasswordAuditContent;
    expect(auditContent.isPasswordAudit).toBe(true);
    expect(auditContent.accounts).toHaveLength(8);

    const policy = challengeCC_PR_01.evidence.find((e) => e.id === 'ev-password-policy');
    expect(policy).toBeDefined();
    expect(policy?.type).toBe('policy');
    const policyContent = policy?.content as unknown as PasswordPolicyContent;
    expect(policyContent.code).toBe('SEC-301-REV3');
    expect(policyContent.rules).toHaveLength(5);
  });

  it('contains sound educational explanations teaching password managers and avoiding fake scores', () => {
    expect(challengeCC_PR_01.briefing).toContain('password length and character complexity alone do not guarantee security');
    expect(challengeCC_PR_01.successExplanation).toContain('password manager');
    expect(challengeCC_PR_01.successExplanation).toContain('prioritizing the Cloud Infrastructure Console (acc-1)');
    expect(challengeCC_PR_01.failureExplanation).toContain('In account security, length and character symbols alone do not prevent credential attacks');
  });
});

// ── Ledger Evidence Consistency & Risk Modeling ──────────────────────────────

describe('cc-pr-01 evidence ledger consistency', () => {
  const auditContent = challengeCC_PR_01.evidence.find((e) => e.id === 'ev-password-audit')!
    .content as unknown as PasswordAuditContent;

  it('contains exactly 8 fictional accounts with proper risk classification', () => {
    expect(auditContent.accounts).toHaveLength(8);

    const atRisk = auditContent.accounts.filter((a) => a.requiresRemediation);
    const safe = auditContent.accounts.filter((a) => !a.requiresRemediation);

    expect(atRisk).toHaveLength(5);
    expect(safe).toHaveLength(3);

    expect(atRisk.map((a) => a.id)).toEqual(['acc-1', 'acc-3', 'acc-4', 'acc-6', 'acc-7']);
    expect(safe.map((a) => a.id)).toEqual(['acc-2', 'acc-5', 'acc-8']);
  });

  it('demonstrates cross-service password reuse between acc-1 and acc-4', () => {
    const acc1 = auditContent.accounts.find((a) => a.id === 'acc-1')!;
    const acc4 = auditContent.accounts.find((a) => a.id === 'acc-4')!;

    expect(acc1.passwordDisplay).toBe(acc4.passwordDisplay);
    expect(acc1.passwordDisplay).toBe('Autumn2024!#Secure');
    expect(acc1.reuseLink?.isReused).toBe(true);
    expect(acc4.reuseLink?.isReused).toBe(true);
    expect(acc1.reuseLink?.reusedWithServiceId).toBe('acc-4');
    expect(acc4.reuseLink?.reusedWithServiceId).toBe('acc-1');
  });

  it('models acc-1 as the most critical risk: cloud admin, exposed, reused, no MFA', () => {
    const acc1 = auditContent.accounts.find((a) => a.id === 'acc-1')!;

    expect(acc1.privilegeLevel).toBe('critical');
    expect(acc1.breachStatus.isExposed).toBe(true);
    expect(acc1.mfaStatus.enabled).toBe(false);
    expect(acc1.mfaStatus.type).toBe('none');
    expect(acc1.reuseLink?.isReused).toBe(true);
  });

  it('models acc-2 as compliant: high entropy, unbreached, hardware FIDO2 MFA', () => {
    const acc2 = auditContent.accounts.find((a) => a.id === 'acc-2')!;

    expect(acc2.breachStatus.isExposed).toBe(false);
    expect(acc2.mfaStatus.enabled).toBe(true);
    expect(acc2.mfaStatus.type).toBe('fido2');
    expect(acc2.requiresRemediation).toBe(false);
  });

  it('models acc-5 as an acceptable long passphrase: 33 chars, unbreached, TOTP MFA', () => {
    const acc5 = auditContent.accounts.find((a) => a.id === 'acc-5')!;

    expect(acc5.passwordLength).toBe(33);
    expect(acc5.passwordDisplay).toBe('correct-horse-battery-staple-77');
    expect(acc5.breachStatus.isExposed).toBe(false);
    expect(acc5.mfaStatus.enabled).toBe(true);
    expect(acc5.mfaStatus.type).toBe('totp');
    expect(acc5.requiresRemediation).toBe(false);
  });

  it('models acc-6 with weak SMS OTP and recent breach exposure', () => {
    const acc6 = auditContent.accounts.find((a) => a.id === 'acc-6')!;

    expect(acc6.breachStatus.isExposed).toBe(true);
    expect(acc6.mfaStatus.type).toBe('sms');
    expect(acc6.requiresRemediation).toBe(true);
  });
});

// ── Step 1: Identifying At-Risk Accounts (40 pts) ─────────────────────────────

describe('cc-pr-01 Step 1: Identifying At-Risk Accounts', () => {
  it('awards full 40 points when all 8 accounts are categorized correctly', () => {
    const submission = {
      'acc-1': true,
      'acc-2': false,
      'acc-3': true,
      'acc-4': true,
      'acc-5': false,
      'acc-6': true,
      'acc-7': true,
      'acc-8': false,
    };

    const points = evaluateStep(stepIdentify, submission);
    expect(points).toBe(40);
  });

  it('awards partial credit (35 pts) when 7 of 8 accounts are categorized correctly', () => {
    // Missing acc-7 (treated as false instead of true) -> 7/8 correct
    const submission = {
      'acc-1': true,
      'acc-2': false,
      'acc-3': true,
      'acc-4': true,
      'acc-5': false,
      'acc-6': true,
      'acc-7': false, // error
      'acc-8': false,
    };

    const points = evaluateStep(stepIdentify, submission);
    expect(points).toBe(35);
  });

  it('penalizes blanket selection of marking all 8 accounts as unsafe (only 25 pts)', () => {
    // 5 true matches, 3 false positives -> 5/8 * 40 = 25 pts
    const submission = {
      'acc-1': true,
      'acc-2': true,
      'acc-3': true,
      'acc-4': true,
      'acc-5': true,
      'acc-6': true,
      'acc-7': true,
      'acc-8': true,
    };

    const points = evaluateStep(stepIdentify, submission);
    expect(points).toBe(25);
  });

  it('awards only 15 points if nothing is flagged as unsafe (3/8 * 40 = 15)', () => {
    const submission = {
      'acc-1': false,
      'acc-2': false,
      'acc-3': false,
      'acc-4': false,
      'acc-5': false,
      'acc-6': false,
      'acc-7': false,
      'acc-8': false,
    };

    const points = evaluateStep(stepIdentify, submission);
    expect(points).toBe(15);
  });
});

// ── Step 2: Prioritizing Most Urgent Remediation (30 pts) ──────────────────────

describe('cc-pr-01 Step 2: Prioritizing Most Urgent Remediation', () => {
  it('awards 30 points for selecting Cloud Infrastructure Console (prio-acc1)', () => {
    const points = evaluateStep(stepUrgency, 'prio-acc1');
    expect(points).toBe(30);
  });

  it('awards 0 points for Database Bastion distractor (prio-acc3)', () => {
    const points = evaluateStep(stepUrgency, 'prio-acc3');
    expect(points).toBe(0);
  });

  it('awards 0 points for Code Repository distractor (prio-acc6)', () => {
    const points = evaluateStep(stepUrgency, 'prio-acc6');
    expect(points).toBe(0);
  });

  it('awards 0 points for Local Workstation distractor (prio-acc7)', () => {
    const points = evaluateStep(stepUrgency, 'prio-acc7');
    expect(points).toBe(0);
  });
});

// ── Step 3: Account-Protection and Hygiene Plan (30 pts) ──────────────────────

describe('cc-pr-01 Step 3: Account-Protection & Hygiene Plan', () => {
  it('awards 30 points for password manager and modern MFA plan (plan-password-manager-mfa)', () => {
    const points = evaluateStep(stepHygiene, 'plan-password-manager-mfa');
    expect(points).toBe(30);
  });

  it('awards 0 points for calendar-based 30-day rotation distractor', () => {
    const points = evaluateStep(stepHygiene, 'plan-frequent-rotation-calendar');
    expect(points).toBe(0);
  });

  it('awards 0 points for single master passphrase reuse distractor', () => {
    const points = evaluateStep(stepHygiene, 'plan-single-complex-master');
    expect(points).toBe(0);
  });

  it('awards 0 points for character-substitution complexity distractor', () => {
    const points = evaluateStep(stepHygiene, 'plan-character-substitution-policy');
    expect(points).toBe(0);
  });
});

// ── Anti-Guessing & End-to-End Scoring ───────────────────────────────────────

describe('cc-pr-01 End-to-End Scoring & Anti-Guessing', () => {
  it('awards full 100 points and marks challenge passed for perfect submission', () => {
    const responses = buildStepResponses(challengeCC_PR_01.steps, {
      'step-identify-accounts': {
        'acc-1': true,
        'acc-2': false,
        'acc-3': true,
        'acc-4': true,
        'acc-5': false,
        'acc-6': true,
        'acc-7': true,
        'acc-8': false,
      },
      'step-prioritize-urgency': 'prio-acc1',
      'step-hygiene-plan': 'plan-password-manager-mfa',
    });

    const scoreResult = computeScore(responses, 0, challengeCC_PR_01.passThreshold);
    expect(scoreResult.earnedScore).toBe(100);
    expect(scoreResult.finalScore).toBe(100);
    expect(scoreResult.passed).toBe(true);
  });

  it('fails pass threshold when marking all accounts unsafe in Step 1 (max 85 without Step 1 perfection)', () => {
    // Step 1: all true -> 25 pts; Step 2: wrong (0); Step 3: right (30) -> 55 < 70 (Fail)
    const responses = buildStepResponses(challengeCC_PR_01.steps, {
      'step-identify-accounts': {
        'acc-1': true,
        'acc-2': true,
        'acc-3': true,
        'acc-4': true,
        'acc-5': true,
        'acc-6': true,
        'acc-7': true,
        'acc-8': true,
      },
      'step-prioritize-urgency': 'prio-acc3',
      'step-hygiene-plan': 'plan-password-manager-mfa',
    });

    const scoreResult = computeScore(responses, 0, challengeCC_PR_01.passThreshold);
    expect(scoreResult.earnedScore).toBe(55);
    expect(scoreResult.finalScore).toBe(55);
    expect(scoreResult.passed).toBe(false);
  });

  it('passes on threshold (70 pts) if Step 1 is perfect and Step 3 is correct, even if Step 2 is missed', () => {
    // Step 1: 40 + Step 2: 0 + Step 3: 30 = 70 (PASS)
    const responses = buildStepResponses(challengeCC_PR_01.steps, {
      'step-identify-accounts': {
        'acc-1': true,
        'acc-2': false,
        'acc-3': true,
        'acc-4': true,
        'acc-5': false,
        'acc-6': true,
        'acc-7': true,
        'acc-8': false,
      },
      'step-prioritize-urgency': 'prio-acc7', // missed
      'step-hygiene-plan': 'plan-password-manager-mfa', // correct
    });

    const scoreResult = computeScore(responses, 0, challengeCC_PR_01.passThreshold);
    expect(scoreResult.earnedScore).toBe(70);
    expect(scoreResult.passed).toBe(true);
  });

  it('fails pass threshold (65 pts) if Step 2 is missed AND one mistake is made on Step 1', () => {
    // Step 1: 35 + Step 2: 0 + Step 3: 30 = 65 (FAIL)
    const responses = buildStepResponses(challengeCC_PR_01.steps, {
      'step-identify-accounts': {
        'acc-1': true,
        'acc-2': true, // false positive mistake
        'acc-3': true,
        'acc-4': true,
        'acc-5': false,
        'acc-6': true,
        'acc-7': true,
        'acc-8': false,
      },
      'step-prioritize-urgency': 'prio-acc3', // missed
      'step-hygiene-plan': 'plan-password-manager-mfa', // correct
    });

    const scoreResult = computeScore(responses, 0, challengeCC_PR_01.passThreshold);
    expect(scoreResult.earnedScore).toBe(65);
    expect(scoreResult.passed).toBe(false);
  });

  it('applies hint penalties correctly (-10 per hint, floor 0)', () => {
    const perfectResponses = buildStepResponses(challengeCC_PR_01.steps, {
      'step-identify-accounts': {
        'acc-1': true,
        'acc-2': false,
        'acc-3': true,
        'acc-4': true,
        'acc-5': false,
        'acc-6': true,
        'acc-7': true,
        'acc-8': false,
      },
      'step-prioritize-urgency': 'prio-acc1',
      'step-hygiene-plan': 'plan-password-manager-mfa',
    });

    // 1 hint: 100 - 10 = 90 (PASS)
    const score1 = computeScore(perfectResponses, 1, challengeCC_PR_01.passThreshold);
    expect(score1.finalScore).toBe(90);
    expect(score1.passed).toBe(true);

    // 2 hints: 100 - 20 = 80 (PASS)
    const score2 = computeScore(perfectResponses, 2, challengeCC_PR_01.passThreshold);
    expect(score2.finalScore).toBe(80);
    expect(score2.passed).toBe(true);

    // 3 hints: 100 - 30 = 70 (PASS - exactly on threshold)
    const score3 = computeScore(perfectResponses, 3, challengeCC_PR_01.passThreshold);
    expect(score3.finalScore).toBe(70);
    expect(score3.passed).toBe(true);

    // 4 hints: 100 - 40 = 60 (FAIL - below threshold 70)
    const score4 = computeScore(perfectResponses, 4, challengeCC_PR_01.passThreshold);
    expect(score4.finalScore).toBe(60);
    expect(score4.passed).toBe(false);
  });

  it('formats display answers using getCorrectAnswerDisplay', () => {
    const disp1 = getCorrectAnswerDisplay(stepIdentify);
    expect(disp1).toContain('Cloud Infrastructure Console');
    expect(disp1).toContain('Production Database Bastion');
    expect(disp1).toContain('Third-Party Logistics');

    const disp2 = getCorrectAnswerDisplay(stepUrgency);
    expect(disp2).toContain('Cloud Infrastructure Console (acc-1)');

    const disp3 = getCorrectAnswerDisplay(stepHygiene);
    expect(disp3).toContain('Deploy an enterprise password manager');
  });
});
