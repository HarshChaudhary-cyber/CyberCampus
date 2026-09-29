/**
 * Challenge evaluator tests — cc-so-01 "Alert Triage"
 * Room: Security Operations | Difficulty: Beginner
 *
 * Covers:
 * - Challenge data & registration (in ALL_CHALLENGES and LIVE_CHALLENGE_IDS)
 * - Evidence integrity (8 SIEM/EDR alerts, RFC 2606 .example domains, RFC 5737 IPs, shift handover)
 * - Step 1: classification (70 pts, 8 items = 8.75 pts each, partial credit)
 * - Anti-guessing penalty: blanket "Investigate" yields only 35/70 pts and cannot pass the challenge
 * - Step 2: safe incident containment (30 pts, single choice)
 * - buildStepResponses integration: perfect (100 pts), partial pass (91 pts), blanket-investigate fail (65 pts), all-wrong fail (0 pts)
 * - Hint penalty computation (-10 pts per hint, floor 0)
 * - Comprehensive educational explanations covering all 8 alerts
 * - Coexistence alongside all 3 Phishing Defense challenges
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import { challengeCC_SO_01 } from '../challenges/data/cc-so-01';
import { getChallenge, getRoom, LIVE_CHALLENGE_IDS, ROOMS } from '../challenges';
import { computeScore } from '../store';

const [stepTriage, stepContainment] = challengeCC_SO_01.steps;

// ── Registration & Metadata ──────────────────────────────────────────────────

describe('cc-so-01 registration & metadata', () => {
  it('is registered in CHALLENGE_MAP via getChallenge', () => {
    const ch = getChallenge('cc-so-01');
    expect(ch).toBeDefined();
    expect(ch?.id).toBe('cc-so-01');
    expect(ch?.title).toBe('Alert Triage');
    expect(ch?.difficulty).toBe('beginner');
    expect(ch?.roomId).toBe('secops');
  });

  it('is marked as live in LIVE_CHALLENGE_IDS while intermediate and advanced SecOps remain coming soon', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-so-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-02')).toBe(false);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-03')).toBe(false);
  });

  it('preserves all three Phishing Defense challenges in LIVE_CHALLENGE_IDS', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-03')).toBe(true);
  });

  it('Security Operations room is registered with correct metadata and challenge IDs', () => {
    const secopsRoom = getRoom('secops');
    expect(secopsRoom).toBeDefined();
    expect(secopsRoom?.title).toBe('Security Operations');
    expect(secopsRoom?.accentClass).toBe('room-secops');
    expect(secopsRoom?.challengeIds).toEqual(['cc-so-01', 'cc-so-02', 'cc-so-03']);
  });

  it('step pointValues sum to exactly 100', () => {
    const total = challengeCC_SO_01.steps.reduce((sum, s) => sum + s.pointValue, 0);
    expect(total).toBe(100);
  });

  it('passThreshold is 70', () => {
    expect(challengeCC_SO_01.passThreshold).toBe(70);
  });

  it('has 3 helpful hints and beginner secops skills', () => {
    expect(challengeCC_SO_01.hints).toHaveLength(3);
    expect(challengeCC_SO_01.skills).toContain('alert-triage');
    expect(challengeCC_SO_01.skills).toContain('siem-investigation');
    expect(challengeCC_SO_01.skills).toContain('incident-classification');
    expect(challengeCC_SO_01.skills).toContain('containment-strategy');
    expect(challengeCC_SO_01.skills).toContain('change-management-correlation');
  });
});

// ── Evidence Integrity ────────────────────────────────────────────────────────

describe('cc-so-01 evidence integrity', () => {
  it('contains 2 evidence items: alert triage queue and shift handover', () => {
    expect(challengeCC_SO_01.evidence).toHaveLength(2);
    expect(challengeCC_SO_01.evidence.map((e) => e.id)).toEqual(['ev-alerts', 'ev-handover']);
  });

  it('alert queue evidence contains exactly 8 distinct alerts', () => {
    const alertsEv = challengeCC_SO_01.evidence.find((e) => e.id === 'ev-alerts')!;
    const content = alertsEv.content as {
      isAlertQueue: boolean;
      alerts: Array<{ id: string; severity: string; rule: string; affectedSystem: string }>;
    };
    expect(content.isAlertQueue).toBe(true);
    expect(content.alerts).toHaveLength(8);
    expect(content.alerts.map((a) => a.id)).toEqual([
      'alt-201', 'alt-202', 'alt-203', 'alt-204',
      'alt-205', 'alt-206', 'alt-207', 'alt-208',
    ]);
  });

  it('all domains use reserved RFC 2606 .example and IPs use RFC 5737 documentation blocks', () => {
    const evidenceStr = JSON.stringify(challengeCC_SO_01.evidence);
    // Check .example domains
    expect(evidenceStr).toContain('veridian-logistics.example');

    // Confirm documentation IPs (198.51.100.x or 203.0.113.x)
    expect(evidenceStr).toMatch(/198\.51\.100\.\d+/);
    expect(evidenceStr).toMatch(/203\.0\.113\.\d+/);

    // Confirm no real world top-level domains without example
    const externalDomains = evidenceStr.match(/[a-zA-Z0-9-]+\.(com|org|net|io|co|xyz)/g) ?? [];
    for (const d of externalDomains) {
      expect(d).toMatch(/example/);
    }
  });

  it('Shift handover provides actionable operational context for dismissing benign alerts', () => {
    const handoverEv = challengeCC_SO_01.evidence.find((e) => e.id === 'ev-handover')!;
    const content = handoverEv.content as {
      type: string;
      policy: { rules: string[] };
    };
    expect(content.type).toBe('directory');
    const rulesStr = content.policy.rules.join(' ');
    expect(rulesStr).toContain('CHG-8910'); // vuln scanner
    expect(rulesStr).toContain('SEC-3301'); // veeam backup rotation
    expect(rulesStr).toContain('INFRA-9042'); // AWS cloud maintenance
  });
});

// ── Step 1: Alert Classification Scoring ──────────────────────────────────────

describe('cc-so-01 Step 1 — Alert Classification', () => {
  const perfectAnswers: Record<string, string> = {
    'alt-201': 'Investigate',
    'alt-202': 'Dismiss as explained activity',
    'alt-203': 'Investigate',
    'alt-204': 'Dismiss as explained activity',
    'alt-205': 'Investigate',
    'alt-206': 'Dismiss as explained activity',
    'alt-207': 'Investigate',
    'alt-208': 'Dismiss as explained activity',
  };

  it('awards full 70 points for all 8 correct classifications', () => {
    const score = evaluateStep(stepTriage, perfectAnswers);
    expect(score).toBe(70);
  });

  it('awards 35 points (fair partial credit: 4/8 * 70) if user selects "Investigate" for everything', () => {
    const blanketInvestigate: Record<string, string> = {
      'alt-201': 'Investigate',
      'alt-202': 'Investigate',
      'alt-203': 'Investigate',
      'alt-204': 'Investigate',
      'alt-205': 'Investigate',
      'alt-206': 'Investigate',
      'alt-207': 'Investigate',
      'alt-208': 'Investigate',
    };
    const score = evaluateStep(stepTriage, blanketInvestigate);
    expect(score).toBe(35);
  });

  it('awards 35 points if user selects "Dismiss as explained activity" for everything', () => {
    const blanketDismiss: Record<string, string> = {
      'alt-201': 'Dismiss as explained activity',
      'alt-202': 'Dismiss as explained activity',
      'alt-203': 'Dismiss as explained activity',
      'alt-204': 'Dismiss as explained activity',
      'alt-205': 'Dismiss as explained activity',
      'alt-206': 'Dismiss as explained activity',
      'alt-207': 'Dismiss as explained activity',
      'alt-208': 'Dismiss as explained activity',
    };
    const score = evaluateStep(stepTriage, blanketDismiss);
    expect(score).toBe(35);
  });

  it('awards 0 points when all 8 answers are inverted', () => {
    const allWrong: Record<string, string> = {
      'alt-201': 'Dismiss as explained activity',
      'alt-202': 'Investigate',
      'alt-203': 'Dismiss as explained activity',
      'alt-204': 'Investigate',
      'alt-205': 'Dismiss as explained activity',
      'alt-206': 'Investigate',
      'alt-207': 'Dismiss as explained activity',
      'alt-208': 'Investigate',
    };
    const score = evaluateStep(stepTriage, allWrong);
    expect(score).toBe(0);
  });

  it('awards 52.5 points when 6 of 8 are correct (6 * 8.75 = 52.5)', () => {
    const sixCorrect: Record<string, string> = {
      ...perfectAnswers,
      'alt-202': 'Investigate', // wrong
      'alt-203': 'Dismiss as explained activity', // wrong
    };
    const score = evaluateStep(stepTriage, sixCorrect);
    expect(score).toBe(52.5);
  });

  it('correct answer display formats all 8 alerts and their intended triage state', () => {
    const display = getCorrectAnswerDisplay(stepTriage);
    expect(display).toContain('ALT-201');
    expect(display).toContain('Investigate');
    expect(display).toContain('ALT-202');
    expect(display).toContain('Dismiss as explained activity');
    expect(display).toContain('ALT-207');
  });
});

// ── Step 2: Containment Response ──────────────────────────────────────────────

describe('cc-so-01 Step 2 — Containment Response', () => {
  it('awards full 30 points for immediate EDR network isolation and memory capture', () => {
    const score = evaluateStep(stepContainment, 'resp-isolate-kill');
    expect(score).toBe(30);
  });

  it('awards 0 points for email admin distractor (delays response during active exfiltration)', () => {
    const score = evaluateStep(stepContainment, 'resp-email-admin');
    expect(score).toBe(0);
  });

  it('awards 0 points for perimeter IP block only distractor (leaves host infected)', () => {
    const score = evaluateStep(stepContainment, 'resp-block-ip-only');
    expect(score).toBe(0);
  });

  it('awards 0 points for rebooting file server (destroys volatile forensic RAM evidence)', () => {
    const score = evaluateStep(stepContainment, 'resp-reboot-server');
    expect(score).toBe(0);
  });

  it('correct answer display describes the correct containment protocol', () => {
    const display = getCorrectAnswerDisplay(stepContainment);
    expect(display).toContain('isolate');
    expect(display).toContain('EDR containment');
  });
});

// ── End-to-End Evaluation & Scoring ───────────────────────────────────────────

describe('cc-so-01 End-to-End Scoring & Passing Scenarios', () => {
  const perfectStep1: Record<string, string> = {
    'alt-201': 'Investigate',
    'alt-202': 'Dismiss as explained activity',
    'alt-203': 'Investigate',
    'alt-204': 'Dismiss as explained activity',
    'alt-205': 'Investigate',
    'alt-206': 'Dismiss as explained activity',
    'alt-207': 'Investigate',
    'alt-208': 'Dismiss as explained activity',
  };

  it('perfect attempt scores 100/100 and passes', () => {
    const stepState = {
      'step-triage': perfectStep1,
      'step-containment': 'resp-isolate-kill',
    };
    const responses = buildStepResponses(challengeCC_SO_01.steps, stepState);
    const result = computeScore(responses, 0, challengeCC_SO_01.passThreshold);

    expect(result.earnedScore).toBe(100);
    expect(result.finalScore).toBe(100);
    expect(result.passed).toBe(true);
  });

  it('blanket "Investigate" strategy CANNOT pass even with perfect containment (35 + 30 = 65 < 70)', () => {
    const blanketStep1: Record<string, string> = {
      'alt-201': 'Investigate',
      'alt-202': 'Investigate',
      'alt-203': 'Investigate',
      'alt-204': 'Investigate',
      'alt-205': 'Investigate',
      'alt-206': 'Investigate',
      'alt-207': 'Investigate',
      'alt-208': 'Investigate',
    };
    const stepState = {
      'step-triage': blanketStep1,
      'step-containment': 'resp-isolate-kill',
    };
    const responses = buildStepResponses(challengeCC_SO_01.steps, stepState);
    const result = computeScore(responses, 0, challengeCC_SO_01.passThreshold);

    expect(result.earnedScore).toBe(65);
    expect(result.finalScore).toBe(65);
    // Guarantees anti-guessing design: selecting investigate for everything cannot pass!
    expect(result.passed).toBe(false);
  });

  it('one triage mistake (7/8 correct = 61.3 pts) + correct containment (30 pts) passes (91.3 -> 91 pts)', () => {
    const minorMistakeStep1: Record<string, string> = {
      ...perfectStep1,
      'alt-206': 'Investigate', // 1 mistake (WAF crawler dismissed vs investigated)
    };
    const stepState = {
      'step-triage': minorMistakeStep1,
      'step-containment': 'resp-isolate-kill',
    };
    const responses = buildStepResponses(challengeCC_SO_01.steps, stepState);
    const result = computeScore(responses, 0, challengeCC_SO_01.passThreshold);

    expect(result.earnedScore).toBeCloseTo(91.3, 1);
    expect(result.finalScore).toBeCloseTo(91.3, 1);
    expect(result.passed).toBe(true);
  });

  it('hints deduct 10 points per hint from final earned score', () => {
    const stepState = {
      'step-triage': perfectStep1,
      'step-containment': 'resp-isolate-kill',
    };
    const responses = buildStepResponses(challengeCC_SO_01.steps, stepState);

    expect(computeScore(responses, 1, challengeCC_SO_01.passThreshold).finalScore).toBe(90);
    expect(computeScore(responses, 2, challengeCC_SO_01.passThreshold).finalScore).toBe(80);
    const threeHints = computeScore(responses, 3, challengeCC_SO_01.passThreshold);
    expect(threeHints.finalScore).toBe(70); // exactly at passThreshold
    expect(threeHints.passed).toBe(true);
  });

  it('failure explanations provide comprehensive rationale for all 8 alerts', () => {
    expect(challengeCC_SO_01.failureExplanation).toContain('ALT-201');
    expect(challengeCC_SO_01.failureExplanation).toContain('ALT-202');
    expect(challengeCC_SO_01.failureExplanation).toContain('ALT-203');
    expect(challengeCC_SO_01.failureExplanation).toContain('ALT-204');
    expect(challengeCC_SO_01.failureExplanation).toContain('ALT-205');
    expect(challengeCC_SO_01.failureExplanation).toContain('ALT-206');
    expect(challengeCC_SO_01.failureExplanation).toContain('ALT-207');
    expect(challengeCC_SO_01.failureExplanation).toContain('ALT-208');
    expect(challengeCC_SO_01.failureExplanation).toContain('volatile RAM');
  });

  it('success explanations provide in-depth operational analysis and containment justification', () => {
    expect(challengeCC_SO_01.successExplanation).toContain('credential theft');
    expect(challengeCC_SO_01.successExplanation).toContain('CHG-8910');
    expect(challengeCC_SO_01.successExplanation).toContain('impossible travel');
    expect(challengeCC_SO_01.successExplanation).toContain('Kerberoasting');
    expect(challengeCC_SO_01.successExplanation).toContain('exfiltration');
    expect(challengeCC_SO_01.successExplanation).toContain('EDR containment');
  });
});

// ── Room & Coexistence Integrity ─────────────────────────────────────────────

describe('CyberCampus Multi-Room Challenge Coexistence', () => {
  it('all 4 live challenges are present and distinct in CHALLENGE_MAP', () => {
    const ph01 = getChallenge('cc-ph-01');
    const ph02 = getChallenge('cc-ph-02');
    const ph03 = getChallenge('cc-ph-03');
    const so01 = getChallenge('cc-so-01');

    expect(ph01).toBeDefined();
    expect(ph02).toBeDefined();
    expect(ph03).toBeDefined();
    expect(so01).toBeDefined();

    expect(ph01?.roomId).toBe('phishing');
    expect(ph02?.roomId).toBe('phishing');
    expect(ph03?.roomId).toBe('phishing');
    expect(so01?.roomId).toBe('secops');
  });

  it('all 5 campus rooms exist in ROOMS', () => {
    const roomIds = ROOMS.map((r) => r.id);
    expect(roomIds).toEqual(['phishing', 'secops', 'network', 'forensics', 'privacy']);
  });
});
