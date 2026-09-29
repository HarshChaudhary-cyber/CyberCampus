/**
 * Challenge evaluator tests — cc-so-03 "Incident Response Timeline"
 * Room: Security Operations | Difficulty: Advanced
 *
 * Covers:
 * - Challenge data & registration (in ALL_CHALLENGES and LIVE_CHALLENGE_IDS)
 * - Evidence integrity (11 unsorted multi-system log events, RFC 2606 .example domains, RFC 5737 documentation IPs)
 * - Step 1: ordering interaction (40 pts, chronological attack chain, partial credit)
 * - Step 2: initial access identification (30 pts, single choice)
 * - Step 3: proportionate containment & evidence preservation (30 pts, single choice)
 * - Deterministic scoring & anti-guessing (leaving items scrambled fails < 70)
 * - Hint penalty computation (-10 pts per hint, floor 0)
 * - Full verification of cc-so-02 corrections (Niall Gallagher identity and eu-central-1 / eu-west-1 AWS regions)
 * - CyberCampus 6-challenge coexistence
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import { challengeCC_SO_03 } from '../challenges/data/cc-so-03';
import { challengeCC_SO_02 } from '../challenges/data/cc-so-02';
import { challengeCC_PH_02 } from '../challenges/data/cc-ph-02';
import { getChallenge, getRoom, LIVE_CHALLENGE_IDS, ROOMS } from '../challenges';
import { computeScore } from '../store';

const [stepOrder, stepInitialAccess, stepContainment] = challengeCC_SO_03.steps;

// ── Registration & Metadata ──────────────────────────────────────────────────

describe('cc-so-03 registration & metadata', () => {
  it('is registered in CHALLENGE_MAP via getChallenge', () => {
    const ch = getChallenge('cc-so-03');
    expect(ch).toBeDefined();
    expect(ch?.id).toBe('cc-so-03');
    expect(ch?.title).toBe('Incident Response Timeline');
    expect(ch?.difficulty).toBe('advanced');
    expect(ch?.roomId).toBe('secops');
  });

  it('marks all three Security Operations challenges as live in LIVE_CHALLENGE_IDS', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-so-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-03')).toBe(true);
  });

  it('preserves all three Phishing Defense challenges as live in LIVE_CHALLENGE_IDS', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-03')).toBe(true);
  });

  it('Security Operations room registers all 3 challenges in challengeIds', () => {
    const secopsRoom = getRoom('secops');
    expect(secopsRoom).toBeDefined();
    expect(secopsRoom?.challengeIds).toEqual(['cc-so-01', 'cc-so-02', 'cc-so-03']);
  });

  it('step pointValues sum to exactly 100', () => {
    const total = challengeCC_SO_03.steps.reduce((sum, s) => sum + s.pointValue, 0);
    expect(total).toBe(100);
  });

  it('passThreshold is 70', () => {
    expect(challengeCC_SO_03.passThreshold).toBe(70);
  });

  it('has 3 helpful hints and advanced incident response skills', () => {
    expect(challengeCC_SO_03.hints).toHaveLength(3);
    expect(challengeCC_SO_03.skills).toContain('incident-timeline-reconstruction');
    expect(challengeCC_SO_03.skills).toContain('multi-source-log-correlation');
    expect(challengeCC_SO_03.skills).toContain('initial-access-analysis');
    expect(challengeCC_SO_03.skills).toContain('attack-chain-mapping');
    expect(challengeCC_SO_03.skills).toContain('incident-containment-and-preservation');
  });
});

// ── Evidence Integrity ────────────────────────────────────────────────────────

describe('cc-so-03 evidence integrity', () => {
  it('contains 2 evidence items: telemetry dossier and SOP IR-302 briefing', () => {
    expect(challengeCC_SO_03.evidence).toHaveLength(2);
    expect(challengeCC_SO_03.evidence.map((e) => e.id)).toEqual(['ev-unsorted-logs', 'ev-incident-briefing']);
  });

  it('telemetry evidence contains exactly 11 multi-system log events', () => {
    const logsEv = challengeCC_SO_03.evidence.find((e) => e.id === 'ev-unsorted-logs')!;
    const content = logsEv.content as {
      isTimeline: boolean;
      events: Array<{ id: string; timestamp: string; system: string; sourceIp: string }>;
    };
    expect(content.isTimeline).toBe(true);
    expect(content.events).toHaveLength(11);
  });

  it('telemetry events are initially presented out of chronological order (arrival order)', () => {
    const logsEv = challengeCC_SO_03.evidence.find((e) => e.id === 'ev-unsorted-logs')!;
    const content = logsEv.content as {
      events: Array<{ id: string; timestamp: string }>;
    };
    // First event in ingestion list is 16:48 UTC (log-01), followed by 14:22 UTC (log-02)
    expect(content.events[0].id).toBe('log-01');
    expect(content.events[0].timestamp).toContain('16:48');
    expect(content.events[1].id).toBe('log-02');
    expect(content.events[1].timestamp).toContain('14:22');
  });

  it('all domains use RFC 2606 .example and external IPs use RFC 5737 documentation blocks', () => {
    const evidenceStr = JSON.stringify(challengeCC_SO_03.evidence);
    expect(evidenceStr).toContain('tracking.veridian-logistics.example');
    expect(evidenceStr).toMatch(/198\.51\.100\.\d+/);
    expect(evidenceStr).toMatch(/203\.0\.113\.\d+/);

    const externalDomains = evidenceStr.match(/\b[a-zA-Z0-9-]+\.(com|org|net|io|co|xyz)\b/g) ?? [];
    for (const d of externalDomains) {
      expect(d).toMatch(/example/);
    }
  });

  it('briefing references SOP IR-302 standards for attack chain reconstruction and evidence preservation', () => {
    const briefingEv = challengeCC_SO_03.evidence.find((e) => e.id === 'ev-incident-briefing')!;
    const content = briefingEv.content as {
      policy: { code: string; rules: string[] };
    };
    expect(content.policy.code).toBe('SOP IR-302');
    const rulesStr = content.policy.rules.join(' ');
    expect(rulesStr).toContain('Chronological Reconstruction');
    expect(rulesStr).toContain('Preservation Before Destruction');
    expect(rulesStr).toContain('Proportionate Containment');
  });
});

// ── Step 1: Attack Chain Ordering Scoring ─────────────────────────────────────

describe('cc-so-03 Step 1 — Attack Chain Chronological Ordering', () => {
  const correctOrder = [
    'phase-exploit-upload',
    'phase-c2-shell',
    'phase-priv-esc',
    'phase-lateral-recon',
    'phase-db-dump',
    'phase-exfiltration',
  ];

  it('awards full 40 points when all 6 incident milestones are in exact chronological order', () => {
    const score = evaluateStep(stepOrder, correctOrder);
    expect(score).toBe(40);
  });

  it('accepts stringified JSON array in evalOrdering and awards full 40 points', () => {
    const score = evaluateStep(stepOrder, JSON.stringify(correctOrder));
    expect(score).toBe(40);
  });

  it('awards partial credit (26.7 pts) when 4 of 6 milestones are in their correct positions', () => {
    // Swap 2 adjacent items (db-dump and exfil)
    const partialOrder = [
      'phase-exploit-upload', // correct (pos 0)
      'phase-c2-shell',        // correct (pos 1)
      'phase-priv-esc',        // correct (pos 2)
      'phase-lateral-recon',   // correct (pos 3)
      'phase-exfiltration',    // wrong (should be db-dump)
      'phase-db-dump',         // wrong (should be exfil)
    ];
    // 4 / 6 * 40 = 26.666... -> 26.7
    const score = evaluateStep(stepOrder, partialOrder);
    expect(score).toBeCloseTo(26.7, 1);
  });

  it('awards 0 points if user leaves the initial scrambled order unchanged (0/6 in position)', () => {
    const defaultScrambledOrder = stepOrder.items.map((i) => i.id);
    const score = evaluateStep(stepOrder, defaultScrambledOrder);
    expect(score).toBe(0);
  });

  it('awards 0 points when completely inverted', () => {
    const inverted = [...correctOrder].reverse();
    // Reversing 6 items: no item remains in its original position
    const score = evaluateStep(stepOrder, inverted);
    expect(score).toBe(0);
  });

  it('correct answer display formats chronological list with numbers 1 through 6', () => {
    const display = getCorrectAnswerDisplay(stepOrder);
    expect(display).toContain('1. Arbitrary file upload exploit');
    expect(display).toContain('2. Interactive reverse TCP shell');
    expect(display).toContain('3. Local privilege escalation');
    expect(display).toContain('4. Internal network SYN scan');
    expect(display).toContain('5. Bulk database dump');
    expect(display).toContain('6. High-volume encrypted outbound file transfer');
  });
});

// ── Step 2: Initial Access Identification ────────────────────────────────────

describe('cc-so-03 Step 2 — Initial Access Identification', () => {
  it('awards 30 points for identifying arbitrary file upload as the initial entry vector', () => {
    const score = evaluateStep(stepInitialAccess, 'opt-file-upload');
    expect(score).toBe(30);
  });

  it('awards 0 points for confusing lateral Kerberoasting with initial access', () => {
    const score = evaluateStep(stepInitialAccess, 'opt-kerberoasting');
    expect(score).toBe(0);
  });

  it('awards 0 points for external SQL injection distractor', () => {
    const score = evaluateStep(stepInitialAccess, 'opt-sql-injection');
    expect(score).toBe(0);
  });

  it('awards 0 points for credential phishing distractor', () => {
    const score = evaluateStep(stepInitialAccess, 'opt-credential-phishing');
    expect(score).toBe(0);
  });

  it('correct answer display specifies file upload web shell vulnerability', () => {
    const display = getCorrectAnswerDisplay(stepInitialAccess);
    expect(display).toContain('file upload vulnerability in /api/v1/document-upload');
  });
});

// ── Step 3: Containment and Evidence Preservation ─────────────────────────────

describe('cc-so-03 Step 3 — Proportionate Containment & Preservation', () => {
  it('awards 30 points for network isolation, C2 termination, memory acquisition, and credential revocation', () => {
    const score = evaluateStep(stepContainment, 'opt-contain-preserve');
    expect(score).toBe(30);
  });

  it('awards 0 points for destructive hard-reboot and premature disk wipe', () => {
    const score = evaluateStep(stepContainment, 'opt-reboot-wipe');
    expect(score).toBe(0);
  });

  it('awards 0 points for ineffective perimeter IP block that leaves root persistence active', () => {
    const score = evaluateStep(stepContainment, 'opt-block-ip-only');
    expect(score).toBe(0);
  });

  it('awards 0 points for hot-patching application without addressing server root compromise', () => {
    const score = evaluateStep(stepContainment, 'opt-patch-only');
    expect(score).toBe(0);
  });

  it('correct answer display outlines proper forensic containment protocol', () => {
    const display = getCorrectAnswerDisplay(stepContainment);
    expect(display).toContain('isolate app-srv-02');
    expect(display).toContain('volatile memory (RAM) dumps');
  });
});

// ── End-to-End Scoring & Anti-Guessing Mechanics ─────────────────────────────

describe('cc-so-03 End-to-End Scoring Scenarios', () => {
  const perfectOrder = [
    'phase-exploit-upload',
    'phase-c2-shell',
    'phase-priv-esc',
    'phase-lateral-recon',
    'phase-db-dump',
    'phase-exfiltration',
  ];

  it('perfect attempt scores 100/100 and passes', () => {
    const stepState = {
      'step-order-events': perfectOrder,
      'step-initial-access': 'opt-file-upload',
      'step-containment': 'opt-contain-preserve',
    };
    const responses = buildStepResponses(challengeCC_SO_03.steps, stepState);
    const result = computeScore(responses, 0, challengeCC_SO_03.passThreshold);

    expect(result.earnedScore).toBe(100);
    expect(result.finalScore).toBe(100);
    expect(result.passed).toBe(true);
  });

  it('leaving Step 1 scrambled FAILS even if Steps 2 and 3 are guessed correctly (0 + 30 + 30 = 60 < 70)', () => {
    const defaultScrambledOrder = stepOrder.items.map((i) => i.id);
    const stepState = {
      'step-order-events': defaultScrambledOrder,
      'step-initial-access': 'opt-file-upload',
      'step-containment': 'opt-contain-preserve',
    };
    const responses = buildStepResponses(challengeCC_SO_03.steps, stepState);
    const result = computeScore(responses, 0, challengeCC_SO_03.passThreshold);

    expect(result.earnedScore).toBe(60);
    expect(result.finalScore).toBe(60);
    expect(result.passed).toBe(false);
  });

  it('minor ordering mistake in Step 1 (4/6 correct = 26.7) with correct Steps 2 and 3 PASSES (86.7 >= 70)', () => {
    const partialOrder = [
      'phase-exploit-upload',
      'phase-c2-shell',
      'phase-priv-esc',
      'phase-lateral-recon',
      'phase-exfiltration',
      'phase-db-dump',
    ];
    const stepState = {
      'step-order-events': partialOrder,
      'step-initial-access': 'opt-file-upload',
      'step-containment': 'opt-contain-preserve',
    };
    const responses = buildStepResponses(challengeCC_SO_03.steps, stepState);
    const result = computeScore(responses, 0, challengeCC_SO_03.passThreshold);

    expect(result.earnedScore).toBeCloseTo(86.7, 1);
    expect(result.finalScore).toBeCloseTo(86.7, 1);
    expect(result.passed).toBe(true);
  });

  it('hints deduct 10 points per hint from final earned score', () => {
    const stepState = {
      'step-order-events': perfectOrder,
      'step-initial-access': 'opt-file-upload',
      'step-containment': 'opt-contain-preserve',
    };
    const responses = buildStepResponses(challengeCC_SO_03.steps, stepState);

    expect(computeScore(responses, 1, challengeCC_SO_03.passThreshold).finalScore).toBe(90);
    expect(computeScore(responses, 2, challengeCC_SO_03.passThreshold).finalScore).toBe(80);
    const threeHints = computeScore(responses, 3, challengeCC_SO_03.passThreshold);
    expect(threeHints.finalScore).toBe(70);
    expect(threeHints.passed).toBe(true);
  });

  it('success explanation reconstructs the 11-step lifecycle and explains forensic containment', () => {
    expect(challengeCC_SO_03.successExplanation).toContain('14:05:12 UTC: External reconnaissance');
    expect(challengeCC_SO_03.successExplanation).toContain('14:22:30 UTC: Arbitrary file upload exploit');
    expect(challengeCC_SO_03.successExplanation).toContain('14:23:05 UTC: Web shell executed');
    expect(challengeCC_SO_03.successExplanation).toContain('15:02:44 UTC: Privilege escalation');
    expect(challengeCC_SO_03.successExplanation).toContain('16:12:02 UTC: Kerberoasting');
    expect(challengeCC_SO_03.successExplanation).toContain('17:15:30 UTC: Mass database dump');
    expect(challengeCC_SO_03.successExplanation).toContain('17:42:15 UTC: Outbound exfiltration transfer');
    expect(challengeCC_SO_03.successExplanation).toContain('18:05:00 UTC: Anti-forensics log shredding');
  });

  it('failure explanation reinforces initial access distinction and anti-destruction principles', () => {
    expect(challengeCC_SO_03.failureExplanation).toContain('Initial Access: 14:22 UTC');
    expect(challengeCC_SO_03.failureExplanation).toContain('Never reboot or wipe compromised servers');
    expect(challengeCC_SO_03.failureExplanation).toContain('volatile memory (RAM)');
  });
});

// ── Verification of cc-so-02 Corrections (Task 4C Requirements) ─────────────

describe('Verification of cc-so-02 Corrections', () => {
  it('senior DBA in cc-so-02 is Niall Gallagher with email n.gallagher@veridian-logistics.example', () => {
    const ch = challengeCC_SO_02;
    const baseline = ch.evidence.find((e) => e.id === 'ev-user-baseline')!;
    const content = baseline.content as {
      employee: { name: string; officialEmail: string };
    };
    expect(content.employee.name).toBe('Niall Gallagher');
    expect(content.employee.officialEmail).toBe('n.gallagher@veridian-logistics.example');
  });

  it('senior DBA in cc-so-02 does not reuse Marcus Vance (who is CEO EA in cc-ph-02)', () => {
    // Verify Marcus Vance is EA in cc-ph-02
    expect(challengeCC_PH_02.failureExplanation).toContain('Marcus Vance');

    // Verify cc-so-02 does NOT use Marcus Vance anywhere
    const so02String = JSON.stringify(challengeCC_SO_02);
    expect(so02String).not.toContain('Marcus Vance');
    expect(so02String).not.toContain('m.vance');
    expect(so02String).not.toContain('VANCE');
  });

  it('Frankfurt is referenced as eu-central-1 and Ireland is referenced as eu-west-1 in cc-so-02', () => {
    const so02String = JSON.stringify(challengeCC_SO_02);
    expect(so02String).toContain('eu-central-1');
    expect(so02String).toContain('eu-west-1');
    expect(challengeCC_SO_02.briefing).toContain('Ireland (eu-west-1) and Frankfurt (eu-central-1)');
    expect(challengeCC_SO_02.successExplanation).toContain('Ireland (eu-west-1)');
    expect(challengeCC_SO_02.successExplanation).toContain('Frankfurt (eu-central-1)');
  });
});

// ── Full Multi-Challenge Coexistence ─────────────────────────────────────────

describe('CyberCampus Full Coexistence (6 Playable Challenges)', () => {
  it('all 6 challenges are registered and accessible via getChallenge', () => {
    const ids = ['cc-ph-01', 'cc-ph-02', 'cc-ph-03', 'cc-so-01', 'cc-so-02', 'cc-so-03'];
    for (const id of ids) {
      const ch = getChallenge(id);
      expect(ch).toBeDefined();
      expect(ch?.id).toBe(id);
    }
  });

  it('all 5 campus rooms exist in ROOMS and SecOps room has 3 live challenges', () => {
    expect(ROOMS).toHaveLength(5);
    const secops = getRoom('secops');
    expect(secops?.challengeIds).toHaveLength(3);
    for (const chId of secops!.challengeIds) {
      expect(LIVE_CHALLENGE_IDS.has(chId)).toBe(true);
    }
  });
});
