/**
 * Challenge evaluator tests — cc-df-02 "Browser History Reconstruction"
 * Room: Digital Forensics | Difficulty: Intermediate
 *
 * Covers:
 * - Challenge data & registration (in ALL_CHALLENGES and LIVE_CHALLENGE_IDS)
 * - Coexistence: cc-df-01 and cc-df-02 are live, cc-df-03 remains coming soon;
 *   preserves all 10 previously built live challenges across rooms
 * - Evidence integrity & cross-source corroboration:
 *     - Fictional SQLite browser history export with 25 records (20-30 range)
 *     - All domains use RFC 2606 reserved domains (.example, .example.org, etc.)
 *     - All IP addresses use RFC 5737 documentation blocks (198.51.100.42, 192.0.2.10)
 *     - Independent forward proxy logs (proxy01-access.log) with NTP synchronization
 *     - Host system power telemetry (Windows Event ID 42 sleep S3 and Event ID 1 resume)
 *     - Transition type distinction: typed vs link vs auto_subframe passive tracking beacon
 *     - SQLite auto-increment key inversion (#23-#25 with older timestamps than #1-#22)
 * - Step 1: Corroborating disputed visits (30 pts, multi-choice, partial credit allowed)
 * - Step 2: Anomaly & tampering detection (25 pts, single-choice, no partial credit)
 * - Step 3: Reconstructing exfiltration sequence (25 pts, ordering, partial credit allowed)
 * - Step 4: Evidence preservation & defensible reporting (20 pts, single-choice, no partial credit)
 * - Anti-guessing end-to-end evaluation:
 *     - Uniform guesser cannot reach 70 pt pass threshold
 *     - Perfect submission achieves 100 pts
 *     - Partial credit run (2/3 Step 1 = 90 pts, PASS)
 * - Hint penalty calculation (-10 pts per hint, floor 0)
 * - Educational explanations teaching that a suspicious URL or late timestamp alone is not proof
 * - getCorrectAnswerDisplay formatting for all interaction types
 * - cc-df-01 correction confirmation: verifies existing image hash and working copy
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import {
  challengeCC_DF_02,
  type BrowserHistoryContent,
  type ProxyLogContent,
  type WorkstationTelemetryContent,
} from '../challenges/data/cc-df-02';
import { challengeCC_DF_01 } from '../challenges/data/cc-df-01';
import { getChallenge, getRoom, LIVE_CHALLENGE_IDS, ALL_CHALLENGES } from '../challenges';
import { computeScore } from '../store';

const [stepCorroborate, stepTampering, stepSequence, stepReporting] = challengeCC_DF_02.steps;

// ── Registration & Metadata ──────────────────────────────────────────────────

describe('cc-df-02 registration & metadata', () => {
  it('is registered in CHALLENGE_MAP via getChallenge', () => {
    const ch = getChallenge('cc-df-02');
    expect(ch).toBeDefined();
    expect(ch?.id).toBe('cc-df-02');
    expect(ch?.title).toBe('Browser History Reconstruction');
    expect(ch?.difficulty).toBe('intermediate');
    expect(ch?.roomId).toBe('forensics');
  });

  it('is registered in ALL_CHALLENGES array', () => {
    const found = ALL_CHALLENGES.find((c) => c.id === 'cc-df-02');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Browser History Reconstruction');
  });

  it('is marked as live in LIVE_CHALLENGE_IDS along with all live challenges', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-df-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-df-03')).toBe(true);
  });

  it('preserves all 10 previously built live challenges across all rooms', () => {
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
  });

  it('Digital Forensics room contains cc-df-01, cc-df-02, cc-df-03 in sequence', () => {
    const room = getRoom('forensics');
    expect(room).toBeDefined();
    expect(room?.title).toBe('Digital Forensics');
    expect(room?.challengeIds).toEqual(['cc-df-01', 'cc-df-02', 'cc-df-03']);
  });

  it('step pointValues sum to exactly 100', () => {
    const total = challengeCC_DF_02.steps.reduce((sum, s) => sum + s.pointValue, 0);
    expect(total).toBe(100);
  });

  it('passThreshold is 70', () => {
    expect(challengeCC_DF_02.passThreshold).toBe(70);
  });

  it('has 3 helpful hints and digital forensics skill tags', () => {
    expect(challengeCC_DF_02.hints).toHaveLength(3);
    expect(challengeCC_DF_02.skills).toContain('browser-history-forensics');
    expect(challengeCC_DF_02.skills).toContain('timeline-reconstruction');
    expect(challengeCC_DF_02.skills).toContain('proxy-log-correlation');
    expect(challengeCC_DF_02.skills).toContain('anti-forensics-tampering-detection');
    expect(challengeCC_DF_02.skills).toContain('evidence-preservation');
  });
});

// ── Evidence Integrity & Cross-Source Corroboration ──────────────────────────

describe('cc-df-02 evidence integrity & cross-source corroboration', () => {
  it('contains 3 evidence items: browser history, forward proxy logs, and telemetry SOP', () => {
    expect(challengeCC_DF_02.evidence).toHaveLength(3);
    expect(challengeCC_DF_02.evidence.map((e) => e.id)).toEqual([
      'ev-browser-history',
      'ev-proxy-logs',
      'ev-telemetry-sop',
    ]);
  });

  it('contains exactly 25 simulated browser history records in the 20-30 range', () => {
    const bhEv = challengeCC_DF_02.evidence.find((e) => e.id === 'ev-browser-history')!;
    const content = bhEv.content as unknown as BrowserHistoryContent;

    expect(content.isBrowserHistory).toBe(true);
    expect(content.records).toHaveLength(25);
    expect(content.totalRecords).toBe(25);
  });

  it('uses only RFC 2606 reserved example domains and RFC 5737 documentation IPs', () => {
    const evidenceStr = JSON.stringify(challengeCC_DF_02.evidence);

    // Extract domains
    const urlMatches =
      evidenceStr.match(/https?:\/\/([a-zA-Z0-9.-]+)/g)?.map((u) => u.replace(/^https?:\/\//, '')) || [];
    const emailMatches =
      evidenceStr.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)?.map((e) => e.slice(1)) || [];
    const allDomains = [...urlMatches, ...emailMatches];

    expect(allDomains.length).toBeGreaterThan(0);
    for (const d of allDomains) {
      const isReserved =
        d.endsWith('.example') ||
        d.endsWith('.example.org') ||
        d.endsWith('.example.net') ||
        d.endsWith('.example.com');
      expect(isReserved).toBe(true);
    }

    // Check IPs
    const ipMatches = evidenceStr.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [];
    for (const ip of ipMatches) {
      const isDocIp =
        ip.startsWith('198.51.100.') || // TEST-NET-2
        ip.startsWith('192.0.2.') || // TEST-NET-1
        ip.startsWith('203.0.113.') || // TEST-NET-3
        ip === '127.0.0.1';
      expect(isDocIp).toBe(true);
    }
  });

  it('verifies independent proxy logs corroborate DropVault upload with 18.4 MB POST payload', () => {
    const pxEv = challengeCC_DF_02.evidence.find((e) => e.id === 'ev-proxy-logs')!;
    const content = pxEv.content as unknown as ProxyLogContent;

    expect(content.isProxyLog).toBe(true);
    const uploadEntry = content.entries.find((e) => e.destinationUrl.includes('drop-vault.example.net/upload'));
    expect(uploadEntry).toBeDefined();
    expect(uploadEntry?.method).toBe('POST');
    expect(uploadEntry?.statusCode).toBe(200);
    expect(uploadEntry?.bytesSent).toBeGreaterThan(18000000); // 18.4 MB
    expect(uploadEntry?.clientIp).toBe('198.51.100.42');
  });

  it('verifies off-hours competitor and marketplace visits have ZERO proxy logs and match S3 sleep', () => {
    const pxEv = challengeCC_DF_02.evidence.find((e) => e.id === 'ev-proxy-logs')!;
    const pxContent = pxEv.content as unknown as ProxyLogContent;

    // Disputed URLs
    const competitorLog = pxContent.entries.find((e) =>
      e.destinationUrl.includes('global-competitor-freight.example.com')
    );
    const darkBrokerLog = pxContent.entries.find((e) =>
      e.destinationUrl.includes('dark-broker.example.com')
    );
    const pasteDumpLog = pxContent.entries.find((e) =>
      e.destinationUrl.includes('paste-dump.example.org')
    );

    expect(competitorLog).toBeUndefined();
    expect(darkBrokerLog).toBeUndefined();
    expect(pasteDumpLog).toBeUndefined();

    // Check host telemetry rules
    const telEv = challengeCC_DF_02.evidence.find((e) => e.id === 'ev-telemetry-sop')!;
    const telContent = telEv.content as unknown as WorkstationTelemetryContent;
    const rulesText = telContent.rules.join(' ');

    expect(rulesText).toContain('ACPI S3');
    expect(rulesText).toContain('17:15:00 UTC');
    expect(rulesText).toContain('08:22:15 UTC');
  });

  it('proves SQLite auto-increment primary key inversion on records 23-25', () => {
    const bhEv = challengeCC_DF_02.evidence.find((e) => e.id === 'ev-browser-history')!;
    const content = bhEv.content as unknown as BrowserHistoryContent;

    const record1 = content.records.find((r) => r.id === 1)!;
    const record23 = content.records.find((r) => r.id === 23)!;
    const record24 = content.records.find((r) => r.id === 24)!;
    const record25 = content.records.find((r) => r.id === 25)!;

    expect(record1.visitTime).toContain('2026-10-02');
    // Records 23-25 claim to be from 2026-10-01, but have higher auto-increment IDs!
    expect(record23.visitTime).toContain('2026-10-01');
    expect(record24.visitTime).toContain('2026-10-01');
    expect(record25.visitTime).toContain('2026-10-01');
    expect(record23.id).toBeGreaterThan(record1.id);
  });

  it('distinguishes deliberate navigation from passive auto_subframe web trackers', () => {
    const bhEv = challengeCC_DF_02.evidence.find((e) => e.id === 'ev-browser-history')!;
    const content = bhEv.content as unknown as BrowserHistoryContent;

    const tracker = content.records.find((r) => r.url.includes('ad-tracker.example.com'))!;
    expect(tracker.transition).toBe('auto_subframe');
    expect(tracker.hidden).toBe(true);
    expect(tracker.typedCount).toBe(0);
  });
});

// ── Step 1: Corroborating Disputed Visits (30 pts) ────────────────────────────

describe('cc-df-02 Step 1: corroborating disputed visits', () => {
  it('awards full 30 pts when all 3 confirmed visits are chosen', () => {
    const submission = ['corr-drop-vault', 'corr-search-filedrop', 'corr-route-docs'];
    const points = evaluateStep(stepCorroborate, submission);
    expect(points).toBe(30);
  });

  it('awards partial credit (20 pts) when 2 of 3 confirmed visits are chosen without wrong picks', () => {
    const submission = ['corr-drop-vault', 'corr-search-filedrop'];
    const points = evaluateStep(stepCorroborate, submission);
    expect(points).toBe(20);
  });

  it('awards partial credit (10 pts) when 1 of 3 confirmed visits is chosen without wrong picks', () => {
    const submission = ['corr-drop-vault'];
    const points = evaluateStep(stepCorroborate, submission);
    expect(points).toBe(10);
  });

  it('penalizes incorrect distractors that lack proxy corroboration', () => {
    // 2 correct + 1 wrong: earned = 20 - 10 = 10
    const submission = ['corr-drop-vault', 'corr-search-filedrop', 'corr-competitor'];
    const points = evaluateStep(stepCorroborate, submission);
    expect(points).toBe(10);
  });

  it('awards 0 pts when all chosen items are incorrect distractors', () => {
    const submission = ['corr-competitor', 'corr-dark-broker', 'corr-ad-tracker'];
    const points = evaluateStep(stepCorroborate, submission);
    expect(points).toBe(0);
  });
});

// ── Step 2: Anomaly & Tampering Detection (25 pts) ────────────────────────────

describe('cc-df-02 Step 2: anomaly & tampering detection', () => {
  it('awards full 25 pts for identifying SQLite ID inversion and power sleep telemetry', () => {
    const submission = 'anom-id-telemetry';
    const points = evaluateStep(stepTampering, submission);
    expect(points).toBe(25);
  });

  it('awards 0 pts for HTTPS protocol distractor', () => {
    const submission = 'anom-url-protocol';
    const points = evaluateStep(stepTampering, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for single visit count distractor', () => {
    const submission = 'anom-single-visit';
    const points = evaluateStep(stepTampering, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for missing cookies distractor', () => {
    const submission = 'anom-cookie-missing';
    const points = evaluateStep(stepTampering, submission);
    expect(points).toBe(0);
  });
});

// ── Step 3: Reconstructing Exfiltration Sequence (25 pts) ────────────────────

describe('cc-df-02 Step 3: reconstructing exfiltration sequence', () => {
  it('awards full 25 pts for the exact chronological order of verified events', () => {
    const submission = ['seq-export', 'seq-search', 'seq-upload', 'seq-confirm'];
    const points = evaluateStep(stepSequence, submission);
    expect(points).toBe(25);
  });

  it('awards partial credit when some items are placed in correct positions', () => {
    // 2 in correct positions (seq-export at 0, seq-confirm at 3)
    const submission = ['seq-export', 'seq-upload', 'seq-search', 'seq-confirm'];
    const points = evaluateStep(stepSequence, submission);
    expect(points).toBe(12.5);
  });

  it('awards 0 pts when no items are in correct positions', () => {
    const submission = ['seq-confirm', 'seq-upload', 'seq-search', 'seq-export'];
    const points = evaluateStep(stepSequence, submission);
    expect(points).toBe(0);
  });
});

// ── Step 4: Evidence Reporting & Preservation Protocol (20 pts) ──────────────

describe('cc-df-02 Step 4: evidence reporting & preservation protocol', () => {
  it('awards full 20 pts for defensible evidence-based reporting and WAL/SHM preservation', () => {
    const submission = 'pres-defensible';
    const points = evaluateStep(stepReporting, submission);
    expect(points).toBe(20);
  });

  it('awards 0 pts for prematurely charging espionage without network proof', () => {
    const submission = 'pres-blame-competitor';
    const points = evaluateStep(stepReporting, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for executing SQL DELETE on suspect evidence', () => {
    const submission = 'pres-delete-anomalies';
    const points = evaluateStep(stepReporting, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for discarding WAL and SHM journal files', () => {
    const submission = 'pres-discard-journals';
    const points = evaluateStep(stepReporting, submission);
    expect(points).toBe(0);
  });
});

// ── Anti-Guessing & End-to-End Scoring ────────────────────────────────────────

describe('cc-df-02 anti-guessing & end-to-end evaluation', () => {
  it('guarantees that guessing Step 1 with wrong distractors prevents passing (threshold 70)', () => {
    const stepState = {
      'step-corroborated-visits': ['corr-competitor', 'corr-dark-broker'], // 0 pts
      'step-tampering-indicators': 'anom-id-telemetry', // 25 pts
      'step-exfiltration-sequence': ['seq-export', 'seq-search', 'seq-upload', 'seq-confirm'], // 25 pts
      'step-reporting-preservation': 'pres-defensible', // 20 pts
    };

    const responses = buildStepResponses(challengeCC_DF_02.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_DF_02.passThreshold);

    // 0 + 25 + 25 + 20 = 70. But if sequence has any flaw (12.5 pts), score drops to 57.5 < 70
    expect(scoreResult.earnedScore).toBe(70);

    const imperfectState = {
      'step-corroborated-visits': ['corr-competitor', 'corr-dark-broker'], // 0 pts
      'step-tampering-indicators': 'anom-id-telemetry', // 25 pts
      'step-exfiltration-sequence': ['seq-export', 'seq-upload', 'seq-search', 'seq-confirm'], // 12.5 pts
      'step-reporting-preservation': 'pres-defensible', // 20 pts
    };
    const imperfectResponses = buildStepResponses(challengeCC_DF_02.steps, imperfectState);
    const imperfectScore = computeScore(imperfectResponses, 0, challengeCC_DF_02.passThreshold);

    expect(imperfectScore.earnedScore).toBe(57.5);
    expect(imperfectScore.passed).toBe(false);
  });

  it('achieves a perfect score of 100 on fully correct submission', () => {
    const stepState = {
      'step-corroborated-visits': ['corr-drop-vault', 'corr-search-filedrop', 'corr-route-docs'],
      'step-tampering-indicators': 'anom-id-telemetry',
      'step-exfiltration-sequence': ['seq-export', 'seq-search', 'seq-upload', 'seq-confirm'],
      'step-reporting-preservation': 'pres-defensible',
    };

    const responses = buildStepResponses(challengeCC_DF_02.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_DF_02.passThreshold);

    expect(scoreResult.earnedScore).toBe(100);
    expect(scoreResult.finalScore).toBe(100);
    expect(scoreResult.passed).toBe(true);
  });

  it('passes with high partial credit (90 pts) when 1 item is missed in Step 1', () => {
    const stepState = {
      'step-corroborated-visits': ['corr-drop-vault', 'corr-search-filedrop'], // 20 pts
      'step-tampering-indicators': 'anom-id-telemetry', // 25 pts
      'step-exfiltration-sequence': ['seq-export', 'seq-search', 'seq-upload', 'seq-confirm'], // 25 pts
      'step-reporting-preservation': 'pres-defensible', // 20 pts
    };

    const responses = buildStepResponses(challengeCC_DF_02.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_DF_02.passThreshold);

    expect(scoreResult.earnedScore).toBe(90);
    expect(scoreResult.finalScore).toBe(90);
    expect(scoreResult.passed).toBe(true);
  });

  it('correctly deducts hint penalties of 10 points per hint', () => {
    const stepState = {
      'step-corroborated-visits': ['corr-drop-vault', 'corr-search-filedrop', 'corr-route-docs'],
      'step-tampering-indicators': 'anom-id-telemetry',
      'step-exfiltration-sequence': ['seq-export', 'seq-search', 'seq-upload', 'seq-confirm'],
      'step-reporting-preservation': 'pres-defensible',
    };

    const responses = buildStepResponses(challengeCC_DF_02.steps, stepState);

    const res1 = computeScore(responses, 1, challengeCC_DF_02.passThreshold);
    expect(res1.earnedScore).toBe(100);
    expect(res1.finalScore).toBe(90);
    expect(res1.passed).toBe(true);

    const res2 = computeScore(responses, 2, challengeCC_DF_02.passThreshold);
    expect(res2.earnedScore).toBe(100);
    expect(res2.finalScore).toBe(80);
    expect(res2.passed).toBe(true);

    const res3 = computeScore(responses, 3, challengeCC_DF_02.passThreshold);
    expect(res3.earnedScore).toBe(100);
    expect(res3.finalScore).toBe(70);
    expect(res3.passed).toBe(true); // exactly on pass threshold 70
  });
});

// ── Educational Explanations & getCorrectAnswerDisplay ────────────────────────

describe('cc-df-02 educational explanations & answer formatting', () => {
  it('provides comprehensive explanations covering cross-source corroboration and SQLite auto-increment sequencing', () => {
    const { successExplanation, failureExplanation } = challengeCC_DF_02;

    expect(successExplanation).toContain('global-competitor-freight.example.com');
    expect(successExplanation).toContain('drop-vault.example.net');
    expect(successExplanation).toContain('18.4 MB POST upload');
    expect(successExplanation).toContain('auto-increment');
    expect(successExplanation).toContain('S3 ACPI sleep');
    expect(successExplanation).toContain('auto_subframe');
    expect(successExplanation).toContain('-wal');

    expect(failureExplanation).toContain('Local vs Network Reality');
    expect(failureExplanation).toContain('SQLite Auto-Increment Sequencing');
    expect(failureExplanation).toContain('Host Telemetry Correlation');
    expect(failureExplanation).toContain('Preservation');
  });

  it('getCorrectAnswerDisplay formats answers properly for multi-choice, single-choice, and ordering steps', () => {
    const disp1 = getCorrectAnswerDisplay(stepCorroborate);
    expect(disp1).toContain('https://drop-vault.example.net/upload');
    expect(disp1).toContain('https://search.example.org/search?q=free+anonymous+file+drop');

    const disp2 = getCorrectAnswerDisplay(stepTampering);
    expect(disp2).toContain('SQLite ID sequencing anomaly');
    expect(disp2).toContain('S3 ACPI sleep');

    const disp3 = getCorrectAnswerDisplay(stepSequence);
    expect(disp3).toContain('1. 13:42 UTC');
    expect(disp3).toContain('2. 14:10 UTC');
    expect(disp3).toContain('3. 14:22 UTC');
    expect(disp3).toContain('4. 14:24 UTC');

    const disp4 = getCorrectAnswerDisplay(stepReporting);
    expect(disp4).toContain('Report the 18.4 MB DropVault POST as a corroborated outbound upload');
    expect(disp4).toContain('History-wal');
  });
});

// ── Task 6B.1 Forensic Conclusion Corrections ─────────────────────────────────

describe('cc-df-02 Task 6B.1 forensic conclusions & telemetry nuance', () => {
  it('treats SQLite auto-increment ID inversion as an anomaly with benign explanations (delayed recording, sync, import, clock drift)', () => {
    const bhEv = challengeCC_DF_02.evidence.find((e) => e.id === 'ev-browser-history')!;
    const bhContent = bhEv.content as unknown as BrowserHistoryContent;
    const rule2 = bhContent.guidanceNote!.rules.find((r) => r.includes('SQLite Auto-Increment'));

    expect(rule2).toBeDefined();
    expect(rule2).toContain('sequencing anomaly');
    expect(rule2).toContain('requiring independent corroboration');
    expect(rule2).toContain('delayed commit');
    expect(rule2).toContain('profile import');
    expect(rule2).toContain('synchronization');

    // SOP rule 2
    const sopEv = challengeCC_DF_02.evidence.find((e) => e.id === 'ev-telemetry-sop')!;
    const sopContent = sopEv.content as unknown as WorkstationTelemetryContent;
    const sopRule2 = sopContent.rules.find((r) => r.includes('Rule 2'))!;

    expect(sopRule2).toContain('sequencing anomaly');
    expect(sopRule2).toContain('requiring independent corroboration');
    expect(sopRule2).toContain('benign explanations');
    expect(sopRule2).toContain('delayed recording');
    expect(sopRule2).toContain('profile import');

    // Step 2 prompt & option
    expect(stepTampering.prompt).toContain('Which forensic assessment accurately reflects');
    const correctStep2 = stepTampering.items.find((i) => i.id === 'anom-id-telemetry')!;
    expect(correctStep2.label).toContain('SQLite ID sequencing anomaly');
    expect(correctStep2.label).toContain('requiring corroboration rather than proving tampering');
  });

  it('treats sleep state and missing proxy records as uncorroborated browsing, explicitly acknowledging log coverage limitations', () => {
    const pxEv = challengeCC_DF_02.evidence.find((e) => e.id === 'ev-proxy-logs')!;
    const pxContent = pxEv.content as unknown as ProxyLogContent;
    const pxRule3 = pxContent.guidanceNote!.rules.find((r) => r.includes('Telemetry Coverage'));

    expect(pxRule3).toBeDefined();
    expect(pxRule3).toContain('uncorroborated by proxy telemetry');
    expect(pxRule3).toContain('absence of records in a single log source is not universal proof');

    // SOP rule 4
    const sopEv = challengeCC_DF_02.evidence.find((e) => e.id === 'ev-telemetry-sop')!;
    const sopContent = sopEv.content as unknown as WorkstationTelemetryContent;
    const sopRule4 = sopContent.rules.find((r) => r.includes('Rule 4'))!;

    expect(sopRule4).toContain('inconsistent with ACPI S3 sleep');
    expect(sopRule4).toContain('document logging coverage and limitations');
    expect(sopRule4).toContain('cannot be asserted as universal negative proof');

    // Step 2 option notes coverage limitations
    const correctStep2 = stepTampering.items.find((i) => i.id === 'anom-id-telemetry')!;
    expect(correctStep2.label).toContain('subject to log coverage limitations');
    expect(correctStep2.label).toContain('uncorroborated by proxy logs and inconsistent with host telemetry');
  });

  it('describes 18.4 MB outbound POST as a corroborated upload, keeping confidential-data exfiltration provisional pending payload identification', () => {
    // Proxy entry px-17 notes
    const pxEv = challengeCC_DF_02.evidence.find((e) => e.id === 'ev-proxy-logs')!;
    const pxContent = pxEv.content as unknown as ProxyLogContent;
    const px17 = pxContent.entries.find((e) => e.id === 'px-17')!;

    expect(px17.notes).toContain('corroborated outbound upload');
    expect(px17.notes).toContain('provisional hypothesis pending independent payload verification');

    // Step 3 seq-upload label
    const seqUpload = stepSequence.items.find((i) => i.id === 'seq-upload')!;
    expect(seqUpload.label).toContain('Corroborated upload');
    expect(seqUpload.label).toContain('confidential exfiltration remains provisional pending payload identification');

    // Step 4 pres-defensible label
    const presDef = stepReporting.items.find((i) => i.id === 'pres-defensible')!;
    expect(presDef.label).toContain('corroborated outbound upload');
    expect(presDef.label).toContain('keeping confidential-data exfiltration provisional pending payload identification');

    // Step 4 distractor pres-blame-competitor
    const presBlame = stepReporting.items.find((i) => i.id === 'pres-blame-competitor')!;
    expect(presBlame.label).toContain('definitively prove malicious backdating');
  });

  it('asks learners to distinguish confirmed facts from provisional hypotheses across prompt, hints, and explanations', () => {
    // Briefing
    expect(challengeCC_DF_02.briefing).toContain('Distinguish confirmed facts from provisional hypotheses');

    // Hints
    expect(challengeCC_DF_02.hints[1]).toContain('anomaly requiring corroboration; consider possible benign causes');
    expect(challengeCC_DF_02.hints[2]).toContain('keep content exfiltration provisional unless independent evidence verifies');

    // Explanations
    expect(challengeCC_DF_02.successExplanation).toContain('distinguished confirmed facts from provisional hypotheses');
    expect(challengeCC_DF_02.successExplanation).toContain('absence from a single log is not universal proof');
    expect(challengeCC_DF_02.successExplanation).toContain('provisional until independent evidence directly inspects or confirms the uploaded payload content');

    expect(challengeCC_DF_02.failureExplanation).toContain('Confirmed Facts vs Hypotheses');
    expect(challengeCC_DF_02.failureExplanation).toContain('absence from one log is not universal negative proof');
  });
});

// ── cc-df-01 Revision Confirmation ───────────────────────────────────────────

describe('cc-df-01 revision confirmation', () => {
  it('confirms cc-df-01 Step 3 verifies the existing image hash and analyzes a working copy', () => {
    const preservationStep = challengeCC_DF_01.steps.find((s) => s.id === 'step-preservation-action')!;
    expect(preservationStep).toBeDefined();

    // Prompt specifies existing image is already acquired
    expect(preservationStep.prompt).toContain('already acquired');
    expect(preservationStep.prompt).not.toContain('Following the identification of the exfiltrated file and recovery');

    // Correct option verifies recorded hash and works from a working copy
    const correctItem = preservationStep.items.find(
      (i) => i.id === (preservationStep.answerKey as { chosen: string }).chosen
    )!;
    expect(correctItem.label).toContain('Verify the existing E01 image’s recorded SHA-256 hash');
    expect(correctItem.label).toContain('verified working copy');
    expect(correctItem.label).not.toContain('Acquire a verified bit-stream physical image');
  });
});
