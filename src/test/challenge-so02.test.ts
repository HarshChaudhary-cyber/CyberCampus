/**
 * Challenge evaluator tests — cc-so-02 "The 3am Login"
 * Room: Security Operations | Difficulty: Intermediate
 *
 * Covers:
 * - Challenge data & registration (in ALL_CHALLENGES and LIVE_CHALLENGE_IDS)
 * - Evidence integrity (8 timeline events, RFC 2606 .example domains, RFC 5737 IPs, baseline directory)
 * - Step 1: flag-selection (35 pts, 4 genuine anomalies, 2 distractors, partial credit)
 * - Step 2: fact vs hypothesis classification (35 pts, 4 items = 8.75 pts each, partial credit)
 * - Step 3: proportionate incident response (30 pts, single choice)
 * - Anti-guessing penalty & deterministic scoring: over-flagging + blanket guessing yields 65/100 and fails (<70)
 * - Hint penalty computation (-10 pts per hint, floor 0)
 * - In-depth educational explanations (why 3am timestamp alone is not proof of fraud, MFA push fatigue)
 * - Coexistence alongside cc-ph-01, cc-ph-02, cc-ph-03, and cc-so-01
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import { challengeCC_SO_02 } from '../challenges/data/cc-so-02';
import { getChallenge, getRoom, LIVE_CHALLENGE_IDS, ROOMS } from '../challenges';
import { computeScore } from '../store';

const [stepAnomalies, stepFactVsHypo, stepResponse] = challengeCC_SO_02.steps;

// ── Registration & Metadata ──────────────────────────────────────────────────

describe('cc-so-02 registration & metadata', () => {
  it('is registered in CHALLENGE_MAP via getChallenge', () => {
    const ch = getChallenge('cc-so-02');
    expect(ch).toBeDefined();
    expect(ch?.id).toBe('cc-so-02');
    expect(ch?.title).toBe('The 3am Login');
    expect(ch?.difficulty).toBe('intermediate');
    expect(ch?.roomId).toBe('secops');
  });

  it('is marked as live in LIVE_CHALLENGE_IDS while advanced SecOps (cc-so-03) remains locked', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-so-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-03')).toBe(false);
  });

  it('preserves all three Phishing Defense challenges in LIVE_CHALLENGE_IDS', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-03')).toBe(true);
  });

  it('Security Operations room registers both cc-so-01 and cc-so-02 as active challenges', () => {
    const secopsRoom = getRoom('secops');
    expect(secopsRoom).toBeDefined();
    expect(secopsRoom?.challengeIds).toContain('cc-so-01');
    expect(secopsRoom?.challengeIds).toContain('cc-so-02');
    expect(secopsRoom?.challengeIds).toContain('cc-so-03');
  });

  it('step pointValues sum to exactly 100', () => {
    const total = challengeCC_SO_02.steps.reduce((sum, s) => sum + s.pointValue, 0);
    expect(total).toBe(100);
  });

  it('passThreshold is 70', () => {
    expect(challengeCC_SO_02.passThreshold).toBe(70);
  });

  it('has 3 helpful hints and intermediate secops skills', () => {
    expect(challengeCC_SO_02.hints).toHaveLength(3);
    expect(challengeCC_SO_02.skills).toContain('log-timeline-analysis');
    expect(challengeCC_SO_02.skills).toContain('mfa-fatigue-detection');
    expect(challengeCC_SO_02.skills).toContain('fact-vs-hypothesis');
    expect(challengeCC_SO_02.skills).toContain('device-posture-assessment');
    expect(challengeCC_SO_02.skills).toContain('proportionate-incident-response');
  });
});

// ── Evidence Integrity ────────────────────────────────────────────────────────

describe('cc-so-02 evidence integrity', () => {
  it('contains 2 evidence items: timeline and user baseline profile', () => {
    expect(challengeCC_SO_02.evidence).toHaveLength(2);
    expect(challengeCC_SO_02.evidence.map((e) => e.id)).toEqual(['ev-timeline', 'ev-user-baseline']);
  });

  it('timeline evidence contains exactly 8 sequential events', () => {
    const timelineEv = challengeCC_SO_02.evidence.find((e) => e.id === 'ev-timeline')!;
    const content = timelineEv.content as {
      isTimeline: boolean;
      events: Array<{ id: string; system: string; sourceIp: string; timestamp: string }>;
    };
    expect(content.isTimeline).toBe(true);
    expect(content.events).toHaveLength(8);
    expect(content.events.map((e) => e.id)).toEqual([
      'evt-01', 'evt-02', 'evt-03', 'evt-04',
      'evt-05', 'evt-06', 'evt-07', 'evt-08',
    ]);
  });

  it('all domains use reserved RFC 2606 .example and IPs use RFC 5737 documentation blocks', () => {
    const evidenceStr = JSON.stringify(challengeCC_SO_02.evidence);
    expect(evidenceStr).toContain('veridian-logistics.example');
    expect(evidenceStr).toMatch(/198\.51\.100\.\d+/);
    expect(evidenceStr).toMatch(/203\.0\.113\.\d+/);

    const externalDomains = evidenceStr.match(/[a-zA-Z0-9-]+\.(com|org|net|io|co|xyz)/g) ?? [];
    for (const d of externalDomains) {
      expect(d).toMatch(/example/);
    }
  });

  it('baseline profile documents Marcus on-call rotation and assigned hardware', () => {
    const baselineEv = challengeCC_SO_02.evidence.find((e) => e.id === 'ev-user-baseline')!;
    const content = baselineEv.content as {
      type: string;
      employee: { name: string; currentStatus: string };
      policy: { code: string; rules: string[] };
    };
    expect(content.type).toBe('directory');
    expect(content.employee.name).toBe('Marcus Vance');
    expect(content.employee.currentStatus).toContain('On-Call');
    expect(content.employee.currentStatus).toContain('00:00 – 08:00 UTC');
    expect(content.policy.code).toBe('SOP SEC-204');

    const rulesStr = content.policy.rules.join(' ');
    expect(rulesStr).toContain('Proportionate Containment');
  });
});

// ── Step 1: Anomalies Flag-Selection Scoring ─────────────────────────────────

describe('cc-so-02 Step 1 — Anomaly Identification', () => {
  const perfectFlags = {
    'anom-mfa-fatigue': true,
    'anom-unmanaged-device': true,
    'anom-create-access-key': true,
    'dist-off-hours': false,
    'dist-german-ip': false,
    'dist-chrome-browser': false,
  };

  it('awards full 35 points when all 3 genuine anomalies are flagged and distractors ignored', () => {
    const score = evaluateStep(stepAnomalies, perfectFlags);
    expect(score).toBe(35);
  });

  it('penalizes selecting distractors (over-flagging all 6 items yields 17.5 pts)', () => {
    const flagAll = {
      'anom-mfa-fatigue': true,
      'anom-unmanaged-device': true,
      'anom-create-access-key': true,
      'dist-off-hours': true,
      'dist-german-ip': true,
      'dist-chrome-browser': true,
    };
    // 3 correct matches out of 6 items = 3 * (35 / 6) = 17.5 pts
    const score = evaluateStep(stepAnomalies, flagAll);
    expect(score).toBe(17.5);
  });

  it('awards 0 points when only distractors are flagged', () => {
    const distractorsOnly = {
      'dist-off-hours': true,
      'dist-german-ip': true,
      'dist-chrome-browser': true,
    };
    const score = evaluateStep(stepAnomalies, distractorsOnly);
    expect(score).toBe(0);
  });

  it('awards partial credit (29.2 pts) when 2 of 3 correct anomalies are flagged without distractors', () => {
    const twoCorrect = {
      'anom-mfa-fatigue': true,
      'anom-unmanaged-device': true,
    };
    // 2 correct + 3 unselected distractors = 5 matches out of 6 = 5 * (35 / 6) = 29.17 -> 29.2 pts
    const score = evaluateStep(stepAnomalies, twoCorrect);
    expect(score).toBeCloseTo(29.2, 1);
  });

  it('correct answer display lists only the genuine anomalous warning signs', () => {
    const display = getCorrectAnswerDisplay(stepAnomalies);
    expect(display).toContain('MFA push notification denials');
    expect(display).toContain('unmanaged Windows workstation');
    expect(display).toContain('programmatic IAM access key');
    expect(display).not.toContain('03:14 UTC outside');
  });
});

// ── Step 2: Fact vs. Hypothesis Discipline Scoring ───────────────────────────

describe('cc-so-02 Step 2 — Fact vs. Hypothesis Discipline', () => {
  const perfectClassification: Record<string, string> = {
    'fact-concurrent-laptop': 'Confirmed Fact',
    'hypo-stolen-password': 'Plausible Hypothesis (Unproven)',
    'hypo-mfa-accidental': 'Plausible Hypothesis (Unproven)',
    'fact-access-key-created': 'Confirmed Fact',
  };

  it('awards full 35 points for all 4 correct classifications', () => {
    const score = evaluateStep(stepFactVsHypo, perfectClassification);
    expect(score).toBe(35);
  });

  it('awards 17.5 points (2/4 correct) if user classifies everything as "Confirmed Fact"', () => {
    const allFact: Record<string, string> = {
      'fact-concurrent-laptop': 'Confirmed Fact',
      'hypo-stolen-password': 'Confirmed Fact',
      'hypo-mfa-accidental': 'Confirmed Fact',
      'fact-access-key-created': 'Confirmed Fact',
    };
    const score = evaluateStep(stepFactVsHypo, allFact);
    expect(score).toBe(17.5);
  });

  it('awards 17.5 points if user classifies everything as "Plausible Hypothesis (Unproven)"', () => {
    const allHypo: Record<string, string> = {
      'fact-concurrent-laptop': 'Plausible Hypothesis (Unproven)',
      'hypo-stolen-password': 'Plausible Hypothesis (Unproven)',
      'hypo-mfa-accidental': 'Plausible Hypothesis (Unproven)',
      'fact-access-key-created': 'Plausible Hypothesis (Unproven)',
    };
    const score = evaluateStep(stepFactVsHypo, allHypo);
    expect(score).toBe(17.5);
  });

  it('awards 0 points when all 4 classifications are inverted', () => {
    const allWrong: Record<string, string> = {
      'fact-concurrent-laptop': 'Plausible Hypothesis (Unproven)',
      'hypo-stolen-password': 'Confirmed Fact',
      'hypo-mfa-accidental': 'Confirmed Fact',
      'fact-access-key-created': 'Plausible Hypothesis (Unproven)',
    };
    const score = evaluateStep(stepFactVsHypo, allWrong);
    expect(score).toBe(0);
  });

  it('correct answer display maps each statement to its factual classification', () => {
    const display = getCorrectAnswerDisplay(stepFactVsHypo);
    expect(display).toContain('Confirmed Fact');
    expect(display).toContain('Plausible Hypothesis');
  });
});

// ── Step 3: Proportionate Incident Response ──────────────────────────────────

describe('cc-so-02 Step 3 — Proportionate Response', () => {
  it('awards 30 points for proportionate session revocation, key deactivation, and out-of-band user verification', () => {
    const score = evaluateStep(stepResponse, 'resp-proportionate');
    expect(score).toBe(30);
  });

  it('awards 0 points for overkill laptop wiping and premature breach notification', () => {
    const score = evaluateStep(stepResponse, 'resp-overkill-wipe');
    expect(score).toBe(0);
  });

  it('awards 0 points for ineffective email to compromised inbox', () => {
    const score = evaluateStep(stepResponse, 'resp-under-react-email');
    expect(score).toBe(0);
  });

  it('awards 0 points for dismissing alert due to on-call status', () => {
    const score = evaluateStep(stepResponse, 'resp-ignore-oncall');
    expect(score).toBe(0);
  });

  it('correct answer display outlines proportionate protocol', () => {
    const display = getCorrectAnswerDisplay(stepResponse);
    expect(display).toContain('revoke session');
    expect(display).toContain('deactivate the newly created IAM access key');
    expect(display).toContain('out-of-band telephone contact');
  });
});

// ── End-to-End Scoring & Anti-Guessing Mechanics ─────────────────────────────

describe('cc-so-02 End-to-End Scoring Scenarios', () => {
  const perfectStep1 = {
    'anom-mfa-fatigue': true,
    'anom-unmanaged-device': true,
    'anom-create-access-key': true,
    'dist-off-hours': false,
    'dist-german-ip': false,
    'dist-chrome-browser': false,
  };

  const perfectStep2: Record<string, string> = {
    'fact-concurrent-laptop': 'Confirmed Fact',
    'hypo-stolen-password': 'Plausible Hypothesis (Unproven)',
    'hypo-mfa-accidental': 'Plausible Hypothesis (Unproven)',
    'fact-access-key-created': 'Confirmed Fact',
  };

  it('perfect attempt scores 100/100 and passes', () => {
    const stepState = {
      'step-anomalies': perfectStep1,
      'step-fact-vs-inference': perfectStep2,
      'step-response': 'resp-proportionate',
    };
    const responses = buildStepResponses(challengeCC_SO_02.steps, stepState);
    const result = computeScore(responses, 0, challengeCC_SO_02.passThreshold);

    expect(result.earnedScore).toBe(100);
    expect(result.finalScore).toBe(100);
    expect(result.passed).toBe(true);
  });

  it('over-flagging all items in Step 1 and blanket guessing in Step 2 FAILS even with correct Step 3 (17.5 + 17.5 + 30 = 65 < 70)', () => {
    const flagAllStep1 = {
      'anom-mfa-fatigue': true,
      'anom-unmanaged-device': true,
      'anom-create-access-key': true,
      'dist-off-hours': true,
      'dist-german-ip': true,
      'dist-chrome-browser': true,
    };
    const allFactStep2: Record<string, string> = {
      'fact-concurrent-laptop': 'Confirmed Fact',
      'hypo-stolen-password': 'Confirmed Fact',
      'hypo-mfa-accidental': 'Confirmed Fact',
      'fact-access-key-created': 'Confirmed Fact',
    };
    const stepState = {
      'step-anomalies': flagAllStep1,
      'step-fact-vs-inference': allFactStep2,
      'step-response': 'resp-proportionate',
    };
    const responses = buildStepResponses(challengeCC_SO_02.steps, stepState);
    const result = computeScore(responses, 0, challengeCC_SO_02.passThreshold);

    expect(result.earnedScore).toBe(65);
    expect(result.finalScore).toBe(65);
    expect(result.passed).toBe(false);
  });

  it('one minor oversight in Step 1 (2/3 correct = 29.2 pts) + perfect Steps 2 & 3 passes (94.2 pts)', () => {
    const twoAnomalies = {
      'anom-mfa-fatigue': true,
      'anom-unmanaged-device': true,
      'anom-create-access-key': false, // missed one
      'dist-off-hours': false,
      'dist-german-ip': false,
      'dist-chrome-browser': false,
    };
    const stepState = {
      'step-anomalies': twoAnomalies,
      'step-fact-vs-inference': perfectStep2,
      'step-response': 'resp-proportionate',
    };
    const responses = buildStepResponses(challengeCC_SO_02.steps, stepState);
    const result = computeScore(responses, 0, challengeCC_SO_02.passThreshold);

    expect(result.earnedScore).toBeCloseTo(94.2, 1);
    expect(result.finalScore).toBeCloseTo(94.2, 1);
    expect(result.passed).toBe(true);
  });

  it('hints deduct 10 points per hint from final earned score', () => {
    const stepState = {
      'step-anomalies': perfectStep1,
      'step-fact-vs-inference': perfectStep2,
      'step-response': 'resp-proportionate',
    };
    const responses = buildStepResponses(challengeCC_SO_02.steps, stepState);

    expect(computeScore(responses, 1, challengeCC_SO_02.passThreshold).finalScore).toBe(90);
    expect(computeScore(responses, 2, challengeCC_SO_02.passThreshold).finalScore).toBe(80);
    const threeHints = computeScore(responses, 3, challengeCC_SO_02.passThreshold);
    expect(threeHints.finalScore).toBe(70);
    expect(threeHints.passed).toBe(true);
  });

  it('success explanation details why off-hours login alone is not proof of fraud and explains proportionate containment', () => {
    expect(challengeCC_SO_02.successExplanation).toContain('actively on-call');
    expect(challengeCC_SO_02.successExplanation).toContain('Unmanaged Windows Endpoint');
    expect(challengeCC_SO_02.successExplanation).toContain('MFA Push Fatigue');
    expect(challengeCC_SO_02.successExplanation).toContain('Proportionate Response');
    expect(challengeCC_SO_02.successExplanation).toContain('out-of-band');
  });

  it('failure explanation reinforces fact vs hypothesis discipline and proportionate response', () => {
    expect(challengeCC_SO_02.failureExplanation).toContain('Marcus was on active secondary on-call rotation');
    expect(challengeCC_SO_02.failureExplanation).toContain('Device posture mismatch');
    expect(challengeCC_SO_02.failureExplanation).toContain('MFA push bombing');
    expect(challengeCC_SO_02.failureExplanation).toContain('Fact vs Hypothesis');
    expect(challengeCC_SO_02.failureExplanation).toContain('Avoid under-reacting');
  });
});

// ── Multi-Challenge Registry Coexistence ─────────────────────────────────────

describe('CyberCampus Multi-Challenge Coexistence', () => {
  it('all 5 live challenges exist in CHALLENGE_MAP', () => {
    const ids = ['cc-ph-01', 'cc-ph-02', 'cc-ph-03', 'cc-so-01', 'cc-so-02'];
    for (const id of ids) {
      const ch = getChallenge(id);
      expect(ch).toBeDefined();
      expect(ch?.id).toBe(id);
    }
  });

  it('all 5 campus rooms exist in ROOMS', () => {
    const roomIds = ROOMS.map((r) => r.id);
    expect(roomIds).toEqual(['phishing', 'secops', 'network', 'forensics', 'privacy']);
  });
});
