/**
 * Challenge evaluator & fixture tests — cc-df-03 "Steganography Detection"
 * Room: Digital Forensics | Difficulty: Advanced
 *
 * Covers:
 * - Challenge data & registration (in ALL_CHALLENGES and LIVE_CHALLENGE_IDS)
 * - Coexistence: all 12 challenges across all four rooms are live
 * - Digital Forensics room now has all 3 challenges live (cc-df-01, cc-df-02, cc-df-03)
 * - Deterministic scoring: total 100 pts (30 / 40 / 30), passThreshold 70
 * - Bounded browser-side extraction engine on real local PNG fixtures:
 *     - Exhibit 1 (Control gradient): no payload, valid: false
 *     - Exhibit 2 (Carrier): extracts valid 130-byte payload with correct plaintext and valid checksum
 *     - Exhibit 3 (Control noise): no payload, valid: false
 *     - Alternative modes (MSB, Alpha LSB) fail on carrier
 * - Malformed payload & edge case handling:
 *     - Checksum corruption -> checksumValid: false
 *     - Length corruption -> payload length exceeds available capacity
 *     - Invalid PNG header / corrupted signature -> invalid PNG signature
 *     - Truncated bytes -> parse error
 * - Step 1: Inspection & extraction method (30 pts, single-choice, no partial credit)
 * - Step 2: Testing exhibits & identifying valid carrier (40 pts, single-choice, no partial credit)
 * - Step 3: Defensible reporting & preservation (30 pts, single-choice, no partial credit)
 * - Anti-guessing end-to-end evaluation:
 *     - Full correct submission: 100 pts (PASS)
 *     - Missing carrier fails pass threshold (max 60 < 70)
 *     - Distractor combinations fail
 * - Hint penalty calculation (-10 pts per hint, floor 0)
 * - Educational explanations teaching that appearance/size alone does not prove steganography,
 *   and successful extraction proves payload existence, not malicious intent.
 * - getCorrectAnswerDisplay formatting for all steps
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import { challengeCC_DF_03 } from '../challenges/data/cc-df-03';
import {
  STEGO_EXHIBITS,
  extractLSBFromPngBytes,
  createCorruptedChecksumFixture,
  createCorruptedLengthFixture,
  HARMLESS_STEGO_PAYLOAD,
} from '../challenges/data/stego-fixtures';
import { getChallenge, getRoom, LIVE_CHALLENGE_IDS, ALL_CHALLENGES } from '../challenges';
import { computeScore } from '../store';

const [stepMethod, stepCarrier, stepReporting] = challengeCC_DF_03.steps;

// ── Registration & Metadata ──────────────────────────────────────────────────

describe('cc-df-03 registration & metadata', () => {
  it('is registered in CHALLENGE_MAP via getChallenge', () => {
    const ch = getChallenge('cc-df-03');
    expect(ch).toBeDefined();
    expect(ch?.id).toBe('cc-df-03');
    expect(ch?.title).toBe('Steganography Detection');
    expect(ch?.difficulty).toBe('advanced');
    expect(ch?.roomId).toBe('forensics');
  });

  it('is registered in ALL_CHALLENGES array', () => {
    const found = ALL_CHALLENGES.find((c) => c.id === 'cc-df-03');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Steganography Detection');
  });

  it('is marked as live in LIVE_CHALLENGE_IDS', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-df-03')).toBe(true);
  });

  it('preserves all 11 previously built live challenges across all rooms (total 12 live challenges)', () => {
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

    expect(LIVE_CHALLENGE_IDS.size).toBeGreaterThanOrEqual(12);
  });

  it('verifies the forensics room contains all 3 challenges as live', () => {
    const room = getRoom('forensics');
    expect(room).toBeDefined();
    expect(room?.challengeIds).toEqual(['cc-df-01', 'cc-df-02', 'cc-df-03']);
    room?.challengeIds.forEach((id) => {
      expect(LIVE_CHALLENGE_IDS.has(id)).toBe(true);
    });
  });

  it('has deterministic point values summing to exactly 100 with passThreshold 70', () => {
    const totalPoints = challengeCC_DF_03.steps.reduce((sum, s) => sum + s.pointValue, 0);
    expect(totalPoints).toBe(100);
    expect(challengeCC_DF_03.passThreshold).toBe(70);
    expect(stepMethod.pointValue).toBe(30);
    expect(stepCarrier.pointValue).toBe(40);
    expect(stepReporting.pointValue).toBe(30);
  });

  it('has two structured evidence items (workbench and SOP)', () => {
    expect(challengeCC_DF_03.evidence).toHaveLength(2);

    const workbench = challengeCC_DF_03.evidence.find((e) => e.id === 'ev-stego-workbench');
    expect(workbench).toBeDefined();
    expect(workbench?.type).toBe('image');

    const sop = challengeCC_DF_03.evidence.find((e) => e.id === 'ev-stego-sop');
    expect(sop).toBeDefined();
    expect(sop?.type).toBe('policy');
  });

  it('ensures educational explanations cover steganographic limitations and objective reporting', () => {
    expect(challengeCC_DF_03.briefing).toContain('file sizes');
    expect(challengeCC_DF_03.briefing).toContain('visual appearances alone do not prove or disprove steganography');
    expect(challengeCC_DF_03.successExplanation).toContain('never infer criminal malice');
    expect(challengeCC_DF_03.failureExplanation).toContain('appearance and file size alone never prove or disprove hidden data');
  });
});

// ── PNG Fixtures & Bounded Extraction Engine ─────────────────────────────────

describe('stego-fixtures generation & extraction engine', () => {
  it('supplies 3 reproducible PNG exhibits with identical byte length and dimensions', () => {
    expect(STEGO_EXHIBITS).toHaveLength(3);
    const [ex1, ex2, ex3] = STEGO_EXHIBITS;

    expect(ex1.filename).toBe('evidence-scan-01.png');
    expect(ex2.filename).toBe('evidence-scan-02.png');
    expect(ex3.filename).toBe('evidence-scan-03.png');

    expect(ex1.dimensions).toEqual({ width: 48, height: 48 });
    expect(ex2.dimensions).toEqual({ width: 48, height: 48 });
    expect(ex3.dimensions).toEqual({ width: 48, height: 48 });

    // File sizes must be identical so file size alone cannot reveal the carrier
    expect(ex1.fileSizeBytes).toBe(ex2.fileSizeBytes);
    expect(ex2.fileSizeBytes).toBe(ex3.fileSizeBytes);
    expect(ex1.rawPngBytes.byteLength).toBe(ex1.fileSizeBytes);

    // Hashes must be unique and valid SHA-256 strings
    expect(ex1.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(ex2.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(ex3.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(ex1.sha256).not.toBe(ex2.sha256);
    expect(ex2.sha256).not.toBe(ex3.sha256);

    // PNG headers must start with 0x89 0x50 0x4E 0x47
    expect(ex1.rawPngBytes[0]).toBe(0x89);
    expect(ex1.rawPngBytes[1]).toBe(0x50);
    expect(ex2.rawPngBytes[0]).toBe(0x89);
    expect(ex2.rawPngBytes[1]).toBe(0x50);
    expect(ex3.rawPngBytes[0]).toBe(0x89);
    expect(ex3.rawPngBytes[1]).toBe(0x50);
  });

  it('successfully extracts and validates the payload from Exhibit 2', () => {
    const carrier = STEGO_EXHIBITS[1];
    const result = extractLSBFromPngBytes(carrier.rawPngBytes, 'rgb-lsb');

    expect(result.valid).toBe(true);
    expect(result.checksumValid).toBe(true);
    expect(result.magicHeaderFound).toBe(true);
    expect(result.bytesExtracted).toBe(130);
    expect(result.payloadText).toBe(HARMLESS_STEGO_PAYLOAD);
    expect(result.payloadText).toContain('CONFIDENTIAL NOTE: Scheduled warehouse transfer for Q4 completed without incident.');
    expect(result.payloadText).toContain('Ref: AUDIT-7749.');
    expect(result.diagnostics).toContain('Successfully extracted 130 bytes of plaintext');
  });

  it('fails cleanly on Exhibit 1 (Control 1 gradient) without finding magic header', () => {
    const control1 = STEGO_EXHIBITS[0];
    const result = extractLSBFromPngBytes(control1.rawPngBytes, 'rgb-lsb');

    expect(result.valid).toBe(false);
    expect(result.magicHeaderFound).toBe(false);
    expect(result.checksumValid).toBeUndefined();
    expect(result.bytesExtracted).toBe(0);
    expect(result.payloadText).toBeUndefined();
    expect(result.diagnostics).toContain('No valid steganographic magic header found');
  });

  it('fails cleanly on Exhibit 3 (Control 2 noise) without finding magic header', () => {
    const control2 = STEGO_EXHIBITS[2];
    const result = extractLSBFromPngBytes(control2.rawPngBytes, 'rgb-lsb');

    expect(result.valid).toBe(false);
    expect(result.magicHeaderFound).toBe(false);
    expect(result.checksumValid).toBeUndefined();
    expect(result.bytesExtracted).toBe(0);
    expect(result.payloadText).toBeUndefined();
    expect(result.diagnostics).toContain('No valid steganographic magic header found');
  });

  it('fails when extracting with incorrect bitplane modes on Exhibit 2', () => {
    const carrier = STEGO_EXHIBITS[1];

    // MSB extraction on carrier
    const msbResult = extractLSBFromPngBytes(carrier.rawPngBytes, 'msb');
    expect(msbResult.valid).toBe(false);
    expect(msbResult.magicHeaderFound).toBe(false);

    // Alpha LSB extraction on carrier
    const alphaResult = extractLSBFromPngBytes(carrier.rawPngBytes, 'alpha-lsb');
    expect(alphaResult.valid).toBe(false);
    expect(alphaResult.magicHeaderFound).toBe(false);
  });

  it('detects and flags corrupted checksum in malformed fixture', () => {
    const corruptedBytes = createCorruptedChecksumFixture();
    const result = extractLSBFromPngBytes(corruptedBytes, 'rgb-lsb');

    expect(result.valid).toBe(false);
    expect(result.magicHeaderFound).toBe(true);
    expect(result.checksumValid).toBe(false);
    expect(result.diagnostics).toContain('checksum mismatch');
    expect(result.payloadText).toBeDefined();
  });

  it('detects and handles corrupted length field exceeding available capacity', () => {
    const corruptedBytes = createCorruptedLengthFixture();
    const result = extractLSBFromPngBytes(corruptedBytes, 'rgb-lsb');

    expect(result.valid).toBe(false);
    expect(result.magicHeaderFound).toBe(true);
    expect(result.checksumValid).toBeUndefined();
    expect(result.diagnostics).toContain('exceeds available carrier capacity');
    expect(result.payloadText).toBeUndefined();
  });

  it('gracefully handles invalid PNG headers', () => {
    const badBytes = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
    const result = extractLSBFromPngBytes(badBytes, 'rgb-lsb');

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toContain('Invalid or corrupted PNG signature');
  });

  it('gracefully handles empty or truncated byte buffers', () => {
    const emptyBytes = new Uint8Array(0);
    const result = extractLSBFromPngBytes(emptyBytes, 'rgb-lsb');

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toContain('Invalid or corrupted PNG signature');
  });
});

// ── Step 1: Inspection & Extraction Method ────────────────────────────────────

describe('cc-df-03 Step 1: Inspection & Extraction Method', () => {
  it('awards 30 points for selecting sequential RGB LSB with header & checksum validation', () => {
    const points = evaluateStep(stepMethod, 'meth-lsb');
    expect(points).toBe(30);
  });

  it('awards 0 points for filesize comparison distractor', () => {
    const points = evaluateStep(stepMethod, 'meth-filesize');
    expect(points).toBe(0);
  });

  it('awards 0 points for visual inspection distractor', () => {
    const points = evaluateStep(stepMethod, 'meth-visual');
    expect(points).toBe(0);
  });

  it('awards 0 points for EXIF-only inspection distractor', () => {
    const points = evaluateStep(stepMethod, 'meth-exif-only');
    expect(points).toBe(0);
  });
});

// ── Step 2: Testing Exhibits & Carrier Identification ────────────────────────

describe('cc-df-03 Step 2: Testing Exhibits & Carrier Identification', () => {
  it('awards 40 points for identifying Exhibit 2 (evidence-scan-02.png) as carrier', () => {
    const points = evaluateStep(stepCarrier, 'carrier-ev02');
    expect(points).toBe(40);
  });

  it('awards 0 points for selecting Exhibit 1 (Control 1)', () => {
    const points = evaluateStep(stepCarrier, 'carrier-ev01');
    expect(points).toBe(0);
  });

  it('awards 0 points for selecting Exhibit 3 (Control 2)', () => {
    const points = evaluateStep(stepCarrier, 'carrier-ev03');
    expect(points).toBe(0);
  });
});

// ── Step 3: Defensible Reporting & Evidence Preservation ─────────────────────

describe('cc-df-03 Step 3: Defensible Reporting & Preservation', () => {
  it('awards 30 points for defensible reporting preserving chain of custody without unsupported malice claims', () => {
    const points = evaluateStep(stepReporting, 'report-defensible');
    expect(points).toBe(30);
  });

  it('awards 0 points for espionage prosecution distractor', () => {
    const points = evaluateStep(stepReporting, 'report-espionage');
    expect(points).toBe(0);
  });

  it('awards 0 points for deleting controls distractor', () => {
    const points = evaluateStep(stepReporting, 'report-delete-controls');
    expect(points).toBe(0);
  });

  it('awards 0 points for modifying evidence file distractor', () => {
    const points = evaluateStep(stepReporting, 'report-modify-header');
    expect(points).toBe(0);
  });
});

// ── Anti-Guessing & End-to-End Scoring ───────────────────────────────────────

describe('cc-df-03 End-to-End Scoring & Anti-Guessing', () => {
  it('awards full 100 points and marks challenge passed for all correct answers', () => {
    const responses = buildStepResponses(challengeCC_DF_03.steps, {
      'step-extraction-method': 'meth-lsb',
      'step-identify-carrier': 'carrier-ev02',
      'step-reporting-action': 'report-defensible',
    });

    const scoreResult = computeScore(responses, 0, challengeCC_DF_03.passThreshold);
    expect(scoreResult.earnedScore).toBe(100);
    expect(scoreResult.finalScore).toBe(100);
    expect(scoreResult.passed).toBe(true);
  });

  it('fails pass threshold when learner misses the carrier step (max score 60 < 70)', () => {
    const responses = buildStepResponses(challengeCC_DF_03.steps, {
      'step-extraction-method': 'meth-lsb',
      'step-identify-carrier': 'carrier-ev01', // incorrect carrier
      'step-reporting-action': 'report-defensible',
    });

    const scoreResult = computeScore(responses, 0, challengeCC_DF_03.passThreshold);
    expect(scoreResult.earnedScore).toBe(60);
    expect(scoreResult.finalScore).toBe(60);
    expect(scoreResult.passed).toBe(false);
  });

  it('fails pass threshold for guessing first option in all steps', () => {
    const responses = buildStepResponses(challengeCC_DF_03.steps, {
      'step-extraction-method': 'meth-filesize',
      'step-identify-carrier': 'carrier-ev01',
      'step-reporting-action': 'report-espionage',
    });

    const scoreResult = computeScore(responses, 0, challengeCC_DF_03.passThreshold);
    expect(scoreResult.earnedScore).toBe(0);
    expect(scoreResult.finalScore).toBe(0);
    expect(scoreResult.passed).toBe(false);
  });

  it('applies hint penalties correctly (-10 per hint, floor 0)', () => {
    const perfectResponses = buildStepResponses(challengeCC_DF_03.steps, {
      'step-extraction-method': 'meth-lsb',
      'step-identify-carrier': 'carrier-ev02',
      'step-reporting-action': 'report-defensible',
    });

    // 1 hint: 100 - 10 = 90 (PASS)
    const score1 = computeScore(perfectResponses, 1, challengeCC_DF_03.passThreshold);
    expect(score1.finalScore).toBe(90);
    expect(score1.passed).toBe(true);

    // 2 hints: 100 - 20 = 80 (PASS)
    const score2 = computeScore(perfectResponses, 2, challengeCC_DF_03.passThreshold);
    expect(score2.finalScore).toBe(80);
    expect(score2.passed).toBe(true);

    // 3 hints: 100 - 30 = 70 (PASS - exactly on threshold)
    const score3 = computeScore(perfectResponses, 3, challengeCC_DF_03.passThreshold);
    expect(score3.finalScore).toBe(70);
    expect(score3.passed).toBe(true);

    // 4 hints: 100 - 40 = 60 (FAIL - below threshold 70)
    const score4 = computeScore(perfectResponses, 4, challengeCC_DF_03.passThreshold);
    expect(score4.finalScore).toBe(60);
    expect(score4.passed).toBe(false);
  });

  it('correctly formats display answers using getCorrectAnswerDisplay', () => {
    const disp1 = getCorrectAnswerDisplay(stepMethod);
    expect(disp1).toContain('least significant bits (LSB)');

    const disp2 = getCorrectAnswerDisplay(stepCarrier);
    expect(disp2).toContain('evidence-scan-02.png');

    const disp3 = getCorrectAnswerDisplay(stepReporting);
    expect(disp3).toContain('Document the successful recovery');
  });
});
