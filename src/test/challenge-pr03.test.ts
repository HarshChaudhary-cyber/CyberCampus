import React from 'react';
import { describe, it, expect } from 'vitest';
import {
  ALL_CHALLENGES,
  CHALLENGE_MAP,
  LIVE_CHALLENGE_IDS,
  getChallenge,
} from '../challenges';
import {
  challengeCC_PR_03,
  type DataInventoryContent,
  type RetentionConfigContent,
} from '../challenges/data/cc-pr-03';
import {
  evaluateStep,
  buildStepResponses,
  getCorrectAnswerDisplay,
} from '../challenges/evaluator';
import { computeScore } from '../store';
import { CampusPage } from '../pages/CampusPage';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

describe('Challenge cc-pr-03: "Data Minimisation Audit" (Privacy & Account Security - Advanced)', () => {
  // ── Registration & Registry Integrity ───────────────────────────────────────
  describe('Registration & Registry Integrity', () => {
    it('is registered in CHALLENGE_MAP with id "cc-pr-03"', () => {
      const ch = getChallenge('cc-pr-03');
      expect(ch).toBeDefined();
      expect(CHALLENGE_MAP['cc-pr-03']).toBe(ch);
      expect(ch?.id).toBe('cc-pr-03');
      expect(ch?.title).toBe('Data Minimisation Audit');
      expect(ch?.difficulty).toBe('advanced');
      expect(ch?.roomId).toBe('privacy');
    });

    it('is included in ALL_CHALLENGES and LIVE_CHALLENGE_IDS', () => {
      expect(ALL_CHALLENGES.some((c) => c.id === 'cc-pr-03')).toBe(true);
      expect(LIVE_CHALLENGE_IDS.has('cc-pr-03')).toBe(true);
    });

    it('confirms all 15 challenges across all 5 rooms are fully built and live', () => {
      expect(LIVE_CHALLENGE_IDS.size).toBe(15);
      const all15Ids = [
        // Phishing Defense
        'cc-ph-01', 'cc-ph-02', 'cc-ph-03',
        // Security Operations
        'cc-so-01', 'cc-so-02', 'cc-so-03',
        // Network Security
        'cc-nw-01', 'cc-nw-02', 'cc-nw-03',
        // Digital Forensics
        'cc-df-01', 'cc-df-02', 'cc-df-03',
        // Privacy & Account Security
        'cc-pr-01', 'cc-pr-02', 'cc-pr-03',
      ];
      for (const id of all15Ids) {
        expect(LIVE_CHALLENGE_IDS.has(id)).toBe(true);
        const challenge = getChallenge(id);
        expect(challenge).toBeDefined();
        expect(challenge?.id).toBe(id);
      }
    });

    it('has standard challenge structure with 100 max points and 70 pass threshold', () => {
      const totalPoints = challengeCC_PR_03.steps.reduce((sum, s) => sum + s.pointValue, 0);
      expect(totalPoints).toBe(100);
      expect(challengeCC_PR_03.passThreshold).toBe(70);
      expect(challengeCC_PR_03.steps).toHaveLength(3);
      expect(challengeCC_PR_03.hints).toHaveLength(3);
    });
  });

  // ── Evidence Integrity ──────────────────────────────────────────────────────
  describe('Evidence Integrity', () => {
    it('contains four structured evidence items covering requirements, inventory, configuration, and principles', () => {
      expect(challengeCC_PR_03.evidence).toHaveLength(4);
      const [reqs, inventory, config, principles] = challengeCC_PR_03.evidence;

      expect(reqs.id).toBe('ev-studyapp-requirements');
      expect(reqs.type).toBe('policy');

      expect(inventory.id).toBe('ev-data-inventory');
      expect(inventory.type).toBe('file');

      expect(config.id).toBe('ev-retention-access-config');
      expect(config.type).toBe('file');

      expect(principles.id).toBe('ev-privacy-principles');
      expect(principles.type).toBe('policy');
    });

    it('verifies product requirements declare study planning, optional alerts, optional calendar, and exclude social/ad tracking', () => {
      const reqEv = challengeCC_PR_03.evidence.find((e) => e.id === 'ev-studyapp-requirements');
      expect(reqEv).toBeDefined();
      const raw = reqEv?.content as { title: string; rules: string[] };

      expect(raw.title).toContain('StudyTrack');
      const allRules = raw.rules.join('\n');
      expect(allRules).toContain('Study Scheduling');
      expect(allRules).toContain('Session Reminders');
      expect(allRules).toContain('Calendar Synchronization');
      expect(allRules).toContain('Explicitly Excluded Scopes');
      expect(allRules).toContain('NOT provide social networking, peer messaging');
      expect(allRules).toContain('targeted advertising');
      expect(allRules).toContain('background physical location tracking');
    });

    it('verifies inventory contains exactly 8 candidate entries with clear scope and context', () => {
      const invEv = challengeCC_PR_03.evidence.find((e) => e.id === 'ev-data-inventory');
      expect(invEv).toBeDefined();
      const content = invEv?.content as unknown as DataInventoryContent;

      expect(content.isDataInventory).toBe(true);
      expect(content.appName).toBe('StudyTrack');
      expect(content.documentedPurposes).toHaveLength(3);
      expect(content.entries).toHaveLength(8);

      const entryIds = content.entries.map((e) => e.id);
      expect(entryIds).toEqual([
        'inv-session-details',
        'inv-timezone-offset',
        'inv-notification-permission',
        'inv-selected-calendar',
        'inv-address-book-contacts',
        'inv-precise-location',
        'inv-advertising-identifiers',
        'inv-indefinite-deleted-retention',
      ]);
    });

    it('verifies draft retention configuration presents an 8-row matrix for cross-referencing', () => {
      const cfgEv = challengeCC_PR_03.evidence.find((e) => e.id === 'ev-retention-access-config');
      expect(cfgEv).toBeDefined();
      const content = cfgEv?.content as unknown as RetentionConfigContent;

      expect(content.isRetentionConfig).toBe(true);
      expect(content.rows).toHaveLength(8);
      expect(content.rows[0].moduleName).toContain('Core Study Scheduler');
      expect(content.rows[4].moduleName).toContain('Social Discovery');
      expect(content.rows[5].moduleName).toContain('Context Sensor');
      expect(content.rows[6].moduleName).toContain('Ad Mediation');
    });

    it('neutralizes pre-submission evidence: keeps observable facts while avoiding classification spoiler phrases', () => {
      const invEv = challengeCC_PR_03.evidence.find((e) => e.id === 'ev-data-inventory');
      const invContent = invEv?.content as unknown as DataInventoryContent;

      for (const entry of invContent.entries) {
        expect(entry.technicalContext).not.toContain('violates purpose limitation');
        expect(entry.technicalContext).not.toContain('wholly disproportionate');
        expect(entry.technicalContext).not.toContain('unjustified');
      }

      const cfgEv = challengeCC_PR_03.evidence.find((e) => e.id === 'ev-retention-access-config');
      const cfgContent = cfgEv?.content as unknown as RetentionConfigContent;

      for (const row of cfgContent.rows) {
        expect(row.operationalHandling).toBeDefined();
        expect(row.operationalHandling).not.toContain('Compliant with');
        expect(row.operationalHandling).not.toContain('OVERLY BROAD');
        expect(row.operationalHandling).not.toContain('DISPROPORTIONATE');
        expect(row.operationalHandling).not.toContain('EXCESSIVE');
        expect(row.operationalHandling).not.toContain('STORAGE LIMITATION DEFICIT');
        expect(row.operationalHandling).not.toContain('UNJUSTIFIED');
      }
    });

    it('verifies privacy principles articulate data minimisation, purpose limitation, proportionality, and storage limitation', () => {
      const prinEv = challengeCC_PR_03.evidence.find((e) => e.id === 'ev-privacy-principles');
      expect(prinEv).toBeDefined();
      const raw = prinEv?.content as { rules: string[] };
      const allRules = raw.rules.join('\n');

      expect(allRules).toContain('Data Minimisation & Necessity');
      expect(allRules).toContain('Proportionality & Purpose Limitation');
      expect(allRules).toContain('Affirmative User Control & Granular Consent');
      expect(allRules).toContain('Least Privilege in Permissions');
      expect(allRules).toContain('Storage Limitation & Verifiable Deletion');
    });

    it('avoids country-specific legal claims or university names in copy', () => {
      const stringified = JSON.stringify(challengeCC_PR_03);
      // Ensure no specific statutes/jurisdictions are claimed as automatically violated
      expect(stringified).not.toContain('GDPR Article');
      expect(stringified).not.toContain('CCPA Section');
      expect(stringified).not.toContain('HIPAA Violation');
      // Ensure no university names used
      expect(stringified).not.toContain('University');
      expect(stringified).not.toContain('College');
    });
  });

  // ── Step 1: Classification (40 pts) ─────────────────────────────────────────
  describe('Step 1: Classification (40 pts)', () => {
    const step1 = challengeCC_PR_03.steps[0];

    it('allocates 40 points and allows partial credit across 8 items (5 pts each)', () => {
      expect(step1.interaction).toBe('classification');
      expect(step1.pointValue).toBe(40);
      expect(step1.partialCreditAllowed).toBe(true);
      expect(step1.items).toHaveLength(8);
    });

    it('awards full 40 points for the correct classification of all 8 items', () => {
      const correctSubmission = {
        'inv-session-details': 'Necessary and appropriately scoped',
        'inv-timezone-offset': 'Necessary and appropriately scoped',
        'inv-notification-permission': 'Optional with user control',
        'inv-selected-calendar': 'Optional with user control',
        'inv-address-book-contacts': 'Excessive or unjustified',
        'inv-precise-location': 'Excessive or unjustified',
        'inv-advertising-identifiers': 'Excessive or unjustified',
        'inv-indefinite-deleted-retention': 'Excessive or unjustified',
      };

      const points = evaluateStep(step1, correctSubmission);
      expect(points).toBe(40);
    });

    it('awards partial credit (35 points) when 7 of 8 items are correct', () => {
      const partialSubmission = {
        'inv-session-details': 'Necessary and appropriately scoped',
        'inv-timezone-offset': 'Necessary and appropriately scoped',
        'inv-notification-permission': 'Optional with user control',
        'inv-selected-calendar': 'Optional with user control',
        'inv-address-book-contacts': 'Excessive or unjustified',
        'inv-precise-location': 'Excessive or unjustified',
        'inv-advertising-identifiers': 'Excessive or unjustified',
        'inv-indefinite-deleted-retention': 'Necessary and appropriately scoped', // wrong
      };

      const points = evaluateStep(step1, partialSubmission);
      expect(points).toBe(35);
    });

    it('calculates uniform guessing scores accurately', () => {
      // Uniform "Necessary": 2 correct -> 10 pts
      const allNecessary = Object.fromEntries(
        step1.items.map((i) => [i.id, 'Necessary and appropriately scoped'])
      );
      expect(evaluateStep(step1, allNecessary)).toBe(10);

      // Uniform "Optional": 2 correct -> 10 pts
      const allOptional = Object.fromEntries(
        step1.items.map((i) => [i.id, 'Optional with user control'])
      );
      expect(evaluateStep(step1, allOptional)).toBe(10);

      // Uniform "Excessive": 4 correct -> 20 pts
      const allExcessive = Object.fromEntries(
        step1.items.map((i) => [i.id, 'Excessive or unjustified'])
      );
      expect(evaluateStep(step1, allExcessive)).toBe(20);
    });

    it('awards 0 points when submitted empty or completely wrong', () => {
      expect(evaluateStep(step1, {})).toBe(0);

      const allInverted = {
        'inv-session-details': 'Excessive or unjustified',
        'inv-timezone-offset': 'Excessive or unjustified',
        'inv-notification-permission': 'Excessive or unjustified',
        'inv-selected-calendar': 'Excessive or unjustified',
        'inv-address-book-contacts': 'Necessary and appropriately scoped',
        'inv-precise-location': 'Necessary and appropriately scoped',
        'inv-advertising-identifiers': 'Optional with user control',
        'inv-indefinite-deleted-retention': 'Optional with user control',
      };
      expect(evaluateStep(step1, allInverted)).toBe(0);
    });
  });

  // ── Step 2: Guided Form (30 pts) ────────────────────────────────────────────
  describe('Step 2: Guided Form (30 pts)', () => {
    const step2 = challengeCC_PR_03.steps[1];

    it('allocates 30 points across 3 fields (10 pts each) with partial credit', () => {
      expect(step2.interaction).toBe('guided-form');
      expect(step2.pointValue).toBe(30);
      expect(step2.partialCreditAllowed).toBe(true);
      expect(step2.items).toHaveLength(3);
    });

    it('awards 30 points when all 3 fields match the compliant configuration', () => {
      const correctConfig = {
        'cfg-calendar-scope':
          'Granular user-selected calendar read/write access only (isolated from personal calendars)',
        'cfg-retention-schedule':
          'Retain active sessions during account lifetime; automated hard-delete of deleted items within 30 days and upon account closure',
        'cfg-access-telemetry':
          'First-party strictly isolated access; zero third-party ad tracking; encrypted at rest and in transit',
      };

      const points = evaluateStep(step2, correctConfig);
      expect(points).toBe(30);
    });

    it('awards partial credit (20 points) when 2 of 3 fields are correct', () => {
      const partialConfig = {
        'cfg-calendar-scope':
          'Granular user-selected calendar read/write access only (isolated from personal calendars)',
        'cfg-retention-schedule':
          'Retain active sessions during account lifetime; automated hard-delete of deleted items within 30 days and upon account closure',
        'cfg-access-telemetry':
          'Distribute advertising identifiers and location telemetry to commercial ad brokers for monetized analytics', // wrong
      };

      const points = evaluateStep(step2, partialConfig);
      expect(points).toBe(20);
    });

    it('awards 0 points when all fields select non-compliant distractors or are empty', () => {
      expect(evaluateStep(step2, {})).toBe(0);

      const nonCompliantConfig = {
        'cfg-calendar-scope':
          'Full device calendar access granted across all personal, medical, and work accounts',
        'cfg-retention-schedule':
          'Indefinite cloud retention for all historical sessions to support potential future marketing re-engagement',
        'cfg-access-telemetry':
          'Expose all user study schedules through an unauthenticated public API for social networking',
      };
      expect(evaluateStep(step2, nonCompliantConfig)).toBe(0);
    });
  });

  // ── Step 3: Single Choice (30 pts) ──────────────────────────────────────────
  describe('Step 3: Single Choice (30 pts)', () => {
    const step3 = challengeCC_PR_03.steps[2];

    it('allocates 30 points without partial credit', () => {
      expect(step3.interaction).toBe('single-choice');
      expect(step3.pointValue).toBe(30);
      expect(step3.partialCreditAllowed).toBe(false);
      expect(step3.items).toHaveLength(4);
    });

    it('awards 30 points for selecting the comprehensive minimisation plan', () => {
      const points = evaluateStep(step3, 'plan-remediate-minimize-audit');
      expect(points).toBe(30);
    });

    it('awards 0 points for plausible distractors (notice-only, total shutdown, partial anonymization)', () => {
      const distractors = [
        'plan-notice-only-keep-all',
        'plan-disable-all-features',
        'plan-anonymize-gps-ad-networks',
      ];
      for (const d of distractors) {
        expect(evaluateStep(step3, d)).toBe(0);
      }
    });
  });

  // ── End-to-End Evaluation & Scoring Thresholds ──────────────────────────────
  describe('End-to-End Evaluation & Scoring Thresholds', () => {
    const correctStep1 = {
      'inv-session-details': 'Necessary and appropriately scoped',
      'inv-timezone-offset': 'Necessary and appropriately scoped',
      'inv-notification-permission': 'Optional with user control',
      'inv-selected-calendar': 'Optional with user control',
      'inv-address-book-contacts': 'Excessive or unjustified',
      'inv-precise-location': 'Excessive or unjustified',
      'inv-advertising-identifiers': 'Excessive or unjustified',
      'inv-indefinite-deleted-retention': 'Excessive or unjustified',
    };

    const correctStep2 = {
      'cfg-calendar-scope':
        'Granular user-selected calendar read/write access only (isolated from personal calendars)',
      'cfg-retention-schedule':
        'Retain active sessions during account lifetime; automated hard-delete of deleted items within 30 days and upon account closure',
      'cfg-access-telemetry':
        'First-party strictly isolated access; zero third-party ad tracking; encrypted at rest and in transit',
    };

    const correctStep3 = 'plan-remediate-minimize-audit';

    it('passes with full 100 points on a perfect submission (40 + 30 + 30)', () => {
      const responses = buildStepResponses(challengeCC_PR_03.steps, {
        'step-classify-inventory': correctStep1,
        'step-configure-proportions': correctStep2,
        'step-remediation-plan': correctStep3,
      });

      const scoreResult = computeScore(responses, 0, challengeCC_PR_03.passThreshold);
      expect(scoreResult.earnedScore).toBe(100);
      expect(scoreResult.finalScore).toBe(100);
      expect(scoreResult.passed).toBe(true);
    });

    it('passes exactly on threshold (70 pts) if Step 1 and Step 2 are perfect, even if Step 3 is missed (40 + 30 + 0 = 70)', () => {
      const responses = buildStepResponses(challengeCC_PR_03.steps, {
        'step-classify-inventory': correctStep1, // 40
        'step-configure-proportions': correctStep2, // 30
        'step-remediation-plan': 'plan-notice-only-keep-all', // 0
      });

      const scoreResult = computeScore(responses, 0, challengeCC_PR_03.passThreshold);
      expect(scoreResult.earnedScore).toBe(70);
      expect(scoreResult.finalScore).toBe(70);
      expect(scoreResult.passed).toBe(true);
    });

    it('passes exactly on threshold (70 pts) if Step 1 and Step 3 are perfect, even if Step 2 is missed (40 + 0 + 30 = 70)', () => {
      const responses = buildStepResponses(challengeCC_PR_03.steps, {
        'step-classify-inventory': correctStep1, // 40
        'step-configure-proportions': {}, // 0
        'step-remediation-plan': correctStep3, // 30
      });

      const scoreResult = computeScore(responses, 0, challengeCC_PR_03.passThreshold);
      expect(scoreResult.earnedScore).toBe(70);
      expect(scoreResult.finalScore).toBe(70);
      expect(scoreResult.passed).toBe(true);
    });

    it('fails (60 pts < 70) if Step 1 is missed completely even if Step 2 and Step 3 are perfect (0 + 30 + 30 = 60)', () => {
      const responses = buildStepResponses(challengeCC_PR_03.steps, {
        'step-classify-inventory': {}, // 0
        'step-configure-proportions': correctStep2, // 30
        'step-remediation-plan': correctStep3, // 30
      });

      const scoreResult = computeScore(responses, 0, challengeCC_PR_03.passThreshold);
      expect(scoreResult.earnedScore).toBe(60);
      expect(scoreResult.finalScore).toBe(60);
      expect(scoreResult.passed).toBe(false);
    });

    // ── Scoring Combinations with Uniform "Excessive" Guessing (Task 7C.1) ────
    describe('scoring combinations with uniform "Excessive" on Step 1 (20/40 pts)', () => {
      const allExcessive = Object.fromEntries(
        challengeCC_PR_03.steps[0].items.map((i) => [i.id, 'Excessive or unjustified'])
      );

      it('awards 80/100 and passes when Steps 2 and 3 are correct (20 + 30 + 30 = 80)', () => {
        const responses = buildStepResponses(challengeCC_PR_03.steps, {
          'step-classify-inventory': allExcessive, // 20
          'step-configure-proportions': correctStep2, // 30
          'step-remediation-plan': correctStep3, // 30
        });
        const res = computeScore(responses, 0, challengeCC_PR_03.passThreshold);
        expect(res.earnedScore).toBe(80);
        expect(res.finalScore).toBe(80);
        expect(res.passed).toBe(true);
      });

      it('awards 70/100 and passes when ONE guided-form field in Step 2 is incorrect and Step 3 is correct (20 + 20 + 30 = 70)', () => {
        // Step 2 has 3 fields (10 pts each). 1 incorrect field leaves 2 correct fields = 20 pts.
        const oneWrongStep2 = {
          ...correctStep2,
          'cfg-access-telemetry':
            'Distribute advertising identifiers and location telemetry to commercial ad brokers for monetized analytics', // distractor
        };

        const responses = buildStepResponses(challengeCC_PR_03.steps, {
          'step-classify-inventory': allExcessive, // 20
          'step-configure-proportions': oneWrongStep2, // 20
          'step-remediation-plan': correctStep3, // 30
        });
        const res = computeScore(responses, 0, challengeCC_PR_03.passThreshold);
        expect(res.earnedScore).toBe(70);
        expect(res.finalScore).toBe(70);
        expect(res.passed).toBe(true);
      });

      it('awards 60/100 and fails when TWO guided-form fields in Step 2 are incorrect and Step 3 is correct (20 + 10 + 30 = 60)', () => {
        // Step 2 has 3 fields (10 pts each). 2 incorrect fields leave 1 correct field = 10 pts.
        const twoWrongStep2 = {
          'cfg-calendar-scope':
            'Full device calendar access granted across all personal, medical, and work accounts', // distractor
          'cfg-retention-schedule': correctStep2['cfg-retention-schedule'], // 10 pts correct
          'cfg-access-telemetry':
            'Expose all user study schedules through an unauthenticated public API for social networking', // distractor
        };

        const responses = buildStepResponses(challengeCC_PR_03.steps, {
          'step-classify-inventory': allExcessive, // 20
          'step-configure-proportions': twoWrongStep2, // 10
          'step-remediation-plan': correctStep3, // 30
        });
        const res = computeScore(responses, 0, challengeCC_PR_03.passThreshold);
        expect(res.earnedScore).toBe(60);
        expect(res.finalScore).toBe(60);
        expect(res.passed).toBe(false);
      });

      it('awards 50/100 and fails when Step 3 is incorrect despite perfect Step 2 (20 + 30 + 0 = 50)', () => {
        const responses = buildStepResponses(challengeCC_PR_03.steps, {
          'step-classify-inventory': allExcessive, // 20
          'step-configure-proportions': correctStep2, // 30
          'step-remediation-plan': 'plan-notice-only-keep-all', // 0
        });
        const res = computeScore(responses, 0, challengeCC_PR_03.passThreshold);
        expect(res.earnedScore).toBe(50);
        expect(res.finalScore).toBe(50);
        expect(res.passed).toBe(false);
      });
    });

    it('correctly deducts 10 points per hint used', () => {
      const responses = buildStepResponses(challengeCC_PR_03.steps, {
        'step-classify-inventory': correctStep1,
        'step-configure-proportions': correctStep2,
        'step-remediation-plan': correctStep3,
      });

      // 1 hint: 100 - 10 = 90
      const res1 = computeScore(responses, 1, challengeCC_PR_03.passThreshold);
      expect(res1.earnedScore).toBe(100);
      expect(res1.finalScore).toBe(90);
      expect(res1.passed).toBe(true);

      // 2 hints: 100 - 20 = 80
      const res2 = computeScore(responses, 2, challengeCC_PR_03.passThreshold);
      expect(res2.earnedScore).toBe(100);
      expect(res2.finalScore).toBe(80);
      expect(res2.passed).toBe(true);

      // 3 hints: 100 - 30 = 70 (still passes)
      const res3 = computeScore(responses, 3, challengeCC_PR_03.passThreshold);
      expect(res3.earnedScore).toBe(100);
      expect(res3.finalScore).toBe(70);
      expect(res3.passed).toBe(true);

      // Borderline 70 earned with 1 hint drops to 60 (fails)
      const borderResponses = buildStepResponses(challengeCC_PR_03.steps, {
        'step-classify-inventory': correctStep1, // 40
        'step-configure-proportions': correctStep2, // 30
        'step-remediation-plan': 'plan-disable-all-features', // 0
      });
      const resBorder = computeScore(borderResponses, 1, challengeCC_PR_03.passThreshold);
      expect(resBorder.earnedScore).toBe(70);
      expect(resBorder.finalScore).toBe(60);
      expect(resBorder.passed).toBe(false);
    });
  });

  // ── Display Formatting & Evaluator Helpers ──────────────────────────────────
  describe('Display Formatting', () => {
    it('returns formatted answer string for classification step', () => {
      const step1 = challengeCC_PR_03.steps[0];
      const display = getCorrectAnswerDisplay(step1);
      expect(display).toContain('Study Session Titles & Subject Topics → Necessary and appropriately scoped');
      expect(display).toContain('Selected External Calendar Read/Write Access → Optional with user control');
      expect(display).toContain('Full Address Book & Contacts Upload → Excessive or unjustified');
    });

    it('returns formatted answer string for guided-form step', () => {
      const step2 = challengeCC_PR_03.steps[1];
      const display = getCorrectAnswerDisplay(step2);
      expect(display).toContain('Calendar Integration Permission Scope: Granular user-selected calendar read/write access only');
      expect(display).toContain('Retention Lifecycle: Retain active sessions during account lifetime');
      expect(display).toContain('Telemetry: First-party strictly isolated access');
    });

    it('returns formatted answer string for single-choice step', () => {
      const step3 = challengeCC_PR_03.steps[2];
      const display = getCorrectAnswerDisplay(step3);
      expect(display).toContain('Remediate and Enforce Minimisation');
    });
  });

  // ── Campus Page Copy (Task 7C.1) ───────────────────────────────────────────
  describe('Campus Page Copy (Task 7C.1)', () => {
    it('renders the campus page header and navigation landmarks', () => {
      render(
        React.createElement(
          MemoryRouter,
          null,
          React.createElement(CampusPage, null)
        )
      );

      // The page always renders a "Campus Map" pill label
      expect(screen.getByText('Campus Map')).toBeDefined();
      // The heading "Choose a Room" is always present
      expect(screen.getByRole('heading', { name: /choose a room/i })).toBeDefined();
      // Old Phase-1 copy is gone
      expect(screen.queryByText(/2D Campus Map — Phase 1/i)).toBeNull();
      expect(screen.queryByText(/Explore Phishing Defense and Security Operations/i)).toBeNull();
    });
  });
});
