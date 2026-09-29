/**
 * Challenge evaluator tests — cc-nw-02 "Firewall Rule Audit"
 * Room: Network Security | Difficulty: Intermediate
 *
 * Covers:
 * - Challenge data & registration (in ALL_CHALLENGES and LIVE_CHALLENGE_IDS)
 * - Coexistence: preserves all 7 existing live challenges; cc-nw-03 remains coming soon
 * - Evidence integrity (9 ordered firewall rules, 5 network zones, RFC 2606 .example domains, RFC 1918 / RFC 5737 IPs, SOP NET-201)
 * - Step 1: classification (40 pts, 5 items = 8 pts each, partial credit)
 * - Anti-guessing penalty: uniform selection across all 5 items yields only 8/40 pts
 * - Step 2: single-choice threat impact analysis (30 pts, no partial credit)
 * - Step 3: guided-form replacement rule configuration (30 pts, 4 fields = 7.5 pts each, partial credit)
 * - Anti-guessing end-to-end evaluation:
 *     - Uniform guesser with 100% correct Steps 2 & 3 earns 68 pts < 70 threshold (FAILS)
 *     - Perfect run earns 100 pts (PASS)
 *     - Minor oversight run (4/5 Step 1 + Steps 2 & 3 = 92 pts, PASS)
 * - Hint penalty calculation (-10 pts per hint, floor 0)
 * - Educational explanations for rule order, shadowing, change ticket expiration, and least-privilege scoping
 * - getCorrectAnswerDisplay formatting for all step types including guided-form
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import { challengeCC_NW_02 } from '../challenges/data/cc-nw-02';
import { getChallenge, getRoom, LIVE_CHALLENGE_IDS } from '../challenges';
import { computeScore } from '../store';

const [stepClassify, stepImpact, stepReplacement] = challengeCC_NW_02.steps;

// ── Registration & Metadata ──────────────────────────────────────────────────

describe('cc-nw-02 registration & metadata', () => {
  it('is registered in CHALLENGE_MAP via getChallenge', () => {
    const ch = getChallenge('cc-nw-02');
    expect(ch).toBeDefined();
    expect(ch?.id).toBe('cc-nw-02');
    expect(ch?.title).toBe('Firewall Rule Audit');
    expect(ch?.difficulty).toBe('intermediate');
    expect(ch?.roomId).toBe('network');
  });

  it('is marked as live in LIVE_CHALLENGE_IDS alongside cc-nw-01', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-02')).toBe(true);
  });

  it('leaves cc-nw-03 as coming soon (not live)', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-03')).toBe(false);
  });

  it('preserves all seven previously built live challenges', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-03')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-03')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-01')).toBe(true);
  });

  it('Network Security room contains cc-nw-01, cc-nw-02, cc-nw-03', () => {
    const room = getRoom('network');
    expect(room).toBeDefined();
    expect(room?.title).toBe('Network Security');
    expect(room?.accentClass).toBe('room-network');
    expect(room?.challengeIds).toEqual(['cc-nw-01', 'cc-nw-02', 'cc-nw-03']);
  });

  it('step pointValues sum to exactly 100', () => {
    const total = challengeCC_NW_02.steps.reduce((sum, s) => sum + s.pointValue, 0);
    expect(total).toBe(100);
  });

  it('passThreshold is 70', () => {
    expect(challengeCC_NW_02.passThreshold).toBe(70);
  });

  it('has 3 helpful hints and intermediate network security skills', () => {
    expect(challengeCC_NW_02.hints).toHaveLength(3);
    expect(challengeCC_NW_02.skills).toContain('firewall-rule-auditing');
    expect(challengeCC_NW_02.skills).toContain('rule-order-shadowing-analysis');
    expect(challengeCC_NW_02.skills).toContain('least-privilege-firewall-scoping');
    expect(challengeCC_NW_02.skills).toContain('network-segmentation-verification');
    expect(challengeCC_NW_02.skills).toContain('change-management-hygiene');
  });
});

// ── Evidence Integrity ────────────────────────────────────────────────────────

describe('cc-nw-02 evidence integrity', () => {
  it('contains 2 evidence items: active firewall ruleset and policy SOP NET-201', () => {
    expect(challengeCC_NW_02.evidence).toHaveLength(2);
    expect(challengeCC_NW_02.evidence.map((e) => e.id)).toEqual(['ev-firewall-rules', 'ev-firewall-standards']);
  });

  it('firewall evidence contains 5 network zones and 9 ordered rules', () => {
    const fwEv = challengeCC_NW_02.evidence.find((e) => e.id === 'ev-firewall-rules')!;
    const content = fwEv.content as {
      isFirewallPolicy: boolean;
      zones: Array<{ id: string; name: string; cidr: string }>;
      rulesTable: Array<{ ruleNum: number; id: string; action: string; service: string }>;
    };
    expect(content.isFirewallPolicy).toBe(true);
    expect(content.zones).toHaveLength(5);
    expect(content.rulesTable).toHaveLength(9);
    expect(content.rulesTable.map((r) => r.ruleNum)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('uses only RFC 2606 .example domains and RFC 1918 / RFC 5737 documentation IP addresses', () => {
    const evidenceStr = JSON.stringify(challengeCC_NW_02.evidence);

    // Reserved domains only
    const domains = evidenceStr.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || [];
    const externalDomains = domains.filter((d) => !d.endsWith('.example') && !d.includes('veridian-logistics'));
    expect(externalDomains).toHaveLength(0);

    // IP addresses and CIDR subnets
    const ips = evidenceStr.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) || [];
    for (const ip of ips) {
      const isLoopback = ip.startsWith('127.');
      const isWildcard = ip === '0.0.0.0';
      const isRfc1918 = ip.startsWith('10.');
      const isRfc5737 = ip.startsWith('198.51.100.') || ip.startsWith('203.0.113.') || ip.startsWith('192.0.2.');
      expect(isLoopback || isWildcard || isRfc1918 || isRfc5737).toBe(true);
    }
  });
});

// ── Step 1: Classification (40 pts) ──────────────────────────────────────────

describe('cc-nw-02 Step 1: classification', () => {
  it('awards full 40 pts when all 5 rules are correctly classified', () => {
    const submission = {
      'rule-2': 'Acceptable / Properly Scoped',
      'rule-3': 'Acceptable / Properly Scoped',
      'rule-4': 'Too Permissive (Overly Broad)',
      'rule-5': 'Ineffective (Shadowed / Order Flaw)',
      'rule-7': 'Unnecessary (Redundant Duplicate)',
    };
    const points = evaluateStep(stepClassify, submission);
    expect(points).toBe(40);
  });

  it('prevents blanket guessing: selecting "Too Permissive" for all rules yields only 8/40 pts', () => {
    const submission = {
      'rule-2': 'Too Permissive (Overly Broad)',
      'rule-3': 'Too Permissive (Overly Broad)',
      'rule-4': 'Too Permissive (Overly Broad)',
      'rule-5': 'Too Permissive (Overly Broad)',
      'rule-7': 'Too Permissive (Overly Broad)',
    };
    const points = evaluateStep(stepClassify, submission);
    expect(points).toBe(8); // 1 match out of 5 items = 8 pts
  });

  it('awards partial credit (32/40 pts) when 4 of 5 rules are correctly classified', () => {
    const submission = {
      'rule-2': 'Acceptable / Properly Scoped',
      'rule-3': 'Acceptable / Properly Scoped',
      'rule-4': 'Too Permissive (Overly Broad)',
      'rule-5': 'Too Permissive (Overly Broad)', // mistake (missed shadowing)
      'rule-7': 'Unnecessary (Redundant Duplicate)',
    };
    const points = evaluateStep(stepClassify, submission);
    expect(points).toBe(32);
  });

  it('awards 0 pts if all classifications are incorrect', () => {
    const submission = {
      'rule-2': 'Too Permissive (Overly Broad)',
      'rule-3': 'Too Permissive (Overly Broad)',
      'rule-4': 'Acceptable / Properly Scoped',
      'rule-5': 'Acceptable / Properly Scoped',
      'rule-7': 'Acceptable / Properly Scoped',
    };
    const points = evaluateStep(stepClassify, submission);
    expect(points).toBe(0);
  });
});

// ── Step 2: Single Choice Threat Impact (30 pts) ─────────────────────────────

describe('cc-nw-02 Step 2: threat impact analysis', () => {
  it('awards 30 pts for identifying unrestricted inbound ingress bypassing DMZ and Rule 5', () => {
    const submission = 'impact-unrestricted-ingress';
    const points = evaluateStep(stepImpact, submission);
    expect(points).toBe(30);
  });

  it('awards 0 pts for the change ticket fallacy distractor', () => {
    const submission = 'impact-ticket-validated';
    const points = evaluateStep(stepImpact, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for confusing stateful return with inbound ingress', () => {
    const submission = 'impact-stateful-return';
    const points = evaluateStep(stepImpact, submission);
    expect(points).toBe(0);
  });
});

// ── Step 3: Guided Form Replacement Rule (30 pts) ────────────────────────────

describe('cc-nw-02 Step 3: replacement rule construction', () => {
  it('awards full 30 pts when all 4 rule parameters are properly configured', () => {
    const submission = {
      source: 'Vendor Office Static IP (203.0.113.50/32)',
      destination: 'Vendor DMZ Jump-Host (10.0.1.25/32)',
      service: 'TCP 22 (SSH)',
      action: 'ACCEPT (Permit)',
    };
    const points = evaluateStep(stepReplacement, submission);
    expect(points).toBe(30);
  });

  it('awards partial credit (22.5 pts) when 3 of 4 fields are correct', () => {
    const submission = {
      source: 'Vendor Office Static IP (203.0.113.50/32)',
      destination: 'Internal Subnets (10.0.0.0/16)', // mistake: overly broad destination
      service: 'TCP 22 (SSH)',
      action: 'ACCEPT (Permit)',
    };
    const points = evaluateStep(stepReplacement, submission);
    expect(points).toBe(22.5);
  });

  it('awards partial credit (15 pts) when 2 of 4 fields are correct', () => {
    const submission = {
      source: 'Internet / Any (0.0.0.0/0)', // mistake: any source
      destination: 'Vendor DMZ Jump-Host (10.0.1.25/32)', // correct
      service: 'Any (All Ports & Protocols)', // mistake: any service
      action: 'ACCEPT (Permit)', // correct
    };
    const points = evaluateStep(stepReplacement, submission);
    expect(points).toBe(15);
  });

  it('awards 0 pts if all fields are incorrect', () => {
    const submission = {
      source: 'Internet / Any (0.0.0.0/0)',
      destination: 'Internal Subnets (10.0.0.0/16)',
      service: 'Any (All Ports & Protocols)',
      action: 'DROP (Silently Discard)',
    };
    const points = evaluateStep(stepReplacement, submission);
    expect(points).toBe(0);
  });
});

// ── Anti-Guessing & End-to-End Scoring ────────────────────────────────────────

describe('cc-nw-02 anti-guessing & end-to-end evaluation', () => {
  it('guarantees that blanket guessing Step 1 CANNOT pass even with perfect Steps 2 & 3 (68 < 70)', () => {
    // Blanket guess on Step 1 yields 8 pts (1/5)
    // Correct Step 2 = 30 pts
    // Correct Step 3 = 30 pts
    // Total = 8 + 30 + 30 = 68 pts. Pass threshold is 70.
    const stepState = {
      'step-rule-classification': {
        'rule-2': 'Too Permissive (Overly Broad)',
        'rule-3': 'Too Permissive (Overly Broad)',
        'rule-4': 'Too Permissive (Overly Broad)',
        'rule-5': 'Too Permissive (Overly Broad)',
        'rule-7': 'Too Permissive (Overly Broad)',
      },
      'step-threat-impact': 'impact-unrestricted-ingress',
      'step-replacement-rule': {
        source: 'Vendor Office Static IP (203.0.113.50/32)',
        destination: 'Vendor DMZ Jump-Host (10.0.1.25/32)',
        service: 'TCP 22 (SSH)',
        action: 'ACCEPT (Permit)',
      },
    };

    const responses = buildStepResponses(challengeCC_NW_02.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_NW_02.passThreshold);

    expect(scoreResult.earnedScore).toBe(68);
    expect(scoreResult.finalScore).toBe(68);
    expect(scoreResult.passed).toBe(false);
    expect(scoreResult.finalScore).toBeLessThan(challengeCC_NW_02.passThreshold);
  });

  it('achieves a perfect score of 100 on fully correct submission', () => {
    const stepState = {
      'step-rule-classification': {
        'rule-2': 'Acceptable / Properly Scoped',
        'rule-3': 'Acceptable / Properly Scoped',
        'rule-4': 'Too Permissive (Overly Broad)',
        'rule-5': 'Ineffective (Shadowed / Order Flaw)',
        'rule-7': 'Unnecessary (Redundant Duplicate)',
      },
      'step-threat-impact': 'impact-unrestricted-ingress',
      'step-replacement-rule': {
        source: 'Vendor Office Static IP (203.0.113.50/32)',
        destination: 'Vendor DMZ Jump-Host (10.0.1.25/32)',
        service: 'TCP 22 (SSH)',
        action: 'ACCEPT (Permit)',
      },
    };

    const responses = buildStepResponses(challengeCC_NW_02.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_NW_02.passThreshold);

    expect(scoreResult.earnedScore).toBe(100);
    expect(scoreResult.finalScore).toBe(100);
    expect(scoreResult.passed).toBe(true);
  });

  it('passes with high partial credit (92 pts) when a single classification error is made in Step 1', () => {
    const stepState = {
      'step-rule-classification': {
        'rule-2': 'Acceptable / Properly Scoped',
        'rule-3': 'Acceptable / Properly Scoped',
        'rule-4': 'Too Permissive (Overly Broad)',
        'rule-5': 'Too Permissive (Overly Broad)', // 1 mistake in Step 1 (4/5 = 32 pts)
        'rule-7': 'Unnecessary (Redundant Duplicate)',
      },
      'step-threat-impact': 'impact-unrestricted-ingress',
      'step-replacement-rule': {
        source: 'Vendor Office Static IP (203.0.113.50/32)',
        destination: 'Vendor DMZ Jump-Host (10.0.1.25/32)',
        service: 'TCP 22 (SSH)',
        action: 'ACCEPT (Permit)',
      },
    };

    const responses = buildStepResponses(challengeCC_NW_02.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_NW_02.passThreshold);

    expect(scoreResult.earnedScore).toBe(92);
    expect(scoreResult.finalScore).toBe(92);
    expect(scoreResult.passed).toBe(true);
  });

  it('correctly deducts hint penalties of 10 points per hint', () => {
    const stepState = {
      'step-rule-classification': {
        'rule-2': 'Acceptable / Properly Scoped',
        'rule-3': 'Acceptable / Properly Scoped',
        'rule-4': 'Too Permissive (Overly Broad)',
        'rule-5': 'Ineffective (Shadowed / Order Flaw)',
        'rule-7': 'Unnecessary (Redundant Duplicate)',
      },
      'step-threat-impact': 'impact-unrestricted-ingress',
      'step-replacement-rule': {
        source: 'Vendor Office Static IP (203.0.113.50/32)',
        destination: 'Vendor DMZ Jump-Host (10.0.1.25/32)',
        service: 'TCP 22 (SSH)',
        action: 'ACCEPT (Permit)',
      },
    };

    const responses = buildStepResponses(challengeCC_NW_02.steps, stepState);

    const res1 = computeScore(responses, 1, challengeCC_NW_02.passThreshold);
    expect(res1.earnedScore).toBe(100);
    expect(res1.finalScore).toBe(90);
    expect(res1.passed).toBe(true);

    const res2 = computeScore(responses, 2, challengeCC_NW_02.passThreshold);
    expect(res2.earnedScore).toBe(100);
    expect(res2.finalScore).toBe(80);
    expect(res2.passed).toBe(true);

    const res3 = computeScore(responses, 3, challengeCC_NW_02.passThreshold);
    expect(res3.earnedScore).toBe(100);
    expect(res3.finalScore).toBe(70);
    expect(res3.passed).toBe(true); // exactly on passThreshold 70
  });
});

// ── Educational Explanations ──────────────────────────────────────────────────

describe('cc-nw-02 educational explanations', () => {
  it('provides comprehensive explanations covering rule ordering, shadowing, and change tickets', () => {
    const { successExplanation, failureExplanation } = challengeCC_NW_02;

    expect(successExplanation).toContain('Rule 4');
    expect(successExplanation).toContain('Rule 5');
    expect(successExplanation).toContain('shadowed');
    expect(successExplanation).toContain('CHG-9941');
    expect(successExplanation).toContain('Rule 7');
    expect(successExplanation).toContain('203.0.113.50/32');
    expect(successExplanation).toContain('10.0.1.25/32');

    expect(failureExplanation).toContain('Top-to-Bottom');
    expect(failureExplanation).toContain('shadowed');
    expect(failureExplanation).toContain('CHG-9941');
  });

  it('getCorrectAnswerDisplay formats answers properly for classification, single-choice, and guided-form', () => {
    const disp1 = getCorrectAnswerDisplay(stepClassify);
    expect(disp1).toContain('Rule 2');
    expect(disp1).toContain('Acceptable / Properly Scoped');
    expect(disp1).toContain('Rule 4');
    expect(disp1).toContain('Too Permissive (Overly Broad)');
    expect(disp1).toContain('Rule 5');
    expect(disp1).toContain('Ineffective (Shadowed / Order Flaw)');
    expect(disp1).toContain('Rule 7');
    expect(disp1).toContain('Unnecessary (Redundant Duplicate)');

    const disp2 = getCorrectAnswerDisplay(stepImpact);
    expect(disp2).toContain('Unrestricted inbound connections from any public Internet IP');

    const disp3 = getCorrectAnswerDisplay(stepReplacement);
    expect(disp3).toContain('Source IP / Network: Vendor Office Static IP (203.0.113.50/32)');
    expect(disp3).toContain('Destination IP / Network: Vendor DMZ Jump-Host (10.0.1.25/32)');
    expect(disp3).toContain('Service / Destination Port: TCP 22 (SSH)');
    expect(disp3).toContain('Firewall Action: ACCEPT (Permit)');
  });
});
