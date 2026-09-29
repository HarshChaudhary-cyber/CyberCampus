/**
 * Challenge evaluator tests — cc-nw-02 "Firewall Rule Audit"
 * Room: Network Security | Difficulty: Intermediate
 *
 * Covers:
 * - Challenge data & registration (in ALL_CHALLENGES and LIVE_CHALLENGE_IDS)
 * - Coexistence: preserves all 7 existing live challenges; cc-nw-03 remains coming soon
 * - Evidence integrity:
 *     - 9 ordered firewall rules, 5 network zones, RFC 2606 .example domains, RFC 1918 / RFC 5737 IPs
 *     - Explicit NAT Ingress Architecture with VIP mappings (198.51.100.0/24 -> 10.0.x.x)
 *     - Enterprise Firewall Policy SOP NET-201
 * - Relationship enforcement (Task 5B.1):
 *     - Rule 3 Least-Privilege Scoping: destination strictly restricted to Admin Bastion (/32),
 *       satisfying SOP NET-201 and justifying "Acceptable / Properly Scoped" classification.
 *     - Network Ingress & Post-DNAT Model: packets arrive at public VIPs, pre-routing translates to
 *       internal targets, and filter rules match post-DNAT internal addresses.
 *     - Rule 4 Shadowing Rule 5: Rule 4 precedes Rule 5 (order), Rule 4 is ACCEPT while Rule 5 is DROP,
 *       and destination 10.0.0.0/16 strictly encompasses 10.0.3.0/24. Post-DNAT DB traffic hits Rule 4 first.
 *     - Replacement Rule: restricted to vendor static IP (/32), DMZ jump-host (/32), port 22 (SSH), and
 *       is disjoint from 10.0.3.0/24, resolving the vendor need while eliminating the shadow over Rule 5.
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

// Helper functions for IP & CIDR mathematical relationships
function parseIpv4(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isIpv4InCidr(ip: string, cidr: string): boolean {
  const [network, prefixLenStr] = cidr.split('/');
  const prefixLen = Number(prefixLenStr);
  const ipNum = parseIpv4(ip);
  const netNum = parseIpv4(network);
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  return (ipNum & mask) === (netNum & mask);
}

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

// ── Evidence Integrity & Ingress Topology ─────────────────────────────────────

describe('cc-nw-02 evidence integrity & NAT ingress architecture', () => {
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

  it('defines an explicit Destination NAT (Post-DNAT Security Inspection) architecture with valid VIP mappings', () => {
    const fwEv = challengeCC_NW_02.evidence.find((e) => e.id === 'ev-firewall-rules')!;
    const content = fwEv.content as {
      evaluationModel: string;
      natArchitecture?: {
        model: string;
        summary: string;
        vipMappings: Array<{ vip: string; targetIp: string; service: string; zone: string; description: string }>;
      };
      zones: Array<{ id: string; name: string; cidr: string }>;
    };

    expect(content.evaluationModel).toContain('Post-DNAT');
    expect(content.natArchitecture).toBeDefined();
    expect(content.natArchitecture?.model).toContain('Post-DNAT Security Inspection');
    expect(content.natArchitecture?.summary).toContain('198.51.100.0/24');
    expect(content.natArchitecture?.summary).toContain('translated internal destination IP');

    const vips = content.natArchitecture?.vipMappings || [];
    expect(vips.length).toBeGreaterThanOrEqual(3);

    // Verify VIP mapping relationships to internal zones
    const zoneMap = new Map(content.zones.map((z) => [z.id, z.cidr]));

    for (const mapping of vips) {
      // Ingress VIP is in public pool 198.51.100.0/24
      expect(isIpv4InCidr(mapping.vip, '198.51.100.0/24')).toBe(true);
      // Target IP is private 10.0.0.0/16
      expect(isIpv4InCidr(mapping.targetIp, '10.0.0.0/16')).toBe(true);

      // Target IP is strictly inside its declared zone CIDR
      const zoneCidr = zoneMap.get(mapping.zone);
      expect(zoneCidr).toBeDefined();
      expect(isIpv4InCidr(mapping.targetIp, zoneCidr!)).toBe(true);
    }

    // Specific VIP target verification
    const webVip = vips.find((v) => v.targetIp === '10.0.1.10');
    expect(webVip).toBeDefined();
    expect(webVip?.zone).toBe('ZONE-DMZ');

    const vendorVip = vips.find((v) => v.targetIp === '10.0.1.25');
    expect(vendorVip).toBeDefined();
    expect(vendorVip?.zone).toBe('ZONE-DMZ');
    expect(vendorVip?.service).toContain('22');

    const dbVip = vips.find((v) => v.targetIp === '10.0.3.50');
    expect(dbVip).toBeDefined();
    expect(dbVip?.zone).toBe('ZONE-DB');
    expect(dbVip?.service).toContain('5432');
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

  it('SOP NET-201 defines explicit rules for first-match, shadowing, least-privilege, and post-DNAT matching', () => {
    const policyEv = challengeCC_NW_02.evidence.find((e) => e.id === 'ev-firewall-standards')!;
    const content = policyEv.content as { rules: string[] };

    expect(content.rules.some((r) => r.includes('Rule 1') && r.includes('First Match'))).toBe(true);
    expect(content.rules.some((r) => r.includes('Rule 2') && r.includes('Shadowing Prohibited'))).toBe(true);
    expect(content.rules.some((r) => r.includes('Rule 3') && r.includes('bastion hosts (/32)'))).toBe(true);
    expect(content.rules.some((r) => r.includes('Rule 4') && r.includes('Change Ticket Hygiene'))).toBe(true);
    expect(content.rules.some((r) => r.includes('Rule 6') && r.includes('Post-DNAT Security Policy Matching'))).toBe(true);
  });
});

// ── Rule 3 Scoping & SOP NET-201 Consistency ──────────────────────────────────

describe('cc-nw-02 Rule 3 scoping & SOP NET-201 consistency', () => {
  it('strictly scopes Rule 3 destination to authorized bastion host (/32), complying with SOP NET-201', () => {
    const fwEv = challengeCC_NW_02.evidence.find((e) => e.id === 'ev-firewall-rules')!;
    const rulesTable = (fwEv.content as { rulesTable: Array<Record<string, unknown>> }).rulesTable;
    const rule3 = rulesTable.find((r) => r.id === 'rule-3') as {
      destZone: string;
      sourceZone: string;
      service: string;
      action: string;
    };

    expect(rule3).toBeDefined();
    expect(rule3.action).toBe('ACCEPT');
    expect(rule3.service).toContain('TCP 22');

    // Relationship check: Destination must be a /32 host address, NOT a broad subnet
    expect(rule3.destZone).toContain('/32');
    expect(rule3.destZone).toContain('10.0.100.10/32');
    expect(rule3.destZone).not.toContain('10.0.0.0/16');
    expect(rule3.destZone).not.toContain('0.0.0.0/0');

    // Destination host must reside within the authorized management VPN subnet (10.0.100.0/24)
    expect(isIpv4InCidr('10.0.100.10', '10.0.100.0/24')).toBe(true);

    // Classification in Step 1 remains legitimately 'Acceptable / Properly Scoped'
    expect(stepClassify.answerKey['rule-3']).toBe('Acceptable / Properly Scoped');

    // Label displayed to user accurately reflects the /32 bastion scoping
    const item3 = stepClassify.items.find((i) => i.id === 'rule-3')!;
    expect(item3.label).toContain('10.0.100.10/32:22');
    expect(item3.label).not.toContain('10.0.0.0/16');
  });
});

// ── Rule 4 Shadowing Rule 5 under Post-DNAT Model ────────────────────────────

describe('cc-nw-02 Rule 4 shadowing Rule 5 under post-DNAT model', () => {
  it('enforces rule ordering, action conflict, and CIDR subnet containment between Rule 4 and Rule 5', () => {
    const fwEv = challengeCC_NW_02.evidence.find((e) => e.id === 'ev-firewall-rules')!;
    const rulesTable = (fwEv.content as { rulesTable: Array<Record<string, unknown>> }).rulesTable;

    const idxRule4 = rulesTable.findIndex((r) => r.id === 'rule-4');
    const idxRule5 = rulesTable.findIndex((r) => r.id === 'rule-5');

    // 1. Order relationship: Rule 4 is evaluated before Rule 5
    expect(idxRule4).toBeGreaterThanOrEqual(0);
    expect(idxRule5).toBeGreaterThanOrEqual(0);
    expect(idxRule4).toBeLessThan(idxRule5);

    const rule4 = rulesTable[idxRule4] as { action: string; sourceZone: string; destZone: string; service: string };
    const rule5 = rulesTable[idxRule5] as { action: string; sourceZone: string; destZone: string; service: string };

    // 2. Action divergence: Rule 4 permits traffic while Rule 5 attempts to drop it
    expect(rule4.action).toBe('ACCEPT');
    expect(rule5.action).toBe('DROP');

    // 3. Source & service overlap: both match inbound WAN on Any ports
    expect(rule4.sourceZone).toContain('ZONE-WAN');
    expect(rule5.sourceZone).toContain('ZONE-WAN');
    expect(rule4.service.toLowerCase()).toContain('any');
    expect(rule5.service.toLowerCase()).toContain('any');

    // 4. Mathematical CIDR containment: Destination 10.0.0.0/16 fully contains 10.0.3.0/24
    expect(rule4.destZone).toContain('10.0.0.0/16');
    expect(rule5.destZone).toContain('10.0.3.0/24');

    // Every boundary and sample IP in Rule 5's target subnet is contained within Rule 4's destination
    const testIpsInDbSubnet = ['10.0.3.0', '10.0.3.1', '10.0.3.50', '10.0.3.100', '10.0.3.255'];
    for (const testIp of testIpsInDbSubnet) {
      expect(isIpv4InCidr(testIp, '10.0.0.0/16')).toBe(true);
    }

    // 5. Ingress NAT impact: Inbound packet arriving at DB VIP 198.51.100.50 translates to 10.0.3.50.
    // In post-DNAT rule inspection, Rule 4 matches first and ACCEPTS the packet.
    // Rule 5 (DROP) is never reached, confirming Rule 5 is completely shadowed.
    expect(stepClassify.answerKey['rule-4']).toBe('Too Permissive (Overly Broad)');
    expect(stepClassify.answerKey['rule-5']).toBe('Ineffective (Shadowed / Order Flaw)');
  });
});

// ── Replacement Rule Scoping & Eliminating Shadowing ─────────────────────────

describe('cc-nw-02 replacement rule relationship & vendor access solution', () => {
  it('replaces Rule 4 with a least-privilege rule that satisfies vendor access while un-shadowing Rule 5', () => {
    const answer = stepReplacement.answerKey as Record<string, string>;

    expect(answer.source).toBe('Vendor Office Static IP (203.0.113.50/32)');
    expect(answer.destination).toBe('Vendor DMZ Jump-Host (10.0.1.25/32)');
    expect(answer.service).toBe('TCP 22 (SSH)');
    expect(answer.action).toBe('ACCEPT (Permit)');

    // 1. Destination is in DMZ (ZONE-DMZ 10.0.1.0/24)
    expect(isIpv4InCidr('10.0.1.25', '10.0.1.0/24')).toBe(true);

    // 2. Destination is DISJOINT from Database subnet (ZONE-DB 10.0.3.0/24)
    expect(isIpv4InCidr('10.0.1.25', '10.0.3.0/24')).toBe(false);

    // 3. Narrowing destination from 10.0.0.0/16 to 10.0.1.25/32 removes the shadow over Rule 5:
    // Packets translated to DB server 10.0.3.50 do NOT match 10.0.1.25/32,
    // so they fall through to Rule 5 and are properly DROPPED.
    expect(isIpv4InCidr('10.0.3.50', '10.0.1.25/32')).toBe(false);

    // 4. Overly broad distractors are rejected:
    const destItem = stepReplacement.items.find((i) => i.id === 'destination')!;
    expect(destItem.options).toContain('Internal Subnets (10.0.0.0/16)'); // distractor that keeps shadowing
    expect(destItem.options).toContain('Database Server (10.0.3.50/32)'); // distractor violating segmentation
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
  it('provides comprehensive explanations covering post-DNAT inspection, Rule 3 scoping, rule ordering, shadowing, and change tickets', () => {
    const { successExplanation, failureExplanation } = challengeCC_NW_02;

    expect(successExplanation).toContain('Post-DNAT');
    expect(successExplanation).toContain('Rule 3');
    expect(successExplanation).toContain('10.0.100.10/32');
    expect(successExplanation).toContain('Rule 4');
    expect(successExplanation).toContain('Rule 5');
    expect(successExplanation).toContain('shadowed');
    expect(successExplanation).toContain('CHG-9941');
    expect(successExplanation).toContain('Rule 7');
    expect(successExplanation).toContain('203.0.113.50/32');
    expect(successExplanation).toContain('10.0.1.25/32');

    expect(failureExplanation).toContain('Top-to-Bottom');
    expect(failureExplanation).toContain('Post-DNAT');
    expect(failureExplanation).toContain('shadowed');
    expect(failureExplanation).toContain('CHG-9941');
  });

  it('getCorrectAnswerDisplay formats answers properly for classification, single-choice, and guided-form', () => {
    const disp1 = getCorrectAnswerDisplay(stepClassify);
    expect(disp1).toContain('Rule 2');
    expect(disp1).toContain('Acceptable / Properly Scoped');
    expect(disp1).toContain('Rule 3');
    expect(disp1).toContain('Acceptable / Properly Scoped');
    expect(disp1).toContain('Rule 4');
    expect(disp1).toContain('Too Permissive (Overly Broad)');
    expect(disp1).toContain('Rule 5');
    expect(disp1).toContain('Ineffective (Shadowed / Order Flaw)');
    expect(disp1).toContain('Rule 7');
    expect(disp1).toContain('Unnecessary (Redundant Duplicate)');

    const disp2 = getCorrectAnswerDisplay(stepImpact);
    expect(disp2).toContain('Inbound WAN connections arriving at public VIPs translated to any internal host in 10.0.0.0/16');
    expect(disp2).toContain('completely bypassing Rule 5’s drop action');

    const disp3 = getCorrectAnswerDisplay(stepReplacement);
    expect(disp3).toContain('Source IP / Network: Vendor Office Static IP (203.0.113.50/32)');
    expect(disp3).toContain('Destination IP / Network: Vendor DMZ Jump-Host (10.0.1.25/32)');
    expect(disp3).toContain('Service / Destination Port: TCP 22 (SSH)');
    expect(disp3).toContain('Firewall Action: ACCEPT (Permit)');
  });
});
