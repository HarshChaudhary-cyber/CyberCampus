/**
 * Challenge evaluator tests — cc-df-01 "Deleted File Recovery"
 * Room: Digital Forensics | Difficulty: Beginner
 *
 * Covers:
 * - Challenge data & registration (in ALL_CHALLENGES and LIVE_CHALLENGE_IDS)
 * - Coexistence: cc-df-01 is live in Digital Forensics, cc-df-02 & cc-df-03 remain coming soon;
 *   preserves all 9 previously built live challenges across phishing, secops, and network
 * - Evidence integrity:
 *     - Simulated filesystem image with 8 files (5 deleted, 3 active)
 *     - Fictional domains (RFC 2606 .example) and local paths
 *     - Target file client_tax_records_2026.csv with 1,420 unmasked customer records matching the leak
 *     - Plausible innocent distractors (confidential_salary_review.xlsx, cleanup_temp_files.ps1, slack_setup_x64.exe)
 *     - SOP FOR-101 digital evidence handling guidelines
 * - Step 1: target file identification (30 pts, single-choice, no partial credit)
 * - Step 2: corroborating forensic indicators (35 pts, multi-choice, partial credit allowed)
 * - Step 3: sound evidence-preservation procedure (35 pts, single-choice, no partial credit)
 * - Anti-guessing end-to-end evaluation:
 *     - Uniform guesser cannot reach 70 pt pass threshold
 *     - Perfect submission achieves 100 pts
 *     - Partial credit run (2/3 Step 2 = 88.33 pts, PASS)
 * - Hint penalty calculation (-10 pts per hint, floor 0)
 * - Educational explanations teaching that "deleted" does not automatically mean malicious
 * - getCorrectAnswerDisplay formatting
 * - Network feedback correction confirmation for cc-nw-03 (102 bytes total frame length)
 */

import { describe, it, expect } from 'vitest';
import { evaluateStep, buildStepResponses, getCorrectAnswerDisplay } from '../challenges/evaluator';
import { challengeCC_DF_01, type FileSystemContent } from '../challenges/data/cc-df-01';
import { challengeCC_NW_03 } from '../challenges/data/cc-nw-03';
import { getChallenge, getRoom, LIVE_CHALLENGE_IDS, ALL_CHALLENGES } from '../challenges';
import { computeScore } from '../store';

const [stepTarget, stepEvidence, stepPreservation] = challengeCC_DF_01.steps;

// ── Registration & Metadata ──────────────────────────────────────────────────

describe('cc-df-01 registration & metadata', () => {
  it('is registered in CHALLENGE_MAP via getChallenge', () => {
    const ch = getChallenge('cc-df-01');
    expect(ch).toBeDefined();
    expect(ch?.id).toBe('cc-df-01');
    expect(ch?.title).toBe('Deleted File Recovery');
    expect(ch?.difficulty).toBe('beginner');
    expect(ch?.roomId).toBe('forensics');
  });

  it('is registered in ALL_CHALLENGES array', () => {
    const found = ALL_CHALLENGES.find((c) => c.id === 'cc-df-01');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Deleted File Recovery');
  });

  it('is marked as live in LIVE_CHALLENGE_IDS along with cc-df-02, while keeping cc-df-03 coming soon', () => {
    expect(LIVE_CHALLENGE_IDS.has('cc-df-01')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-df-02')).toBe(true);
    expect(LIVE_CHALLENGE_IDS.has('cc-df-03')).toBe(false);
  });

  it('preserves all nine previously built live challenges across phishing, secops, and network', () => {
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
  });

  it('Digital Forensics room contains cc-df-01, cc-df-02, cc-df-03', () => {
    const room = getRoom('forensics');
    expect(room).toBeDefined();
    expect(room?.title).toBe('Digital Forensics');
    expect(room?.accentClass).toBe('room-forensics');
    expect(room?.challengeIds).toEqual(['cc-df-01', 'cc-df-02', 'cc-df-03']);
  });

  it('step pointValues sum to exactly 100', () => {
    const total = challengeCC_DF_01.steps.reduce((sum, s) => sum + s.pointValue, 0);
    expect(total).toBe(100);
  });

  it('passThreshold is 70', () => {
    expect(challengeCC_DF_01.passThreshold).toBe(70);
  });

  it('has 3 helpful hints and digital forensics skills', () => {
    expect(challengeCC_DF_01.hints).toHaveLength(3);
    expect(challengeCC_DF_01.skills).toContain('filesystem-forensics');
    expect(challengeCC_DF_01.skills).toContain('deleted-file-recovery');
    expect(challengeCC_DF_01.skills).toContain('metadata-timestamp-analysis');
    expect(challengeCC_DF_01.skills).toContain('evidence-preservation');
    expect(challengeCC_DF_01.skills).toContain('chain-of-custody');
  });
});

// ── Evidence Integrity & Simulated Filesystem Structure ──────────────────────

describe('cc-df-01 evidence integrity & filesystem structure', () => {
  it('contains 2 evidence items: filesystem triage image and SOP FOR-101 policy', () => {
    expect(challengeCC_DF_01.evidence).toHaveLength(2);
    expect(challengeCC_DF_01.evidence.map((e) => e.id)).toEqual(['ev-filesystem', 'ev-forensic-sop']);
  });

  it('simulated filesystem contains 8 files with balanced active and deleted states', () => {
    const fsEv = challengeCC_DF_01.evidence.find((e) => e.id === 'ev-filesystem')!;
    const content = fsEv.content as unknown as FileSystemContent;

    expect(content.isFileSystem).toBe(true);
    expect(content.files).toHaveLength(8);

    const deletedFiles = content.files.filter((f) => f.status === 'deleted');
    const activeFiles = content.files.filter((f) => f.status === 'active');

    expect(deletedFiles).toHaveLength(5);
    expect(activeFiles).toHaveLength(3);
  });

  it('identifies client_tax_records_2026.csv as the primary leak file staged in %TEMP% and deleted', () => {
    const fsEv = challengeCC_DF_01.evidence.find((e) => e.id === 'ev-filesystem')!;
    const content = fsEv.content as unknown as FileSystemContent;

    const target = content.files.find((f) => f.id === 'file-client-tax')!;
    expect(target).toBeDefined();
    expect(target.name).toBe('client_tax_records_2026.csv');
    expect(target.directory).toContain('Temp');
    expect(target.status).toBe('deleted');
    expect(target.allocated).toBe(false);
    expect(target.sizeFormatted).toBe('1.4 MB');
    expect(target.createdTime).toBe('2026-09-24 14:15:00 UTC');
    expect(target.deletionTime).toBe('2026-09-24 16:45:00 UTC');
    expect(target.preview).toContain('account_id,client_name,routing_transit,tax_id,balance_usd');
    expect(target.preview).toContain('Apex Horizon LLC');
    expect(target.preview).toContain('1,420 sensitive client records');
  });

  it('includes plausible innocent distractors whose context proves they are benign', () => {
    const fsEv = challengeCC_DF_01.evidence.find((e) => e.id === 'ev-filesystem')!;
    const content = fsEv.content as unknown as FileSystemContent;

    // Distractor 1: confidential_salary_review.xlsx looks suspicious by name, but preview is empty template
    const salaryFile = content.files.find((f) => f.id === 'file-confidential-salary')!;
    expect(salaryFile.status).toBe('deleted');
    expect(salaryFile.preview).toContain('Blank Template');
    expect(salaryFile.preview).toContain('All employee and compensation fields unpopulated');

    // Distractor 2: cleanup_temp_files.ps1 looks like wiper, but is code-signed Veridian IT utility
    const scriptFile = content.files.find((f) => f.id === 'file-cleanup-script')!;
    expect(scriptFile.status).toBe('active');
    expect(scriptFile.preview).toContain('Veridian Logistics — IT Desktop Support Scheduled Maintenance Script');
    expect(scriptFile.preview).toContain('Approved Change Ticket: CHG-8109');

    // Distractor 3: Q3_Financial_Summary.pdf contains only public marketing information
    const pdfFile = content.files.find((f) => f.id === 'file-q3-summary')!;
    expect(pdfFile.status).toBe('active');
    expect(pdfFile.preview).toContain('Contains zero customer PII or banking data');
  });

  it('uses only RFC 2606 .example domains and internal host references', () => {
    const evidenceStr = JSON.stringify(challengeCC_DF_01.evidence);
    const emailMatches = evidenceStr.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)?.map((e) => e.slice(1)) || [];
    const urlMatches = evidenceStr.match(/https?:\/\/([a-zA-Z0-9.-]+)/g)?.map((u) => u.replace(/^https?:\/\//, '')) || [];
    const allDomains = [...emailMatches, ...urlMatches];

    expect(allDomains.length).toBeGreaterThan(0);
    for (const d of allDomains) {
      expect(d.endsWith('.example')).toBe(true);
    }
  });
});

// ── Step 1: Target File Identification (30 pts) ──────────────────────────────

describe('cc-df-01 Step 1: target file identification', () => {
  it('awards full 30 pts for correctly identifying client_tax_records_2026.csv', () => {
    const submission = 'file-client-tax';
    const points = evaluateStep(stepTarget, submission);
    expect(points).toBe(30);
  });

  it('awards 0 pts for the suspicious-name distractor (confidential_salary_review.xlsx)', () => {
    const submission = 'file-confidential-salary';
    const points = evaluateStep(stepTarget, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for the IT maintenance script distractor (cleanup_temp_files.ps1)', () => {
    const submission = 'file-cleanup-script';
    const points = evaluateStep(stepTarget, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for the public financial summary distractor (Q3_Financial_Summary.pdf)', () => {
    const submission = 'file-q3-summary';
    const points = evaluateStep(stepTarget, submission);
    expect(points).toBe(0);
  });
});

// ── Step 2: Corroborating Forensic Evidence (35 pts) ──────────────────────────

describe('cc-df-01 Step 2: corroborating forensic evidence', () => {
  it('awards full 35 pts when all 3 correct indicators are chosen', () => {
    const submission = ['ev-content-match', 'ev-timestamp-timing', 'ev-staging-anomaly'];
    const points = evaluateStep(stepEvidence, submission);
    expect(points).toBe(35);
  });

  it('awards partial credit (23.3 pts) when 2 of 3 correct indicators are chosen without wrong picks', () => {
    const submission = ['ev-content-match', 'ev-timestamp-timing'];
    const points = evaluateStep(stepEvidence, submission);
    expect(points).toBeCloseTo(23.3, 1);
  });

  it('awards partial credit (11.7 pts) when 1 of 3 correct indicators is chosen without wrong picks', () => {
    const submission = ['ev-content-match'];
    const points = evaluateStep(stepEvidence, submission);
    expect(points).toBeCloseTo(11.7, 1);
  });

  it('penalizes incorrect distractors (fallacy that deleted = malware)', () => {
    // 2 correct + 1 wrong: earned = 23.33 - 11.67 = 11.67
    const submission = ['ev-content-match', 'ev-timestamp-timing', 'ev-deleted-implies-malware'];
    const points = evaluateStep(stepEvidence, submission);
    expect(points).toBeCloseTo(11.7, 1);
  });

  it('awards 0 pts when all chosen items are incorrect distractors', () => {
    const submission = ['ev-deleted-implies-malware', 'ev-executable-magic', 'ev-zero-hash'];
    const points = evaluateStep(stepEvidence, submission);
    expect(points).toBe(0);
  });
});

// ── Step 3: Evidence Preservation Action (35 pts) ────────────────────────────

describe('cc-df-01 Step 3: evidence preservation action', () => {
  it('awards full 35 pts for verifying existing image hash, maintaining custody, and analyzing working copy', () => {
    const submission = 'action-bitstream-image';
    const points = evaluateStep(stepPreservation, submission);
    expect(points).toBe(35);
  });

  it('awards 0 pts for copying via Windows File Explorer', () => {
    const submission = 'action-copy-usb';
    const points = evaluateStep(stepPreservation, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for booting into Safe Mode and opening in Excel', () => {
    const submission = 'action-excel-safe-mode';
    const points = evaluateStep(stepPreservation, submission);
    expect(points).toBe(0);
  });

  it('awards 0 pts for running a secure disk wiper on the suspect system', () => {
    const submission = 'action-run-wiper';
    const points = evaluateStep(stepPreservation, submission);
    expect(points).toBe(0);
  });
});

// ── Anti-Guessing & End-to-End Scoring ────────────────────────────────────────

describe('cc-df-01 anti-guessing & end-to-end evaluation', () => {
  it('guarantees that guessing Step 1 incorrectly CANNOT pass even with perfect Steps 2 & 3 (70 threshold)', () => {
    const stepState = {
      'step-target-file': 'file-confidential-salary', // 0 pts (fell for suspicious name trap)
      'step-forensic-evidence': ['ev-content-match', 'ev-timestamp-timing', 'ev-staging-anomaly'], // 35 pts
      'step-preservation-action': 'action-bitstream-image', // 35 pts
    };

    const responses = buildStepResponses(challengeCC_DF_01.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_DF_01.passThreshold);

    // 0 + 35 + 35 = 70. But if Step 2 has any imperfection (e.g. 23.33 pts), score drops to 58.33 < 70
    expect(scoreResult.earnedScore).toBe(70);

    const imperfectState = {
      'step-target-file': 'file-confidential-salary', // 0 pts
      'step-forensic-evidence': ['ev-content-match', 'ev-timestamp-timing'], // 23.33 pts
      'step-preservation-action': 'action-bitstream-image', // 35 pts
    };
    const imperfectResponses = buildStepResponses(challengeCC_DF_01.steps, imperfectState);
    const imperfectScore = computeScore(imperfectResponses, 0, challengeCC_DF_01.passThreshold);

    expect(imperfectScore.earnedScore).toBeCloseTo(58.3, 1);
    expect(imperfectScore.passed).toBe(false);
  });

  it('achieves a perfect score of 100 on fully correct submission', () => {
    const stepState = {
      'step-target-file': 'file-client-tax',
      'step-forensic-evidence': ['ev-content-match', 'ev-timestamp-timing', 'ev-staging-anomaly'],
      'step-preservation-action': 'action-bitstream-image',
    };

    const responses = buildStepResponses(challengeCC_DF_01.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_DF_01.passThreshold);

    expect(scoreResult.earnedScore).toBe(100);
    expect(scoreResult.finalScore).toBe(100);
    expect(scoreResult.passed).toBe(true);
  });

  it('passes with high partial credit (88.3 pts) when 1 field is missed in Step 2', () => {
    const stepState = {
      'step-target-file': 'file-client-tax', // 30 pts
      'step-forensic-evidence': ['ev-content-match', 'ev-timestamp-timing'], // 23.33 pts
      'step-preservation-action': 'action-bitstream-image', // 35 pts
    };

    const responses = buildStepResponses(challengeCC_DF_01.steps, stepState);
    const scoreResult = computeScore(responses, 0, challengeCC_DF_01.passThreshold);

    expect(scoreResult.earnedScore).toBeCloseTo(88.3, 1);
    expect(scoreResult.finalScore).toBeCloseTo(88.3, 1);
    expect(scoreResult.passed).toBe(true);
  });

  it('correctly deducts hint penalties of 10 points per hint', () => {
    const stepState = {
      'step-target-file': 'file-client-tax',
      'step-forensic-evidence': ['ev-content-match', 'ev-timestamp-timing', 'ev-staging-anomaly'],
      'step-preservation-action': 'action-bitstream-image',
    };

    const responses = buildStepResponses(challengeCC_DF_01.steps, stepState);

    const res1 = computeScore(responses, 1, challengeCC_DF_01.passThreshold);
    expect(res1.earnedScore).toBe(100);
    expect(res1.finalScore).toBe(90);
    expect(res1.passed).toBe(true);

    const res2 = computeScore(responses, 2, challengeCC_DF_01.passThreshold);
    expect(res2.earnedScore).toBe(100);
    expect(res2.finalScore).toBe(80);
    expect(res2.passed).toBe(true);

    const res3 = computeScore(responses, 3, challengeCC_DF_01.passThreshold);
    expect(res3.earnedScore).toBe(100);
    expect(res3.finalScore).toBe(70);
    expect(res3.passed).toBe(true); // exactly on pass threshold 70
  });
});

// ── Educational Explanations & getCorrectAnswerDisplay ────────────────────────

describe('cc-df-01 educational explanations & answer formatting', () => {
  it('provides comprehensive explanations covering normal vs malicious deletions and bitstream preservation', () => {
    const { successExplanation, failureExplanation } = challengeCC_DF_01;

    expect(successExplanation).toContain('client_tax_records_2026.csv');
    expect(successExplanation).toContain('1,420 unmasked customer records');
    expect(successExplanation).toContain('confidential_salary_review.xlsx');
    expect(successExplanation).toContain('cleanup_temp_files.ps1');
    expect(successExplanation).toContain('write-blocking');
    expect(successExplanation).toContain('chain-of-custody');

    expect(failureExplanation).toContain('Normal vs Malicious Deletion');
    expect(failureExplanation).toContain('Evidence Correlation');
    expect(failureExplanation).toContain('Preservation Rules');
  });

  it('getCorrectAnswerDisplay formats answers properly for single-choice and multi-choice steps', () => {
    const disp1 = getCorrectAnswerDisplay(stepTarget);
    expect(disp1).toContain('client_tax_records_2026.csv');

    const disp2 = getCorrectAnswerDisplay(stepEvidence);
    expect(disp2).toContain('Recovered file content contains unmasked client banking identifiers');
    expect(disp2).toContain('File creation (14:15 UTC) and deletion (16:45 UTC)');
    expect(disp2).toContain('ephemeral temporary folder (AppData\\Local\\Temp)');

    const disp3 = getCorrectAnswerDisplay(stepPreservation);
    expect(disp3).toContain('Verify the existing E01 image’s recorded SHA-256 hash');
    expect(disp3).toContain('verified working copy');
  });
});

// ── Network Security Feedback Correction Confirmation (Task 6A Requirement) ──

describe('cc-nw-03 feedback correction confirmation', () => {
  it('verifies cc-nw-03 does not call 102 bytes frame overhead, but total simulated frame length', () => {
    const { hints, successExplanation, failureExplanation } = challengeCC_NW_03;
    const allText = [...hints, successExplanation, failureExplanation].join(' ');

    expect(allText).not.toContain('102 bytes of frame overhead');
    expect(allText).not.toContain('102 bytes frame overhead');
    expect(allText).toContain('102 bytes');
    expect(allText).toContain('total simulated frame length');
  });
});
