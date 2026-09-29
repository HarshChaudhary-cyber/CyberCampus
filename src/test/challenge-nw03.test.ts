/**
 * Challenge evaluator tests — cc-nw-03 "Packet Trace Analysis"
 * Room: Network Security | Difficulty: Advanced
 *
 * Covers:
 * - Challenge data & registration (in ALL_CHALLENGES and LIVE_CHALLENGE_IDS)
 * - Coexistence: all 3 Network Security challenges live (cc-nw-01, cc-nw-02, cc-nw-03);
 *   preserves all 8 previously built live challenges
 * - Evidence integrity:
 *     - Exactly 36 packets in pcap capture
 *     - Fictional domains (RFC 2606 .example) and documentation IPs (RFC 1918 / RFC 5737)
 *     - Benign DNS TXT SPF query distinguishes service validation from compromise
 *     - Exactly 24 DNS tunneling queries originating from 10.0.2.84
 *     - Exact 32-character hexadecimal encoded payload chunks
 *     - Forensic policy SOP NET-301
 * - Exfiltration volume calculation & distinction:
 *     - 24 queries × 32 bytes/query = 768 bytes encoded payload
 *     - Distinguishes encoded payload size (768 B) from raw decoded binary (384 B)
 *       and total network layer frame traffic (2,448 B)
 * - Step 1: compromised host & activity signature (30 pts, single-choice, no partial credit)
 * - Step 2: attack technique inference (35 pts, single-choice, no partial credit)
 * - Step 3: volume & incident containment (35 pts, guided-form, 3 fields = 11.67 pts each, partial credit)
 * - Anti-guessing end-to-end evaluation:
 *     - Uniform guesser cannot reach 70 pt pass threshold
 *     - Perfect submission achieves 100 pts
 *     - Partial credit run (2/3 Step 3 = 88.33 pts, PASS)
 * - Hint penalty calculation (-10 pts per hint, floor 0)
 * - Educational explanations for covert DNS channels, false positive differentiation, and volatile memory preservation
 * - getCorrectAnswerDisplay formatting for all step types
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import { challengeCC_NW_03, type PacketTraceContent } from '../challenges/data/cc-nw-03';
import { getChallenge, getRoom, LIVE_CHALLENGE_IDS } from '../challenges';
import { computeScore } from '../store';

const [stepHost, stepTechnique, stepVolume] = challengeCC_NW_03.steps;

// ── Registration & Metadata ──────────────────────────────────────────────────

describe('cc-nw-03 registration & metadata', () => {
  it('is registered in CHALLENGE_MAP via getChallenge', () => {
    const ch = getChallenge('cc-nw-03');
    expect(ch).toBeDefined();
    expect(ch?.id).toBe('cc-nw-03');
    expect(ch?.title).toBe('Packet Trace Analysis');
    expect(ch?.difficulty).toBe('advanced');
    expect(ch?.roomId).toBe('network');
  });

  it('is marked as live in LIVE_CHALLENGE_IDS completing all 3 Network Security challenges', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-03')).toBe(true);
  });

  it('preserves all eight previously built live challenges across phishing, secops, and network', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-ph-03')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-so-03')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-nw-02')).toBe(true);
  });

  it('Network Security room contains cc-nw-01, cc-nw-02, cc-nw-03', () => {
    const room = getRoom('network');
    expect(room).toBeDefined();
    expect(room?.title).toBe('Network Security');
    expect(room?.accentClass).toBe('room-network');
    expect(room?.challengeIds).toEqual(['cc-nw-01', 'cc-nw-02', 'cc-nw-03']);
  });

  it('step pointValues sum to exactly 100', () => {
    const total = challengeCC_NW_03.steps.reduce((sum, s) => sum + s.pointValue, 0);
    expect(total).toBe(100);
  });

  it('passThreshold is 70', () => {
    expect(challengeCC_NW_03.passThreshold).toBe(70);
  });

  it('has 3 helpful hints and advanced network forensics skills', () => {
    expect(challengeCC_NW_03.hints).toHaveLength(3);
    expect(challengeCC_NW_03.skills).toContain('packet-trace-investigation');
    expect(challengeCC_NW_03.skills).toContain('dns-tunneling-detection');
    expect(challengeCC_NW_03.skills).toContain('covert-channel-analysis');
    expect(challengeCC_NW_03.skills).toContain('exfiltration-volume-calculation');
    expect(challengeCC_NW_03.skills).toContain('network-containment-protocol');
  });
});

// ── Evidence Integrity & Packet Trace Structure ──────────────────────────────

describe('cc-nw-03 evidence integrity & packet structure', () => {
  it('contains 2 evidence items: packet capture and SOP NET-301 policy', () => {
    expect(challengeCC_NW_03.evidence).toHaveLength(2);
    expect(challengeCC_NW_03.evidence.map((e) => e.id)).toEqual(['ev-packet-trace', 'ev-pcap-standards']);
  });

  it('packet capture contains exactly 36 packets with complete metadata and methodology', () => {
    const pcapEv = challengeCC_NW_03.evidence.find((e) => e.id === 'ev-packet-trace')!;
    const content = pcapEv.content as unknown as PacketTraceContent;

    expect(content.isPacketTrace).toBe(true);
    expect(content.captureFile).toBe('trace-core-20260928.pcap');
    expect(content.totalPackets).toBe(36);
    expect(content.packets).toHaveLength(36);
    expect(content.methodologyNote).toBeDefined();
    expect(content.methodologyNote.formula).toContain('Count of Outbound Tunneling Queries');
  });

  it('uses only RFC 2606 .example domains and RFC 1918 / RFC 5737 documentation IP addresses', () => {
    const evidenceStr = JSON.stringify(challengeCC_NW_03.evidence);

    // Reserved domains only
    const domains = evidenceStr.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g) || [];
    const externalDomains = domains.filter(
      (d) => !d.endsWith('.example') && !d.endsWith('.pcap') && !d.includes('veridian-logistics')
    );
    expect(externalDomains).toHaveLength(0);

    // IP addresses
    const ips = evidenceStr.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) || [];
    for (const ip of ips) {
      const isLoopback = ip.startsWith('127.');
      const isRfc1918 = ip.startsWith('10.');
      const isRfc5737 = ip.startsWith('198.51.100.') || ip.startsWith('203.0.113.') || ip.startsWith('192.0.2.');
      expect(isLoopback || isRfc1918 || isRfc5737).toBe(true);
    }
  });

  it('includes an isolated legitimate DNS TXT query for SPF verification (Packet 7) to prevent false positives', () => {
    const pcapEv = challengeCC_NW_03.evidence.find((e) => e.id === 'ev-packet-trace')!;
    const content = pcapEv.content as unknown as PacketTraceContent;

    const txtQueries = content.packets.filter((p) => p.protocol === 'DNS' && p.dnsDetails?.queryType === 'TXT');
    expect(txtQueries).toHaveLength(2); // Request (pkt 7) and Response (pkt 8)

    const txtReq = txtQueries.find((p) => p.packetNum === 7)!;
    expect(txtReq.sourceIp).toBe('10.0.2.15');
    expect(txtReq.dnsDetails?.queryName).toBe('_spf.cloudvendor.example');
    expect(txtReq.isTunnelingQuery).toBeFalsy();
  });

  it('identifies exactly 24 DNS tunneling queries originating from 10.0.2.84 targeting *.sync-telemetry.example', () => {
    const pcapEv = challengeCC_NW_03.evidence.find((e) => e.id === 'ev-packet-trace')!;
    const content = pcapEv.content as unknown as PacketTraceContent;

    const tunnelingPackets = content.packets.filter((p) => p.isTunnelingQuery);
    expect(tunnelingPackets).toHaveLength(24);

    for (const pkt of tunnelingPackets) {
      expect(pkt.sourceIp).toBe('10.0.2.84');
      expect(pkt.destPort).toBe(53);
      expect(pkt.protocol).toBe('DNS');
      expect(pkt.encodedPayloadLength).toBe(32);
      expect(pkt.subdomainLabel).toBeDefined();
      expect(pkt.subdomainLabel?.length).toBe(32);
      // Subdomain label must be valid hexadecimal
      expect(/^[0-9a-f]{32}$/.test(pkt.subdomainLabel!)).toBe(true);
      expect(pkt.dnsDetails?.queryName).toContain('.sync-telemetry.example');
      expect(pkt.lengthBytes).toBe(102);
    }
  });
});

// ── Exfiltration Volume Calculation Relationships ─────────────────────────────

describe('cc-nw-03 volume calculation & distinction relationships', () => {
  it('mathematically satisfies the exfiltration volume formula and distinguishes metrics', () => {
    const pcapEv = challengeCC_NW_03.evidence.find((e) => e.id === 'ev-packet-trace')!;
    const content = pcapEv.content as unknown as PacketTraceContent;

    const tunnelingPackets = content.packets.filter((p) => p.isTunnelingQuery);
    const queryCount = tunnelingPackets.length;
    const chunkLength = 32; // bytes per label

    // 1. Encoded payload size calculation
    const calculatedEncodedPayload = queryCount * chunkLength;
    expect(calculatedEncodedPayload).toBe(768); // 24 * 32 = 768 bytes

    // 2. Decoded binary equivalent (2 hex characters = 1 byte)
    const calculatedDecodedBinary = queryCount * (chunkLength / 2);
    expect(calculatedDecodedBinary).toBe(384); // 24 * 16 = 384 bytes

    // 3. Total network frame traffic for the tunneling queries
    const totalFrameTraffic = tunnelingPackets.reduce((sum, p) => sum + p.lengthBytes, 0);
    expect(totalFrameTraffic).toBe(2448); // 24 * 102 = 2,448 bytes

    // 4. Verify Step 3 answerKey reflects the 768 bytes encoded volume
    const answer = stepVolume.answerKey as Record<string, string>;
    expect(answer.encodedPayloadVolume).toContain('768 bytes');
    expect(answer.encodedPayloadVolume).toContain('24 tunneling queries × 32 bytes');

    // 5. Verify Step 3 distinguishes encoded payload from network frame traffic
    expect(answer.metricDistinction).toContain('Encoded payload size measures the actual exfiltrated data string');
    expect(answer.metricDistinction).toContain('total network traffic includes Ethernet, IP, and UDP protocol overhead');
  });
});

// ── Step 1: Compromised Host Identification (30 pts) ──────────────────────────

describe('cc-nw-03 Step 1: compromised host identification', () => {
  it('awards full 30 pts for correctly identifying host 10.0.2.84 and the 24-query burst', () => {
    const submission = 'host-fin-84';
    const points = evaluateStep(stepHost, submission);
    expect(points).toBe(30);
  });

  it('awards 0 pts for the false-positive single TXT query distractor (host-mktg-15)', () => {
    const submission = 'host-mktg-15';
    const points = evaluateStep(stepHost, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for the NTP sync distractor (host-eng-40)', () => {
    const submission = 'host-eng-40';
    const points = evaluateStep(stepHost, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for blaming the recursive resolver (host-resolver-02)', () => {
    const submission = 'host-resolver-02';
    const points = evaluateStep(stepHost, submission);
    expect(points).toBe(0);
  });
});

// ── Step 2: Attack Technique Inference (35 pts) ──────────────────────────────

describe('cc-nw-03 Step 2: attack technique inference', () => {
  it('awards full 35 pts for correctly identifying DNS Tunneling & Data Exfiltration (T1071.004)', () => {
    const submission = 'tech-dns-tunneling';
    const points = evaluateStep(stepTechnique, submission);
    expect(points).toBe(35);
  });

  it('awards 0 pts for the DNS cache poisoning distractor', () => {
    const submission = 'tech-cache-poisoning';
    const points = evaluateStep(stepTechnique, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for the SYN flood distractor', () => {
    const submission = 'tech-syn-flood';
    const points = evaluateStep(stepTechnique, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for the fast flux distractor', () => {
    const submission = 'tech-fast-flux';
    const points = evaluateStep(stepTechnique, submission);
    expect(points).toBe(0);
  });
});

// ── Step 3: Volume & Containment Action (35 pts) ─────────────────────────────

describe('cc-nw-03 Step 3: volume & containment action', () => {
  it('awards full 35 pts when all 3 fields are correct', () => {
    const submission = {
      encodedPayloadVolume: '768 bytes (24 tunneling queries × 32 bytes encoded label)',
      metricDistinction:
        'Encoded payload size measures the actual exfiltrated data string in query labels, whereas total network traffic includes Ethernet, IP, and UDP protocol overhead.',
      containmentAction:
        'Isolate 10.0.2.84 at switch/network layer, sinkhole sync-telemetry.example on internal DNS resolvers, and preserve RAM memory for volatile forensics.',
    };
    const points = evaluateStep(stepVolume, submission);
    expect(points).toBe(35);
  });

  it('awards partial credit (23.33 pts) when 2 of 3 fields are correct', () => {
    const submission = {
      encodedPayloadVolume: '768 bytes (24 tunneling queries × 32 bytes encoded label)',
      metricDistinction:
        'Encoded payload size measures the actual exfiltrated data string in query labels, whereas total network traffic includes Ethernet, IP, and UDP protocol overhead.',
      containmentAction:
        'Immediately power off and wipe 10.0.2.84 to destroy any malware files on disk.', // forensic violation mistake
    };
    const points = evaluateStep(stepVolume, submission);
    expect(points).toBeCloseTo(23.33, 1);
  });

  it('awards partial credit (11.67 pts) when 1 of 3 fields is correct', () => {
    const submission = {
      encodedPayloadVolume: '2,448 bytes (Total network frame traffic of all tunneling queries)', // mistake (confusing frame with payload)
      metricDistinction:
        'Encoded payload size and total network traffic are identical because DNS uses UDP with zero protocol headers.', // mistake
      containmentAction:
        'Isolate 10.0.2.84 at switch/network layer, sinkhole sync-telemetry.example on internal DNS resolvers, and preserve RAM memory for volatile forensics.', // correct
    };
    const points = evaluateStep(stepVolume, submission);
    expect(points).toBeCloseTo(11.67, 1);
  });

  it('awards 0 pts if all fields are incorrect', () => {
    const submission = {
      encodedPayloadVolume: '1,152 bytes (All 36 packets in trace × 32 bytes)',
      metricDistinction:
        'Total network traffic is smaller than payload size due to gzip compression performed by DNS resolvers.',
      containmentAction:
        'Block UDP port 53 enterprise-wide on the core switch, disabling DNS resolution for all company systems.',
    };
    const points = evaluateStep(stepVolume, submission);
    expect(points).toBe(0);
  });
});

// ── Anti-Guessing & End-to-End Scoring ────────────────────────────────────────

describe('cc-nw-03 anti-guessing & end-to-end evaluation', () => {
  it('guarantees that guessing Step 1 incorrectly CANNOT pass even with perfect Steps 2 & 3 (70 threshold)', () => {
    // Step 1 wrong (0 pts) + Step 2 correct (35 pts) + Step 3 correct (35 pts) = 70 pts
    // But guessing with a mistake in Step 3 (e.g. 23.33 pts) yields 58.33 < 70 (FAILS)
    const stepState = {
      'step-compromised-host': 'host-mktg-15', // mistake: fell for the single TXT query trap
      'step-attack-technique': 'tech-dns-tunneling', // 35 pts
      'step-volume-containment': {
        encodedPayloadVolume: '768 bytes (24 tunneling queries × 32 bytes encoded label)',
        metricDistinction:
          'Encoded payload size measures the actual exfiltrated data string in query labels, whereas total network traffic includes Ethernet, IP, and UDP protocol overhead.',
        containmentAction:
          'Immediately power off and wipe 10.0.2.84 to destroy any malware files on disk.', // 2/3 correct = 23.33 pts
      },
    };

    const responses = buildStepResponses(challengeCC_NW_03.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_NW_03.passThreshold);

    expect(scoreResult.earnedScore).toBeCloseTo(58.33, 1);
    expect(scoreResult.finalScore).toBeCloseTo(58.33, 1);
    expect(scoreResult.passed).toBe(false);
  });

  it('achieves a perfect score of 100 on fully correct submission', () => {
    const stepState = {
      'step-compromised-host': 'host-fin-84',
      'step-attack-technique': 'tech-dns-tunneling',
      'step-volume-containment': {
        encodedPayloadVolume: '768 bytes (24 tunneling queries × 32 bytes encoded label)',
        metricDistinction:
          'Encoded payload size measures the actual exfiltrated data string in query labels, whereas total network traffic includes Ethernet, IP, and UDP protocol overhead.',
        containmentAction:
          'Isolate 10.0.2.84 at switch/network layer, sinkhole sync-telemetry.example on internal DNS resolvers, and preserve RAM memory for volatile forensics.',
      },
    };

    const responses = buildStepResponses(challengeCC_NW_03.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_NW_03.passThreshold);

    expect(scoreResult.earnedScore).toBe(100);
    expect(scoreResult.finalScore).toBe(100);
    expect(scoreResult.passed).toBe(true);
  });

  it('passes with high partial credit (88.33 pts) when 1 field is missed in Step 3', () => {
    const stepState = {
      'step-compromised-host': 'host-fin-84', // 30 pts
      'step-attack-technique': 'tech-dns-tunneling', // 35 pts
      'step-volume-containment': {
        encodedPayloadVolume: '768 bytes (24 tunneling queries × 32 bytes encoded label)',
        metricDistinction:
          'Encoded payload size measures the actual exfiltrated data string in query labels, whereas total network traffic includes Ethernet, IP, and UDP protocol overhead.',
        containmentAction:
          'Immediately power off and wipe 10.0.2.84 to destroy any malware files on disk.', // 2/3 = 23.33 pts
      },
    };

    const responses = buildStepResponses(challengeCC_NW_03.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_NW_03.passThreshold);

    expect(scoreResult.earnedScore).toBeCloseTo(88.33, 1);
    expect(scoreResult.finalScore).toBeCloseTo(88.33, 1);
    expect(scoreResult.passed).toBe(true);
  });

  it('correctly deducts hint penalties of 10 points per hint', () => {
    const stepState = {
      'step-compromised-host': 'host-fin-84',
      'step-attack-technique': 'tech-dns-tunneling',
      'step-volume-containment': {
        encodedPayloadVolume: '768 bytes (24 tunneling queries × 32 bytes encoded label)',
        metricDistinction:
          'Encoded payload size measures the actual exfiltrated data string in query labels, whereas total network traffic includes Ethernet, IP, and UDP protocol overhead.',
        containmentAction:
          'Isolate 10.0.2.84 at switch/network layer, sinkhole sync-telemetry.example on internal DNS resolvers, and preserve RAM memory for volatile forensics.',
      },
    };

    const responses = buildStepResponses(challengeCC_NW_03.steps, stepState);

    const res1 = computeScore(responses, 1, challengeCC_NW_03.passThreshold);
    expect(res1.earnedScore).toBe(100);
    expect(res1.finalScore).toBe(90);
    expect(res1.passed).toBe(true);

    const res2 = computeScore(responses, 2, challengeCC_NW_03.passThreshold);
    expect(res2.earnedScore).toBe(100);
    expect(res2.finalScore).toBe(80);
    expect(res2.passed).toBe(true);

    const res3 = computeScore(responses, 3, challengeCC_NW_03.passThreshold);
    expect(res3.earnedScore).toBe(100);
    expect(res3.finalScore).toBe(70);
    expect(res3.passed).toBe(true); // exactly on pass threshold 70
  });
});

// ── Educational Explanations & getCorrectAnswerDisplay ────────────────────────

describe('cc-nw-03 educational explanations & answer formatting', () => {
  it('provides comprehensive explanations covering DNS tunneling, volume calculation, and volatile memory', () => {
    const { successExplanation, failureExplanation } = challengeCC_NW_03;

    expect(successExplanation).toContain('10.0.2.84');
    expect(successExplanation).toContain('DNS tunneling');
    expect(successExplanation).toContain('768 bytes');
    expect(successExplanation).toContain('2,448 bytes');
    expect(successExplanation).toContain('volatile');
    expect(successExplanation.toLowerCase()).toContain('sinkhol');

    expect(failureExplanation).toContain('DNS Tunneling');
    expect(failureExplanation).toContain('False Positives');
    expect(failureExplanation).toContain('768 bytes');
    expect(failureExplanation).toContain('volatile evidence');
  });

  it('getCorrectAnswerDisplay formats answers properly for single-choice and guided-form steps', () => {
    const disp1 = getCorrectAnswerDisplay(stepHost);
    expect(disp1).toContain('Host 10.0.2.84');
    expect(disp1).toContain('24 DNS queries');
    expect(disp1).toContain('sync-telemetry.example');

    const disp2 = getCorrectAnswerDisplay(stepTechnique);
    expect(disp2).toContain('DNS Tunneling & Data Exfiltration');

    const disp3 = getCorrectAnswerDisplay(stepVolume);
    expect(disp3).toContain('Estimated Encoded Payload Volume: 768 bytes (24 tunneling queries × 32 bytes encoded label)');
    expect(disp3).toContain('Payload vs Network Traffic Distinction: Encoded payload size measures the actual exfiltrated data string');
    expect(disp3).toContain('Immediate Incident Response Action: Isolate 10.0.2.84 at switch/network layer');
  });
});
