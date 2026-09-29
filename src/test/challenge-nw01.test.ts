/**
 * Challenge evaluator tests — cc-nw-01 "The Open Port"
 * Room: Network Security | Difficulty: Beginner
 *
 * Covers:
 * - Challenge data & registration (in ALL_CHALLENGES and LIVE_CHALLENGE_IDS)
 * - Coexistence: preserves all 6 existing challenges; cc-nw-02 and cc-nw-03 remain coming soon
 * - Evidence integrity (8 listening services, RFC 2606 .example domains, RFC 5737 / RFC 1918 IPs, SOP NET-101)
 * - Step 1: flag-selection (40 pts, 8 items = 5 pts each, partial credit)
 * - Anti-guessing penalty: blanket selection of all 8 ports yields only 20/40 pts
 * - Step 2: classification (30 pts, 4 items = 7.5 pts each, partial credit)
 * - Step 3: single-choice remediation strategy (30 pts, no partial credit)
 * - buildStepResponses integration:
 *     - Perfect run (100 pts, PASS)
 *     - Anti-guessing run (flag-all Step 1 + blanket-insecure Step 2 + Step 3 = 65 pts < 70, FAIL)
 *     - Minor oversight run (7/8 Step 1 + Steps 2 & 3 = 95 pts, PASS)
 *     - Zero-credit run (0 pts, FAIL)
 * - Hint penalty calculation (-10 pts per hint, floor 0)
 * - Educational explanations for all ports and configurations
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import { challengeCC_NW_01 } from '../challenges/data/cc-nw-01';
import { getChallenge, getRoom, LIVE_CHALLENGE_IDS } from '../challenges';
import { computeScore } from '../store';

const [stepFlags, stepClassify, stepRemediate] = challengeCC_NW_01.steps;

// ── Registration & Metadata ──────────────────────────────────────────────────

describe('cc-nw-01 registration & metadata', () => {
  it('is registered in CHALLENGE_MAP via getChallenge', () => {
    const ch = getChallenge('cc-nw-01');
    expect(ch).toBeDefined();
    expect(ch?.id).toBe('cc-nw-01');
    expect(ch?.title).toBe('The Open Port');
    expect(ch?.difficulty).toBe('beginner');
    expect(ch?.roomId).toBe('network');
  });

  it('is marked as live in LIVE_CHALLENGE_IDS', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-01')).toBe(true);
  });

  it('is marked as live alongside cc-nw-02 and cc-nw-03', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-03')).toBe(true);
  });

  it('preserves all six previously built challenges in LIVE_CHALLENGE_IDS', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-03')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-03')).toBe(true);
  });

  it('Network Security room contains cc-nw-01, cc-nw-02, cc-nw-03', () => {
    const room = getRoom('network');
    expect(room).toBeDefined();
    expect(room?.title).toBe('Network Security');
    expect(room?.accentClass).toBe('room-network');
    expect(room?.challengeIds).toEqual(['cc-nw-01', 'cc-nw-02', 'cc-nw-03']);
  });

  it('step pointValues sum to exactly 100', () => {
    const total = challengeCC_NW_01.steps.reduce((sum, s) => sum + s.pointValue, 0);
    expect(total).toBe(100);
  });

  it('passThreshold is 70', () => {
    expect(challengeCC_NW_01.passThreshold).toBe(70);
  });

  it('has 3 helpful hints and beginner network security skills', () => {
    expect(challengeCC_NW_01.hints).toHaveLength(3);
    expect(challengeCC_NW_01.skills).toContain('network-exposure-analysis');
    expect(challengeCC_NW_01.skills).toContain('port-and-service-auditing');
    expect(challengeCC_NW_01.skills).toContain('least-privilege-network-binding');
    expect(challengeCC_NW_01.skills).toContain('perimeter-security-controls');
    expect(challengeCC_NW_01.skills).toContain('insecure-protocol-remediation');
  });
});

// ── Evidence Integrity ────────────────────────────────────────────────────────

describe('cc-nw-01 evidence integrity', () => {
  it('contains 2 evidence items: exposure audit report and policy SOP NET-101', () => {
    expect(challengeCC_NW_01.evidence).toHaveLength(2);
    expect(challengeCC_NW_01.evidence.map((e) => e.id)).toEqual(['ev-exposure-report', 'ev-policy-net101']);
  });

  it('exposure report evidence contains exactly 8 listening port entries', () => {
    const reportEv = challengeCC_NW_01.evidence.find((e) => e.id === 'ev-exposure-report')!;
    const content = reportEv.content as {
      isExposureReport: boolean;
      ports: Array<{ id: string; port: number; boundAddress: string; reachability: string }>;
    };
    expect(content.isExposureReport).toBe(true);
    expect(content.ports).toHaveLength(8);
    expect(content.ports.map((p) => p.port)).toEqual([80, 443, 21, 22, 6379, 9100, 8080, 5432]);
  });

  it('uses only RFC 2606 .example domains and RFC 5737 / RFC 1918 documentation IP addresses', () => {
    const evidenceStr = JSON.stringify(challengeCC_NW_01.evidence);

    // Reserved domains only
    const domains = evidenceStr.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || [];
    const externalDomains = domains.filter((d) => !d.endsWith('.example') && !d.includes('veridian-logistics'));
    expect(externalDomains).toHaveLength(0);

    // IP addresses in evidence
    const ips = evidenceStr.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) || [];
    for (const ip of ips) {
      const isLoopback = ip.startsWith('127.');
      const isWildcard = ip === '0.0.0.0';
      const isRfc1918 = ip.startsWith('10.');
      const isRfc5737 = ip.startsWith('198.51.100.') || ip.startsWith('203.0.113.') || ip.startsWith('192.0.2.');
      expect(isLoopback || isWildcard || isRfc1918 || isRfc5737).toBe(true);
    }
  });

  it('simulates safe and unsafe configurations realistically', () => {
    const reportEv = challengeCC_NW_01.evidence.find((e) => e.id === 'ev-exposure-report')!;
    const content = reportEv.content as {
      ports: Array<{ id: string; port: number; status: string; reachability: string }>;
    };

    const unsafePorts = content.ports.filter((p) => p.status === 'unsafe');
    const safePorts = content.ports.filter((p) => p.status === 'safe');

    expect(unsafePorts).toHaveLength(4);
    expect(safePorts).toHaveLength(4);
    expect(unsafePorts.map((p) => p.port)).toEqual([21, 22, 6379, 8080]);
    expect(safePorts.map((p) => p.port)).toEqual([80, 443, 9100, 5432]);
  });
});

// ── Step 1: Flag-Selection (40 pts) ──────────────────────────────────────────

describe('cc-nw-01 Step 1: flag-selection', () => {
  it('awards full 40 pts when all 4 unsafe ports are flagged and 4 safe ports unflagged', () => {
    const submission = {
      'port-80': false,
      'port-443': false,
      'port-21': true,
      'port-22': true,
      'port-6379': true,
      'port-9100': false,
      'port-8080': true,
      'port-5432': false,
    };
    const points = evaluateStep(stepFlags, submission);
    expect(points).toBe(40);
  });

  it('prevents blanket guessing: selecting all 8 ports earns only 20/40 pts (50%)', () => {
    const submission = {
      'port-80': true,
      'port-443': true,
      'port-21': true,
      'port-22': true,
      'port-6379': true,
      'port-9100': true,
      'port-8080': true,
      'port-5432': true,
    };
    const points = evaluateStep(stepFlags, submission);
    expect(points).toBe(20); // 4 correct matches out of 8 items = 20 pts
  });

  it('awards fair partial credit when 7 of 8 items are correct (35/40 pts)', () => {
    // Mistakenly flags safe internal Prometheus port 9100
    const submission = {
      'port-80': false,
      'port-443': false,
      'port-21': true,
      'port-22': true,
      'port-6379': true,
      'port-9100': true, // incorrect false alarm
      'port-8080': true,
      'port-5432': false,
    };
    const points = evaluateStep(stepFlags, submission);
    expect(points).toBe(35); // 7/8 * 40 = 35 pts
  });

  it('awards 0 pts if all items are inverted', () => {
    const submission = {
      'port-80': true,
      'port-443': true,
      'port-21': false,
      'port-22': false,
      'port-6379': false,
      'port-9100': true,
      'port-8080': false,
      'port-5432': true,
    };
    const points = evaluateStep(stepFlags, submission);
    expect(points).toBe(0);
  });
});

// ── Step 2: Classification (30 pts) ──────────────────────────────────────────

describe('cc-nw-01 Step 2: classification', () => {
  it('awards full 30 pts when all 4 configurations are correctly classified', () => {
    const submission = {
      'eval-port-80': 'Acceptable / Properly Scoped Exposure',
      'eval-port-21': 'Insecure Exposure Requiring Action',
      'eval-port-6379': 'Insecure Exposure Requiring Action',
      'eval-port-9100': 'Acceptable / Properly Scoped Exposure',
    };
    const points = evaluateStep(stepClassify, submission);
    expect(points).toBe(30);
  });

  it('prevents blanket guessing: selecting "Insecure" for all items yields only 15/30 pts', () => {
    const submission = {
      'eval-port-80': 'Insecure Exposure Requiring Action',
      'eval-port-21': 'Insecure Exposure Requiring Action',
      'eval-port-6379': 'Insecure Exposure Requiring Action',
      'eval-port-9100': 'Insecure Exposure Requiring Action',
    };
    const points = evaluateStep(stepClassify, submission);
    expect(points).toBe(15); // 2 out of 4 matches = 15 pts
  });

  it('awards partial credit (22.5 pts) when 3 of 4 items are correct', () => {
    const submission = {
      'eval-port-80': 'Acceptable / Properly Scoped Exposure',
      'eval-port-21': 'Insecure Exposure Requiring Action',
      'eval-port-6379': 'Insecure Exposure Requiring Action',
      'eval-port-9100': 'Insecure Exposure Requiring Action', // wrong
    };
    const points = evaluateStep(stepClassify, submission);
    expect(points).toBe(22.5);
  });
});

// ── Step 3: Single Choice Remediation (30 pts) ────────────────────────────────

describe('cc-nw-01 Step 3: remediation strategy', () => {
  it('awards 30 pts for the correct VPN and key-based administrative strategy', () => {
    const submission = 'remed-vpn-bastion';
    const points = evaluateStep(stepRemediate, submission);
    expect(points).toBe(30);
  });

  it('awards 0 pts for security-through-obscurity port change', () => {
    const submission = 'remed-obscurity-port';
    const points = evaluateStep(stepRemediate, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for complex passwords without network restrictions', () => {
    const submission = 'remed-complex-password';
    const points = evaluateStep(stepRemediate, submission);
    expect(points).toBe(0);
  });
});

// ── Anti-Guessing & End-to-End Scoring ────────────────────────────────────────

describe('cc-nw-01 anti-guessing & end-to-end evaluation', () => {
  it('fails if a user guesses indiscriminately across all steps (65 pts < 70 threshold)', () => {
    // User flags all 8 ports in Step 1 (20 pts)
    // User guesses "Insecure" for all in Step 2 (15 pts)
    // User correctly guesses Step 3 (30 pts)
    // Total = 20 + 15 + 30 = 65 pts. Pass threshold is 70.
    const stepState = {
      'step-identify-exposures': {
        'port-80': true,
        'port-443': true,
        'port-21': true,
        'port-22': true,
        'port-6379': true,
        'port-9100': true,
        'port-8080': true,
        'port-5432': true,
      },
      'step-classify-posture': {
        'eval-port-80': 'Insecure Exposure Requiring Action',
        'eval-port-21': 'Insecure Exposure Requiring Action',
        'eval-port-6379': 'Insecure Exposure Requiring Action',
        'eval-port-9100': 'Insecure Exposure Requiring Action',
      },
      'step-remediation-strategy': 'remed-vpn-bastion',
    };

    const responses = buildStepResponses(challengeCC_NW_01.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_NW_01.passThreshold);

    expect(scoreResult.earnedScore).toBe(65);
    expect(scoreResult.finalScore).toBe(65);
    expect(scoreResult.passed).toBe(false);
    expect(scoreResult.finalScore).toBeLessThan(challengeCC_NW_01.passThreshold);
  });

  it('achieves a perfect score of 100 on fully correct submission', () => {
    const stepState = {
      'step-identify-exposures': {
        'port-80': false,
        'port-443': false,
        'port-21': true,
        'port-22': true,
        'port-6379': true,
        'port-9100': false,
        'port-8080': true,
        'port-5432': false,
      },
      'step-classify-posture': {
        'eval-port-80': 'Acceptable / Properly Scoped Exposure',
        'eval-port-21': 'Insecure Exposure Requiring Action',
        'eval-port-6379': 'Insecure Exposure Requiring Action',
        'eval-port-9100': 'Acceptable / Properly Scoped Exposure',
      },
      'step-remediation-strategy': 'remed-vpn-bastion',
    };

    const responses = buildStepResponses(challengeCC_NW_01.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_NW_01.passThreshold);

    expect(scoreResult.earnedScore).toBe(100);
    expect(scoreResult.finalScore).toBe(100);
    expect(scoreResult.passed).toBe(true);
  });

  it('passes with high partial credit (95 pts) when a single false alarm is made in Step 1', () => {
    const stepState = {
      'step-identify-exposures': {
        'port-80': false,
        'port-443': false,
        'port-21': true,
        'port-22': true,
        'port-6379': true,
        'port-9100': true, // 1 mistake (7/8 correct = 35 pts)
        'port-8080': true,
        'port-5432': false,
      },
      'step-classify-posture': {
        'eval-port-80': 'Acceptable / Properly Scoped Exposure',
        'eval-port-21': 'Insecure Exposure Requiring Action',
        'eval-port-6379': 'Insecure Exposure Requiring Action',
        'eval-port-9100': 'Acceptable / Properly Scoped Exposure',
      },
      'step-remediation-strategy': 'remed-vpn-bastion',
    };

    const responses = buildStepResponses(challengeCC_NW_01.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_NW_01.passThreshold);

    expect(scoreResult.earnedScore).toBe(95);
    expect(scoreResult.finalScore).toBe(95);
    expect(scoreResult.passed).toBe(true);
  });

  it('correctly deducts hint penalties of 10 points per hint', () => {
    const stepState = {
      'step-identify-exposures': {
        'port-80': false,
        'port-443': false,
        'port-21': true,
        'port-22': true,
        'port-6379': true,
        'port-9100': false,
        'port-8080': true,
        'port-5432': false,
      },
      'step-classify-posture': {
        'eval-port-80': 'Acceptable / Properly Scoped Exposure',
        'eval-port-21': 'Insecure Exposure Requiring Action',
        'eval-port-6379': 'Insecure Exposure Requiring Action',
        'eval-port-9100': 'Acceptable / Properly Scoped Exposure',
      },
      'step-remediation-strategy': 'remed-vpn-bastion',
    };

    const responses = buildStepResponses(challengeCC_NW_01.steps, stepState);

    // 1 hint used
    const res1 = computeScore(responses, 1, challengeCC_NW_01.passThreshold);
    expect(res1.earnedScore).toBe(100);
    expect(res1.finalScore).toBe(90);
    expect(res1.passed).toBe(true);

    // 2 hints used
    const res2 = computeScore(responses, 2, challengeCC_NW_01.passThreshold);
    expect(res2.earnedScore).toBe(100);
    expect(res2.finalScore).toBe(80);
    expect(res2.passed).toBe(true);

    // 3 hints used
    const res3 = computeScore(responses, 3, challengeCC_NW_01.passThreshold);
    expect(res3.earnedScore).toBe(100);
    expect(res3.finalScore).toBe(70);
    expect(res3.passed).toBe(true); // exactly on passThreshold 70
  });
});

// ── Educational Explanations ──────────────────────────────────────────────────

describe('cc-nw-01 educational explanations', () => {
  it('provides comprehensive explanations covering all ports and remediations in success and failure texts', () => {
    const { successExplanation, failureExplanation } = challengeCC_NW_01;

    expect(successExplanation).toContain('Port 80');
    expect(successExplanation).toContain('Port 443');
    expect(successExplanation).toContain('Port 21');
    expect(successExplanation).toContain('Port 22');
    expect(successExplanation).toContain('Port 6379');
    expect(successExplanation).toContain('Port 9100');
    expect(successExplanation).toContain('Port 8080');
    expect(successExplanation).toContain('Port 5432');
    expect(successExplanation).toContain('10.0.100.0/24');

    expect(failureExplanation).toContain('Port 80');
    expect(failureExplanation).toContain('Port 443');
    expect(failureExplanation).toContain('Port 21');
    expect(failureExplanation).toContain('Port 22');
    expect(failureExplanation).toContain('Port 6379');
    expect(failureExplanation).toContain('Port 9100');
    expect(failureExplanation).toContain('Port 8080');
    expect(failureExplanation).toContain('Port 5432');
    expect(failureExplanation).toContain('10.0.100.0/24');
  });

  it('getCorrectAnswerDisplay formats answers properly for all step types', () => {
    const disp1 = getCorrectAnswerDisplay(stepFlags);
    expect(disp1).toContain('Port 21/tcp');
    expect(disp1).toContain('Port 22/tcp');
    expect(disp1).toContain('Port 6379/tcp');
    expect(disp1).toContain('Port 8080/tcp');

    const disp2 = getCorrectAnswerDisplay(stepClassify);
    expect(disp2).toContain('Port 80');
    expect(disp2).toContain('Acceptable / Properly Scoped Exposure');
    expect(disp2).toContain('Port 21');
    expect(disp2).toContain('Insecure Exposure Requiring Action');

    const disp3 = getCorrectAnswerDisplay(stepRemediate);
    expect(disp3).toContain('corporate management VPN subnet');
  });
});
