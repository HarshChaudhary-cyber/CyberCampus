import { describe, it, expect } from 'vitest';
import {
  ALL_CHALLENGES,
  CHALLENGE_MAP,
  LIVE_CHALLENGE_IDS,
  getChallenge,
} from '../challenges';
import {
  challengeCC_PR_02,
  type AuthTimelineContent,
  type PushSimulatorContent,
} from '../challenges/data/cc-pr-02';
import {
  evaluateStep,
  buildStepResponses,
  getCorrectAnswerDisplay,
} from '../challenges/evaluator';
import { computeScore } from '../store';

describe('Challenge cc-pr-02: "MFA Under Attack" (Privacy & Account Security - Intermediate)', () => {
  // ── Registration & Registry Integrity ───────────────────────────────────────
  describe('Registration & Registry Integrity', () => {
    it('is registered in CHALLENGE_MAP with id "cc-pr-02"', () => {
      const ch = getChallenge('cc-pr-02');
      expect(ch).toBeDefined();
      expect(CHALLENGE_MAP['cc-pr-02']).toBe(ch);
      expect(ch?.id).toBe('cc-pr-02');
      expect(ch?.title).toBe('MFA Under Attack');
      expect(ch?.difficulty).toBe('intermediate');
      expect(ch?.roomId).toBe('privacy');
    });

    it('is included in ALL_CHALLENGES and LIVE_CHALLENGE_IDS', () => {
      expect(ALL_CHALLENGES.some((c) => c.id === 'cc-pr-02')).toBe(true);
      expect(LIVE_CHALLENGE_IDS.has('cc-pr-02')).toBe(true);
    });

    it('verifies cc-pr-03 is registered and live', () => {
      expect(LIVE_CHALLENGE_IDS.has('cc-pr-03')).toBe(true);
      const ch03 = getChallenge('cc-pr-03');
      expect(ch03).toBeDefined();
      expect(ch03?.id).toBe('cc-pr-03');
    });

    it('preserves all live challenges across rooms for a total of 15', () => {
      expect(LIVE_CHALLENGE_IDS.size).toBe(15);
      const expectedLiveIds = [
        'cc-ph-01', 'cc-ph-02', 'cc-ph-03',
        'cc-so-01', 'cc-so-02', 'cc-so-03',
        'cc-nw-01', 'cc-nw-02', 'cc-nw-03',
        'cc-df-01', 'cc-df-02', 'cc-df-03',
        'cc-pr-01', 'cc-pr-02', 'cc-pr-03',
      ];
      for (const id of expectedLiveIds) {
        expect(LIVE_CHALLENGE_IDS.has(id)).toBe(true);
        const challenge = getChallenge(id);
        expect(challenge).toBeDefined();
      }
    });

    it('has standard challenge structure with 100 max points and 70 pass threshold', () => {
      const totalPoints = challengeCC_PR_02.steps.reduce((sum, s) => sum + s.pointValue, 0);
      expect(totalPoints).toBe(100);
      expect(challengeCC_PR_02.passThreshold).toBe(70);
      expect(challengeCC_PR_02.steps).toHaveLength(3);
      expect(challengeCC_PR_02.hints).toHaveLength(3);
    });
  });

  // ── Evidence Integrity ──────────────────────────────────────────────────────
  describe('Evidence Integrity', () => {
    it('contains three evidence items: auth timeline log, push simulator file, and SOP policy', () => {
      expect(challengeCC_PR_02.evidence).toHaveLength(3);
      const [authLog, pushSim, sop] = challengeCC_PR_02.evidence;

      expect(authLog.id).toBe('ev-auth-timeline');
      expect(authLog.type).toBe('log');

      expect(pushSim.id).toBe('ev-push-simulator');
      expect(pushSim.type).toBe('file');

      expect(sop.id).toBe('ev-mfa-sop');
      expect(sop.type).toBe('policy');
    });

    it('authenticates timeline structure, target user, and expected vs suspicious events', () => {
      const authEv = challengeCC_PR_02.evidence.find((e) => e.id === 'ev-auth-timeline');
      expect(authEv).toBeDefined();
      const content = authEv?.content as unknown as AuthTimelineContent;

      expect(content.isAuthTimeline).toBe(true);
      expect(content.targetUser.name).toBe('Elena Rostova');
      expect(content.targetUser.email).toBe('elena.rostova@corp.example');
      expect(content.targetUser.title).toContain('Senior Product Director');
      expect(content.auditDate).toBe('2026-10-18');
      expect(content.events).toHaveLength(12);

      // Verify legitimate business login event is present
      const legitLogin = content.events.find((ev) => ev.id === 'evt-01');
      expect(legitLogin).toBeDefined();
      expect(legitLogin?.eventType).toBe('legitimate_login');
      expect(legitLogin?.timestamp).toBe('2026-10-18 09:14:22 UTC');
      expect(legitLogin?.sourceIp).toBe('198.51.100.45');
      expect(legitLogin?.location).toContain('Seattle');
      expect(legitLogin?.device).toContain('WS-4412');
      expect(legitLogin?.isSuspicious).toBe(false);

      // Verify legitimate logout event
      const legitLogout = content.events.find((ev) => ev.id === 'evt-02');
      expect(legitLogout).toBeDefined();
      expect(legitLogout?.eventType).toBe('logout');
      expect(legitLogout?.isSuspicious).toBe(false);

      // Verify attacker push bombing barrage events from Bucharest
      const attackEvents = content.events.filter((ev) => ev.sourceIp === '203.0.113.88');
      expect(attackEvents).toHaveLength(8);
      for (const ev of attackEvents) {
        expect(ev.location).toContain('Bucharest, Romania');
        expect(ev.userAgent).toContain('Firefox');
        expect(ev.isSuspicious).toBe(true);
      }

      // Verify social engineering SMS event
      const smsEv = content.events.find((ev) => ev.eventType === 'sms_social_engineering');
      expect(smsEv).toBeDefined();
      expect(smsEv?.details).toContain('IT Support');

      // Verify automated security alert event
      const alertEv = content.events.find((ev) => ev.eventType === 'security_alert');
      expect(alertEv).toBeDefined();
      expect(alertEv?.details).toContain('8 push prompts requested');
      expect(alertEv?.details).toContain('anomalous IP range');
    });

    it('contains push simulator data reflecting Elena’s mobile authenticator state', () => {
      const simEv = challengeCC_PR_02.evidence.find((e) => e.id === 'ev-push-simulator');
      expect(simEv).toBeDefined();
      const content = simEv?.content as unknown as PushSimulatorContent;

      expect(content.isPushSimulator).toBe(true);
      expect(content.deviceModel).toContain('iPhone 15 Pro');
      expect(content.appName).toContain('Apex Authenticator');
      expect(content.unsolicitedCount).toBe(8);
      expect(content.activePrompt.location).toBe('Bucharest, Romania');
      expect(content.activePrompt.ipAddress).toBe('203.0.113.88');
      expect(content.activePrompt.service).toBe('Apex Cloud Management Console');

      // Verify spoofed helpdesk SMS
      expect(content.recentSms.sender).toContain('Apex IT Support');
      expect(content.recentSms.messageText).toContain('Please click Approve on the pending Authenticator prompt');
    });

    it('contains SOP SEC-304 with clear response procedures and MFA classification', () => {
      const sopEv = challengeCC_PR_02.evidence.find((e) => e.id === 'ev-mfa-sop');
      expect(sopEv).toBeDefined();
      const raw = sopEv?.content as { title: string; rules: string[] };

      expect(raw.title).toContain('SOP SEC-304');
      const allRulesText = raw.rules.join('\n');
      expect(allRulesText).toContain('Rule 1');
      expect(allRulesText).toContain('Rule 2');
      expect(allRulesText).toContain('Rule 3');
      expect(allRulesText).toContain('Rule 4');
      expect(allRulesText).toContain('Rule 5');

      // Rule 5 must emphasize phishing-resistant FIDO2 vs non-phishing-resistant push/SMS/TOTP
      expect(allRulesText).toContain('FIDO2 / WebAuthn');
      expect(allRulesText).toContain('phishing-resistant');
      expect(allRulesText).toContain('TOTP');
    });
  });

  // ── Step Evaluation & Scoring ───────────────────────────────────────────────
  describe('Step Evaluation & Scoring', () => {
    it('allocates 30 points to Step 1, 35 points to Step 2, and 35 points to Step 3', () => {
      const [s1, s2, s3] = challengeCC_PR_02.steps;
      expect(s1.pointValue).toBe(30);
      expect(s2.pointValue).toBe(35);
      expect(s3.pointValue).toBe(35);
      expect(s1.pointValue + s2.pointValue + s3.pointValue).toBe(100);
    });

    it('evaluates Step 1: correctly identifies MFA prompt bombing and password compromise', () => {
      const step1 = challengeCC_PR_02.steps[0];
      const correctOpt = 'att-mfa-fatigue-password-compromised';
      expect(evaluateStep(step1, correctOpt)).toBe(30);

      // Verify distractors earn 0 points
      const distractors = ['att-network-dos-ddos', 'att-authenticator-glitch', 'att-brute-force-no-password'];
      for (const d of distractors) {
        expect(evaluateStep(step1, d)).toBe(0);
      }
    });

    it('evaluates Step 2: requires denying prompt, reporting out-of-band, revoking sessions, and resetting password', () => {
      const step2 = challengeCC_PR_02.steps[1];
      const correctOpt = 'resp-deny-report-revoke';
      expect(evaluateStep(step2, correctOpt)).toBe(35);

      const distractors = ['resp-approve-to-silence', 'resp-call-caller-back', 'resp-uninstall-app'];
      for (const d of distractors) {
        expect(evaluateStep(step2, d)).toBe(0);
      }
    });

    it('evaluates Step 3: mandates FIDO2 WebAuthn keys and strictly avoids calling TOTP phishing-resistant', () => {
      const step3 = challengeCC_PR_02.steps[2];
      const correctOpt = 'def-fido2-phishing-resistant';
      expect(evaluateStep(step3, correctOpt)).toBe(35);

      const correctItem = step3.items.find((i) => i.id === correctOpt);
      expect(correctItem?.label).toContain('FIDO2/WebAuthn');

      // Distractors must earn 0 points
      const distractors = ['def-switch-to-sms', 'def-app-totp-phishing-resistant', 'def-hide-push-buttons'];
      for (const d of distractors) {
        expect(evaluateStep(step3, d)).toBe(0);
      }

      // Check that distractor attempting to label TOTP as phishing-resistant earns 0 points
      const totpDistractor = step3.items.find((i) => i.id === 'def-app-totp-phishing-resistant');
      expect(totpDistractor).toBeDefined();
      expect(evaluateStep(step3, 'def-app-totp-phishing-resistant')).toBe(0);
    });

    it('passes with 100 points on a full correct submission', () => {
      const responses = buildStepResponses(challengeCC_PR_02.steps, {
        'step-attack-pattern': 'att-mfa-fatigue-password-compromised',
        'step-immediate-containment': 'resp-deny-report-revoke',
        'step-longterm-defense': 'def-fido2-phishing-resistant',
      });

      const scoreResult = computeScore(responses, 0, challengeCC_PR_02.passThreshold);
      expect(scoreResult.earnedScore).toBe(100);
      expect(scoreResult.finalScore).toBe(100);
      expect(scoreResult.passed).toBe(true);
    });

    it('meets 70 pass threshold when Step 2 and Step 3 are correct (35 + 35 = 70)', () => {
      const responses = buildStepResponses(challengeCC_PR_02.steps, {
        'step-attack-pattern': 'att-authenticator-glitch', // wrong, 0 pts
        'step-immediate-containment': 'resp-deny-report-revoke', // 35 pts
        'step-longterm-defense': 'def-fido2-phishing-resistant', // 35 pts
      });

      const scoreResult = computeScore(responses, 0, challengeCC_PR_02.passThreshold);
      expect(scoreResult.earnedScore).toBe(70);
      expect(scoreResult.finalScore).toBe(70);
      expect(scoreResult.passed).toBe(true);
    });

    it('fails when learner only answers Step 1 and Step 2 correctly (30 + 35 = 65 < 70)', () => {
      const responses = buildStepResponses(challengeCC_PR_02.steps, {
        'step-attack-pattern': 'att-mfa-fatigue-password-compromised', // 30 pts
        'step-immediate-containment': 'resp-deny-report-revoke', // 35 pts
        'step-longterm-defense': 'def-app-totp-phishing-resistant', // wrong, 0 pts
      });

      const scoreResult = computeScore(responses, 0, challengeCC_PR_02.passThreshold);
      expect(scoreResult.earnedScore).toBe(65);
      expect(scoreResult.finalScore).toBe(65);
      expect(scoreResult.passed).toBe(false);
    });

    it('fails when learner chooses incorrect immediate containment', () => {
      const responses = buildStepResponses(challengeCC_PR_02.steps, {
        'step-attack-pattern': 'att-mfa-fatigue-password-compromised', // 30 pts
        'step-immediate-containment': 'resp-approve-to-silence', // wrong, 0 pts
        'step-longterm-defense': 'def-fido2-phishing-resistant', // 35 pts
      });

      const scoreResult = computeScore(responses, 0, challengeCC_PR_02.passThreshold);
      expect(scoreResult.earnedScore).toBe(65);
      expect(scoreResult.finalScore).toBe(65);
      expect(scoreResult.passed).toBe(false);
    });

    it('fails on all wrong answers with 0 points', () => {
      const responses = buildStepResponses(challengeCC_PR_02.steps, {
        'step-attack-pattern': 'att-network-dos-ddos',
        'step-immediate-containment': 'resp-call-caller-back',
        'step-longterm-defense': 'def-switch-to-sms',
      });

      const scoreResult = computeScore(responses, 0, challengeCC_PR_02.passThreshold);
      expect(scoreResult.earnedScore).toBe(0);
      expect(scoreResult.finalScore).toBe(0);
      expect(scoreResult.passed).toBe(false);
    });

    it('correctly applies hint penalties (-10 points per hint used)', () => {
      const responses = buildStepResponses(challengeCC_PR_02.steps, {
        'step-attack-pattern': 'att-mfa-fatigue-password-compromised',
        'step-immediate-containment': 'resp-deny-report-revoke',
        'step-longterm-defense': 'def-fido2-phishing-resistant',
      });

      // 1 hint used: 100 - 10 = 90
      const res1 = computeScore(responses, 1, challengeCC_PR_02.passThreshold);
      expect(res1.earnedScore).toBe(100);
      expect(res1.finalScore).toBe(90);
      expect(res1.passed).toBe(true);

      // 2 hints used: 100 - 20 = 80
      const res2 = computeScore(responses, 2, challengeCC_PR_02.passThreshold);
      expect(res2.earnedScore).toBe(100);
      expect(res2.finalScore).toBe(80);
      expect(res2.passed).toBe(true);
    });
  });

  // ── Display Formatting & Evaluator Helpers ──────────────────────────────────
  describe('Display Formatting', () => {
    it('returns readable correct answer text for each step via getCorrectAnswerDisplay', () => {
      const [s1, s2, s3] = challengeCC_PR_02.steps;

      const disp1 = getCorrectAnswerDisplay(s1);
      expect(disp1).toContain('MFA Fatigue / Push Notification Bombing');

      const disp2 = getCorrectAnswerDisplay(s2);
      expect(disp2).toContain('Deny all pending push prompts');
      expect(disp2).toContain('revoke all active user sessions');

      const disp3 = getCorrectAnswerDisplay(s3);
      expect(disp3).toContain('FIDO2/WebAuthn');
    });
  });

  // ── Challenge cc-pr-01 Correction Regression Verification ───────────────────
  describe('Challenge cc-pr-01 Corrections Regression', () => {
    it('confirms cc-pr-01 does not contain correct-horse-battery-staple', () => {
      const pr01 = getChallenge('cc-pr-01');
      expect(pr01).toBeDefined();
      const stringified = JSON.stringify(pr01);
      expect(stringified).not.toContain('correct-horse-battery-staple');
      expect(stringified).toContain('crimson-lantern-cobalt-feather-77');
    });

    it('confirms cc-pr-01 blanket selection yields 85 points and functions as a penalty deduction', () => {
      const pr01 = getChallenge('cc-pr-01');
      if (!pr01) throw new Error('cc-pr-01 not found');

      // Blanket selection in Step 1 (all 8 accounts checked)
      const allSelected: Record<string, boolean> = {
        'acc-1': true,
        'acc-2': true,
        'acc-3': true,
        'acc-4': true,
        'acc-5': true,
        'acc-6': true,
        'acc-7': true,
        'acc-8': true,
      };

      const responses = buildStepResponses(pr01.steps, {
        'step-identify-accounts': allSelected,
        'step-prioritize-urgency': 'prio-acc1',
        'step-hygiene-plan': 'plan-password-manager-mfa',
      });

      const scoreResult = computeScore(responses, 0, pr01.passThreshold);
      // Step 1: 25/40 (deduction for 3 false alarms), Step 2: 30/30, Step 3: 30/30 -> 85 points total
      expect(scoreResult.earnedScore).toBe(85);
      expect(scoreResult.finalScore).toBe(85);
      expect(scoreResult.passed).toBe(true);
    });
  });

  // ── Challenge cc-pr-02 Educational Wording Regression (Task 7C) ─────────────
  describe('Challenge cc-pr-02 Educational Wording Nuance (Task 7C)', () => {
    it('grounds password compromise conclusion on explicit authentication log telemetry', () => {
      const step1 = challengeCC_PR_02.steps[0];
      const opt = step1.items.find((i) => i.id === 'att-mfa-fatigue-password-compromised');
      expect(opt?.label).toContain('scenario authentication logs explicitly record successful primary password entry');
      expect(challengeCC_PR_02.successExplanation).toContain('authentication log in this scenario explicitly records successful primary-password verification');
      expect(challengeCC_PR_02.failureExplanation).toContain('password-first flow, the IdP log explicitly shows successful primary password verification');
    });

    it('clarifies that authentication flows differ, including passwordless push architectures', () => {
      const sopEv = challengeCC_PR_02.evidence.find((e) => e.id === 'ev-mfa-sop');
      const raw = sopEv?.content as { rules: string[] };
      const rule1 = raw.rules.find((r) => r.startsWith('Rule 1'));
      expect(rule1).toContain('password-first authentication architectures');
      expect(rule1).toContain('passwordless or username-initiated push flows');

      expect(challengeCC_PR_02.hints[1]).toContain('passwordless push');
      expect(challengeCC_PR_02.failureExplanation).toContain('passwordless flows do not use passwords');
    });

    it('avoids absolute claims that FIDO2 permanently eliminates all account attacks', () => {
      const sopEv = challengeCC_PR_02.evidence.find((e) => e.id === 'ev-mfa-sop');
      const raw = sopEv?.content as { rules: string[] };
      const allRulesText = raw.rules.join('\n');
      expect(allRulesText).toContain('Among the available options');
      expect(allRulesText).toContain('no single mechanism eliminates all possible endpoint malware or physical attacks');

      const step3 = challengeCC_PR_02.steps[2];
      expect(step3.prompt).not.toContain('definitively eliminate');
      expect(step3.prompt).toContain('among the available options');
    });
  });
});
