/**
 * Challenge evaluator tests — cc-ph-03 "Spear-Phish Campaign"
 *
 * Covers:
 * - Challenge data & registration (in ALL_CHALLENGES and LIVE_CHALLENGE_IDS)
 * - Evidence integrity (3 inbox emails, RFC 2606 .example domains, RFC 5737 IPs, policy CHG-204)
 * - Step 1: classification (30 pts, 3 items = 10 pts each, partial credit)
 * - Step 2: flag-selection (40 pts, 8 items = 5 pts each, partial credit, 3 distractors)
 * - Step 3: safe operational response (30 pts, single choice)
 * - buildStepResponses integration: perfect (100 pts), over-flagging partial (85 pts), failing (0 pts)
 * - Educational explanations (why Email 3 is unsafe AND why Emails 1 & 2 are legitimate)
 * - Independent coexistence alongside cc-ph-01 and cc-ph-02
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import { challengeCC_PH_03 } from '../challenges/data/cc-ph-03';
import { challengeCC_PH_01 } from '../challenges/data/cc-ph-01';
import { challengeCC_PH_02 } from '../challenges/data/cc-ph-02';
import { getChallenge, LIVE_CHALLENGE_IDS } from '../challenges';
import { computeScore } from '../store';
import type { StepResponse } from '../types';

const [stepClassify, stepEvidence, stepResponse] = challengeCC_PH_03.steps;

// ── Registration & Metadata ──────────────────────────────────────────────────

describe('cc-ph-03 registration & metadata', () => {
  it('is registered in CHALLENGE_MAP via getChallenge', () => {
    const ch = getChallenge('cc-ph-03');
    expect(ch).toBeDefined();
    expect(ch?.id).toBe('cc-ph-03');
    expect(ch?.title).toBe('Spear-Phish Campaign');
    expect(ch?.difficulty).toBe('advanced');
    expect(ch?.roomId).toBe('phishing');
  });

  it('is marked as live in LIVE_CHALLENGE_IDS alongside cc-ph-01 and cc-ph-02', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-03')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-02')).toBe(true);
  });

  it('step pointValues sum to exactly 100', () => {
    const total = challengeCC_PH_03.steps.reduce((sum, s) => sum + s.pointValue, 0);
    expect(total).toBe(100);
  });

  it('passThreshold is 70', () => {
    expect(challengeCC_PH_03.passThreshold).toBe(70);
  });

  it('has 3 hints and advanced phishing defense skills', () => {
    expect(challengeCC_PH_03.hints).toHaveLength(3);
    expect(challengeCC_PH_03.skills).toContain('spear-phishing-defense');
    expect(challengeCC_PH_03.skills).toContain('email-classification');
    expect(challengeCC_PH_03.skills).toContain('link-inspection');
  });
});

// ── Evidence Integrity ────────────────────────────────────────────────────────

describe('cc-ph-03 evidence integrity', () => {
  it('contains 3 evidence items: inbox, directory, and comparison matrix', () => {
    expect(challengeCC_PH_03.evidence).toHaveLength(3);
    expect(challengeCC_PH_03.evidence.map((e) => e.id)).toEqual(['ev-inbox', 'ev-directory', 'ev-headers']);
  });

  it('inbox evidence contains exactly 3 distinct emails', () => {
    const inboxEv = challengeCC_PH_03.evidence.find((e) => e.id === 'ev-inbox')!;
    const content = inboxEv.content as {
      isInbox: boolean;
      emails: { id: string; subject: string; link?: { displayedText: string; actualDestination: string } }[];
    };
    expect(content.isInbox).toBe(true);
    expect(content.emails).toHaveLength(3);
    expect(content.emails.map((e) => e.id)).toEqual(['email-1', 'email-2', 'email-3']);
  });

  it('Email 3 has deceptive masked link pointing to attacker-portal.example', () => {
    const inboxEv = challengeCC_PH_03.evidence.find((e) => e.id === 'ev-inbox')!;
    const content = inboxEv.content as {
      emails: { id: string; link?: { displayedText: string; actualDestination: string } }[];
    };
    const email3 = content.emails.find((e) => e.id === 'email-3')!;
    expect(email3.link?.displayedText).toContain('k8s-patch.veridian-logistics.example');
    expect(email3.link?.actualDestination).toContain('attacker-portal.example');
    expect(email3.link?.actualDestination).not.toEqual(email3.link?.displayedText);
  });

  it('Email 1 and Email 2 link destinations match their genuine domains', () => {
    const inboxEv = challengeCC_PH_03.evidence.find((e) => e.id === 'ev-inbox')!;
    const content = inboxEv.content as {
      emails: { id: string; link?: { displayedText: string; actualDestination: string } }[];
    };
    const email1 = content.emails.find((e) => e.id === 'email-1')!;
    const email2 = content.emails.find((e) => e.id === 'email-2')!;

    expect(email1.link?.displayedText).toBe(email1.link?.actualDestination);
    expect(email2.link?.displayedText).toBe(email2.link?.actualDestination);
  });

  it('directory provides Dr. Dan Kim official contact and policy CHG-204', () => {
    const dirEv = challengeCC_PH_03.evidence.find((e) => e.id === 'ev-directory')!;
    const content = dirEv.content as {
      type: string;
      employee: { officialEmail: string; internalPhone: string };
      policy: { code: string; rules: string[] };
    };
    expect(content.type).toBe('directory');
    expect(content.employee.officialEmail).toBe('d.kim@veridian-logistics.example');
    expect(content.employee.internalPhone).toContain('Ext. 3100');
    expect(content.policy.code).toBe('CHG-204');
    expect(content.policy.rules.some((r) => r.includes('GitOps'))).toBe(true);
  });

  it('all domains use reserved .example TLD and IPs use RFC 5737 documentation ranges', () => {
    const jsonStr = JSON.stringify(challengeCC_PH_03.evidence);
    const domainMatches = jsonStr.match(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [];
    for (const d of domainMatches) {
      expect(d.endsWith('.example')).toBe(true);
    }

    const ipMatches = jsonStr.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) ?? [];
    for (const ip of ipMatches) {
      expect(
        ip.startsWith('198.51.100.') ||
        ip.startsWith('192.0.2.') ||
        ip.startsWith('203.0.113.')
      ).toBe(true);
    }
  });
});

// ── Step 1: Classification (30 pts, partial credit) ───────────────────────────

describe('cc-ph-03 step 1: classification', () => {
  it('correctly classifies all three emails → full 30 pts (10 pts each)', () => {
    const pts = evaluateStep(stepClassify, {
      'email-1': 'Legitimate',
      'email-2': 'Legitimate',
      'email-3': 'Suspicious',
    });
    expect(pts).toBe(30);
  });

  it('2 of 3 correct → 20 pts', () => {
    const pts = evaluateStep(stepClassify, {
      'email-1': 'Legitimate',
      'email-2': 'Legitimate',
      'email-3': 'Legitimate', // wrong
    });
    expect(pts).toBe(20);
  });

  it('1 of 3 correct → 10 pts', () => {
    const pts = evaluateStep(stepClassify, {
      'email-1': 'Suspicious', // wrong
      'email-2': 'Suspicious', // wrong
      'email-3': 'Suspicious', // right
    });
    expect(pts).toBe(10);
  });

  it('all wrong → 0 pts', () => {
    const pts = evaluateStep(stepClassify, {
      'email-1': 'Suspicious',
      'email-2': 'Suspicious',
      'email-3': 'Legitimate',
    });
    expect(pts).toBe(0);
  });

  it('classifying everything as Suspicious earns only 10 pts (cannot pass step)', () => {
    const pts = evaluateStep(stepClassify, {
      'email-1': 'Suspicious',
      'email-2': 'Suspicious',
      'email-3': 'Suspicious',
    });
    expect(pts).toBe(10);
    expect(pts).toBeLessThan(30);
  });
});

// ── Step 2: Evidence Identification (40 pts, partial credit) ──────────────────

describe('cc-ph-03 step 2: evidence identification', () => {
  it('has 8 items including 3 non-fraud distractors', () => {
    expect(stepEvidence.items).toHaveLength(8);
    const key = stepEvidence.answerKey as Record<string, boolean>;
    const falseItems = stepEvidence.items.filter((it) => key[it.id] === false);
    expect(falseItems).toHaveLength(3);
    expect(falseItems.some((it) => it.id === 'flag-cve-reference')).toBe(true);
    expect(falseItems.some((it) => it.id === 'flag-auth-pass')).toBe(true);
    expect(falseItems.some((it) => it.id === 'flag-kubectl-syntax')).toBe(true);
  });

  it('selecting only the 5 true warning signs → full 40 pts (8 of 8 correct)', () => {
    const pts = evaluateStep(stepEvidence, {
      'flag-link-mismatch':      true,
      'flag-sender-mismatch':    true,
      'flag-policy-violation':   true,
      'flag-credential-harvest': true,
      'flag-coercive-urgency':   true,
      'flag-cve-reference':      false,
      'flag-auth-pass':          false,
      'flag-kubectl-syntax':     false,
    });
    expect(pts).toBe(40);
  });

  it('selecting all choices CANNOT earn full points (earns 25 pts due to 3 distractors)', () => {
    const pts = evaluateStep(stepEvidence, {
      'flag-link-mismatch':      true,
      'flag-sender-mismatch':    true,
      'flag-policy-violation':   true,
      'flag-credential-harvest': true,
      'flag-coercive-urgency':   true,
      'flag-cve-reference':      true,
      'flag-auth-pass':          true,
      'flag-kubectl-syntax':     true,
    });
    // 5 correct matches (25 pts), 3 incorrect matches (0 pts)
    expect(pts).toBe(25);
    expect(pts).toBeLessThan(40);
  });

  it('4 of 5 true flags + 3 distractors left unflagged → 35 pts (7 of 8 correct)', () => {
    const pts = evaluateStep(stepEvidence, {
      'flag-link-mismatch':      true,
      'flag-sender-mismatch':    true,
      'flag-policy-violation':   true,
      'flag-credential-harvest': true,
      'flag-coercive-urgency':   false, // missed
      'flag-cve-reference':      false,
      'flag-auth-pass':          false,
      'flag-kubectl-syntax':     false,
    });
    expect(pts).toBe(35);
  });

  it('0 true flags + 3 distractors left unflagged → 15 pts (3 of 8 correct)', () => {
    const pts = evaluateStep(stepEvidence, {
      'flag-link-mismatch':      false,
      'flag-sender-mismatch':    false,
      'flag-policy-violation':   false,
      'flag-credential-harvest': false,
      'flag-coercive-urgency':   false,
      'flag-cve-reference':      false,
      'flag-auth-pass':          false,
      'flag-kubectl-syntax':     false,
    });
    expect(pts).toBe(15);
  });

  it('only wrong flags selected → 0 pts', () => {
    const pts = evaluateStep(stepEvidence, {
      'flag-link-mismatch':      false,
      'flag-sender-mismatch':    false,
      'flag-policy-violation':   false,
      'flag-credential-harvest': false,
      'flag-coercive-urgency':   false,
      'flag-cve-reference':      true,
      'flag-auth-pass':          true,
      'flag-kubectl-syntax':     true,
    });
    expect(pts).toBe(0);
  });
});

// ── Step 3: Operational Response (30 pts, single choice) ──────────────────────

describe('cc-ph-03 step 3: operational response', () => {
  it('correct choice (resp-quarantine-report) → 30 pts', () => {
    expect(evaluateStep(stepResponse, 'resp-quarantine-report')).toBe(30);
  });

  it('wrong choice (resp-test-sandbox) → 0 pts (dangerous execution)', () => {
    expect(evaluateStep(stepResponse, 'resp-test-sandbox')).toBe(0);
  });

  it('wrong choice (resp-reply-verify) → 0 pts (replies to attacker)', () => {
    expect(evaluateStep(stepResponse, 'resp-reply-verify')).toBe(0);
  });

  it('wrong choice (resp-forward-team) → 0 pts (amplifies phishing internally)', () => {
    expect(evaluateStep(stepResponse, 'resp-forward-team')).toBe(0);
  });
});

// ── buildStepResponses Integration ────────────────────────────────────────────

describe('cc-ph-03 buildStepResponses integration', () => {
  const perfectAnswers = {
    'step-classify': {
      'email-1': 'Legitimate',
      'email-2': 'Legitimate',
      'email-3': 'Suspicious',
    },
    'step-evidence': {
      'flag-link-mismatch':      true,
      'flag-sender-mismatch':    true,
      'flag-policy-violation':   true,
      'flag-credential-harvest': true,
      'flag-coercive-urgency':   true,
      'flag-cve-reference':      false,
      'flag-auth-pass':          false,
      'flag-kubectl-syntax':     false,
    },
    'step-response': 'resp-quarantine-report',
  };

  it('perfect answers yield 30 + 40 + 30 = 100 pts and passes threshold', () => {
    const responses = buildStepResponses(challengeCC_PH_03.steps, perfectAnswers);
    expect(responses).toHaveLength(3);
    const earned = responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    expect(earned).toBe(100);

    const score = computeScore(responses, 0, challengeCC_PH_03.passThreshold);
    expect(score.finalScore).toBe(100);
    expect(score.passed).toBe(true);
  });

  it('over-flagging Step 2 yields 30 + 25 + 30 = 85 pts (passes threshold 70, but penalised)', () => {
    const overFlaggingAnswers = {
      'step-classify': {
        'email-1': 'Legitimate',
        'email-2': 'Legitimate',
        'email-3': 'Suspicious',
      },
      'step-evidence': {
        'flag-link-mismatch':      true,
        'flag-sender-mismatch':    true,
        'flag-policy-violation':   true,
        'flag-credential-harvest': true,
        'flag-coercive-urgency':   true,
        'flag-cve-reference':      true,
        'flag-auth-pass':          true,
        'flag-kubectl-syntax':     true,
      },
      'step-response': 'resp-quarantine-report',
    };
    const responses = buildStepResponses(challengeCC_PH_03.steps, overFlaggingAnswers);
    const earned = responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    expect(earned).toBe(85);

    const score = computeScore(responses, 0, challengeCC_PH_03.passThreshold);
    expect(score.finalScore).toBe(85);
    expect(score.passed).toBe(true);
  });

  it('all-wrong answers yield 0 pts', () => {
    const wrongAnswers = {
      'step-classify': {
        'email-1': 'Suspicious',
        'email-2': 'Suspicious',
        'email-3': 'Legitimate',
      },
      'step-evidence': {
        'flag-link-mismatch':      false,
        'flag-sender-mismatch':    false,
        'flag-policy-violation':   false,
        'flag-credential-harvest': false,
        'flag-coercive-urgency':   false,
        'flag-cve-reference':      true,
        'flag-auth-pass':          true,
        'flag-kubectl-syntax':     true,
      },
      'step-response': 'resp-test-sandbox',
    };
    const responses = buildStepResponses(challengeCC_PH_03.steps, wrongAnswers);
    const earned = responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    expect(earned).toBe(0);

    const score = computeScore(responses, 0, challengeCC_PH_03.passThreshold);
    expect(score.finalScore).toBe(0);
    expect(score.passed).toBe(false);
  });
});

// ── Explanations & Answer Key Display ─────────────────────────────────────────

describe('cc-ph-03 explanations & getCorrectAnswerDisplay', () => {
  it('explanations cover why Email 3 is malicious AND why Emails 1 and 2 are legitimate', () => {
    expect(challengeCC_PH_03.successExplanation).toContain('Email 1 (SSO Notice)');
    expect(challengeCC_PH_03.successExplanation).toContain('Email 2 (MetricsCloud)');
    expect(challengeCC_PH_03.successExplanation).toContain('Email 3 is a targeted spear-phish');
    expect(challengeCC_PH_03.successExplanation).toContain('CHG-204');
    expect(challengeCC_PH_03.successExplanation).toContain('attacker-portal.example');

    expect(challengeCC_PH_03.failureExplanation).toContain('Email 1 (Legitimate)');
    expect(challengeCC_PH_03.failureExplanation).toContain('Email 2 (Legitimate)');
    expect(challengeCC_PH_03.failureExplanation).toContain('Email 3 (Suspicious Spear-Phish)');
  });

  it('getCorrectAnswerDisplay formats all 3 steps properly', () => {
    const displayClassify = getCorrectAnswerDisplay(stepClassify);
    expect(displayClassify).toContain('Email 1');
    expect(displayClassify).toContain('Legitimate');
    expect(displayClassify).toContain('Suspicious');

    const displayEvidence = getCorrectAnswerDisplay(stepEvidence);
    expect(displayEvidence).toContain('attacker-portal.example');
    expect(displayEvidence).toContain('CHG-204');
    // Distractors not in correct answer display
    expect(displayEvidence).not.toContain('flag-cve-reference');
    expect(displayEvidence).not.toContain('flag-kubectl-syntax');

    const displayResponse = getCorrectAnswerDisplay(stepResponse);
    expect(displayResponse).toContain('Quarantine the email');
  });
});

// ── Coexistence of all 3 Phishing Defense Challenges ──────────────────────────

describe('all 3 Phishing Defense challenges coexistence', () => {
  it('cc-ph-01, cc-ph-02, and cc-ph-03 can be tracked concurrently in portfolio', () => {
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
    const ph03Responses: StepResponse[] = [
      { stepId: 'step-classify', submitted: {}, pointsEarned: 30 },
      { stepId: 'step-evidence', submitted: {}, pointsEarned: 40 },
      { stepId: 'step-response', submitted: 'resp-quarantine-report', pointsEarned: 30 },
    ];

    const score1 = computeScore(ph01Responses, 0, challengeCC_PH_01.passThreshold);
    const score2 = computeScore(ph02Responses, 1, challengeCC_PH_02.passThreshold);
    const score3 = computeScore(ph03Responses, 0, challengeCC_PH_03.passThreshold);

    expect(score1.finalScore).toBe(100);
    expect(score1.passed).toBe(true);

    expect(score2.finalScore).toBe(90);
    expect(score2.passed).toBe(true);

    expect(score3.finalScore).toBe(100);
    expect(score3.passed).toBe(true);

    // Verify all 3 challenges have distinct non-conflicting IDs and unique skill combinations
    const allSkills = new Set([
      ...challengeCC_PH_01.skills,
      ...challengeCC_PH_02.skills,
      ...challengeCC_PH_03.skills,
    ]);
    expect(allSkills.has('link-inspection')).toBe(true);
    expect(allSkills.has('business-email-compromise')).toBe(true);
    expect(allSkills.has('spear-phishing-defense')).toBe(true);
    expect(allSkills.has('email-classification')).toBe(true);
    expect(allSkills.has('cloud-security-policy')).toBe(true);
  });
});
