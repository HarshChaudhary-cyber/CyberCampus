// ============================================================
// Challenge: cc-ph-02 — CEO Fraud
// Room: Phishing Defense | Difficulty: Intermediate
//
// Scenario:
//   The user plays the role of a senior finance associate at
//   Veridian Logistics (fictional company). They receive an urgent
//   email thread appearing to be from CEO Victoria Sterling requesting
//   an immediate $42,500 wire transfer for a confidential acquisition,
//   demanding an exception to standard payment authorization policy.
//
// All domains, IPs, names, and amounts are entirely fictional.
// Domains use RFC 2606 .example TLD.
// IPs use RFC 5737 documentation addresses.
// ============================================================

import type { Challenge } from '../../types';

export const challengeCC_PH_02: Challenge = {
  id: 'cc-ph-02',
  roomId: 'phishing',
  difficulty: 'intermediate',
  title: 'CEO Fraud',
  briefing:
    'You are a senior finance associate at Veridian Logistics. An urgent email thread arrives from someone identifying as CEO Victoria Sterling, who is travelling in Tokyo. She requests an immediate $42,500 wire transfer for a confidential acquisition and insists on bypassing standard verification. Investigate the email conversation, directory records, and headers before deciding how to respond.',

  // ── Evidence ──────────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-thread',
      type: 'email',
      label: 'Email Conversation',
      content: {
        isThread: true,
        subject: 'URGENT: Confidential Acquisition Consulting Retainer',
        messages: [
          {
            id: 'msg-1',
            from_display: 'Marcus Vance — Executive Assistant',
            from_address: 'm.vance@veridian-logistics.example',
            to: 'all-staff@veridian-logistics.example',
            date: 'Mon, 28 Sep 2026 06:00:00 +0000',
            subject: 'CEO Travel Notice: Tokyo Logistics Summit',
            body:
              'Team,\n\nPlease note that CEO Victoria Sterling is travelling in Tokyo this week for the International Logistics Summit (Sep 28 – Oct 02). During her travel, please coordinate urgent executive calendar inquiries through my desk.\n\nBest regards,\nMarcus Vance\nExecutive Assistant to Victoria Sterling\nVeridian Logistics | Ext. 405',
          },
          {
            id: 'msg-2',
            from_display: 'Victoria Sterling',
            from_address: 'victoria.sterling-ceo@mail-executive.example',
            reply_to: 'exec-transfers@wire-portal-routing.example',
            to: 'a.morgan@veridian-logistics.example',
            date: 'Mon, 28 Sep 2026 08:35:14 +0000',
            subject: 'URGENT: Confidential Acquisition Consulting Retainer',
            body:
              'Alex,\n\nI need you to handle an urgent wire transfer for $42,500 to Nexus Advisory Group before 11:00 AM today. This is an initial retainer for confidential M&A due diligence on a regional competitor.\n\nBecause of strict non-disclosure terms, do not discuss this transfer with anyone on the finance floor, and do not call my mobile—I am in closed sessions all day with our legal team in Tokyo.\n\nPlease update their wire routing details in our system to the following account immediately:\n\n  Beneficiary: Nexus Advisory International\n  Bank: Sovereign Global Trust\n  Account: EX89-0192-8841-9920\n  Amount: $42,500.00 USD\n\nConfirm once the transfer is queued.\n\nVictoria Sterling\nChief Executive Officer | Veridian Logistics',
          },
          {
            id: 'msg-3',
            from_display: 'Alex Morgan — Senior Finance Associate',
            from_address: 'a.morgan@veridian-logistics.example',
            to: 'victoria.sterling-ceo@mail-executive.example',
            date: 'Mon, 28 Sep 2026 08:42:01 +0000',
            subject: 'Re: URGENT: Confidential Acquisition Consulting Retainer',
            body:
              'Good morning Victoria,\n\nUnderstood on the confidentiality. Under our finance policy (FIN-402), all wire transfers and new vendor banking details require verbal secondary approval. Should I confirm with Marcus Vance on your desk, or can we schedule a quick 2-minute call when you have a break between sessions?\n\nRegards,\nAlex Morgan',
          },
          {
            id: 'msg-4',
            from_display: 'Victoria Sterling',
            from_address: 'victoria.sterling-ceo@mail-executive.example',
            reply_to: 'exec-transfers@wire-portal-routing.example',
            to: 'a.morgan@veridian-logistics.example',
            date: 'Mon, 28 Sep 2026 08:47:33 +0000',
            subject: 'Re: URGENT: Confidential Acquisition Consulting Retainer',
            body:
              'Alex,\n\nMarcus is not cleared for this transaction. Every hour we delay risks falling out of exclusivity on this acquisition. I am authorizing an immediate executive policy exception.\n\nDo not involve Marcus. Queue the $42,500 wire now and send me the confirmation receipt immediately.\n\nVictoria Sterling\nChief Executive Officer | Veridian Logistics',
          },
        ],
      },
    },
    {
      id: 'ev-directory',
      type: 'policy',
      label: 'Company Directory & Policy',
      content: {
        type: 'directory',
        company: 'Veridian Logistics Internal Directory',
        employee: {
          name: 'Victoria Sterling',
          title: 'Chief Executive Officer (CEO)',
          department: 'Executive Leadership',
          officialEmail: 'v.sterling@veridian-logistics.example',
          internalPhone: '+1 (555) 0192, Ext. 401',
          officeLocation: 'HQ Building A, Suite 500',
          assistant: 'Marcus Vance (Ext. 405, m.vance@veridian-logistics.example)',
          currentStatus: 'On Travel — Tokyo Logistics Summit (Sep 28 – Oct 02)',
        },
        policy: {
          code: 'FIN-402',
          title: 'Wire Transfer & Account Modification Policy',
          rules: [
            'All wire transfers and banking detail changes require independent out-of-band verbal verification.',
            'Verifications must use pre-established internal telephone extensions from this directory or in-person confirmation with the authorized executive or their designated assistant. Never accept contact info inside incoming requests.',
            'No individual executive has unilateral authority to grant email-only policy exceptions bypassing verbal verification.',
          ],
        },
      },
    },
    {
      id: 'ev-header',
      type: 'log',
      label: 'Email Header Analysis',
      content: {
        rows: [
          { field: 'Return-Path',        value: '<bounce@mail-executive.example>' },
          { field: 'Received: from',     value: 'relay01.mail-executive.example (198.51.100.88)' },
          { field: 'From',               value: '"Victoria Sterling" <victoria.sterling-ceo@mail-executive.example>' },
          { field: 'Reply-To',           value: '<exec-transfers@wire-portal-routing.example>' },
          { field: 'To',                 value: '<a.morgan@veridian-logistics.example>' },
          { field: 'Subject',            value: 'Re: URGENT: Confidential Acquisition Consulting Retainer' },
          { field: 'SPF',                value: 'PASS (sender IP 198.51.100.88 is authorized by mail-executive.example)' },
          { field: 'DKIM',               value: 'PASS (valid signature from domain mail-executive.example)' },
          { field: 'DMARC',              value: 'PASS for domain mail-executive.example (SPF and DKIM aligned)' },
          { field: 'X-External-Sender',  value: 'TRUE — message originated outside Veridian internal mail systems' },
        ],
      },
    },
  ],

  // ── Steps ─────────────────────────────────────────────────────────────────
  //
  // Step 1 (35 pts): Identify supporting warning signs (flag-selection, partial credit: 7 items = 5 pts each)
  // Step 2 (35 pts): Choose safe verification method (single-choice, no partial)
  // Step 3 (30 pts): Decide how to handle the request (single-choice, no partial)
  //
  // Total: 100 pts. Pass threshold: 70.
  steps: [
    {
      id: 'step-flags',
      prompt:
        'Inspect the email thread, company directory, and headers. Select every warning sign indicating this request is fraudulent or requires independent verification.',
      interaction: 'flag-selection',
      partialCreditAllowed: true,
      pointValue: 35,
      items: [
        {
          id: 'flag-domain',
          label:
            'The sender address (victoria.sterling-ceo@mail-executive.example) does not match the CEO\'s official email in the directory (v.sterling@veridian-logistics.example)',
        },
        {
          id: 'flag-bypass',
          label:
            'The sender demands an immediate exception to bypass standard dual-control verification policy (FIN-402)',
        },
        {
          id: 'flag-isolation',
          label:
            'The sender insists on secrecy and explicitly forbids contacting the executive assistant (Marcus Vance)',
        },
        {
          id: 'flag-pressure',
          label:
            'The email uses artificial urgency ("every hour we delay risks falling out of exclusivity") to rush an unverified wire transfer',
        },
        {
          id: 'flag-reply-to',
          label:
            'The Reply-To header directs responses to a different external domain (wire-portal-routing.example) than the sender domain (mail-executive.example)',
        },
        {
          id: 'flag-auth-pass',
          label:
            'The email headers confirm SPF, DKIM, and DMARC authentication checks all passed for the sender domain (mail-executive.example)',
        },
        {
          id: 'flag-travel',
          label:
            'CEO Victoria Sterling is currently on business travel in Tokyo attending the International Logistics Summit',
        },
      ],
      answerKey: {
        'flag-domain':    true,
        'flag-bypass':    true,
        'flag-isolation': true,
        'flag-pressure':  true,
        'flag-reply-to':  true,
        'flag-auth-pass': false,
        'flag-travel':    false,
      },
    },
    {
      id: 'step-verify',
      prompt:
        'Before taking any action with corporate funds, what is the safest and only authorized way to verify this request?',
      interaction: 'single-choice',
      partialCreditAllowed: false,
      pointValue: 35,
      items: [
        {
          id: 'verify-directory',
          label:
            'Use the pre-established internal telephone extension from the trusted directory to call the CEO (Ext. 401) or speak directly to her assistant Marcus Vance (Ext. 405)',
        },
        {
          id: 'verify-reply',
          label:
            'Reply directly to the email thread asking the CEO to provide a scanned copy of her passport or badge before transferring',
        },
        {
          id: 'verify-vendor-email',
          label:
            'Email Nexus Advisory Group using the details in the email body to ask if they are expecting the $42,500 wire',
        },
        {
          id: 'verify-mobile-sms',
          label:
            'Send an SMS to the mobile number mentioned in the email footer asking for a voice note confirmation',
        },
      ],
      answerKey: { chosen: 'verify-directory' },
    },
    {
      id: 'step-action',
      prompt:
        'Given the evidence and company policy FIN-402, what is the correct operational decision?',
      interaction: 'single-choice',
      partialCreditAllowed: false,
      pointValue: 30,
      items: [
        {
          id: 'action-refuse-report',
          label:
            'Refuse the transfer, freeze the pending transaction, and immediately report the BEC incident to Security Operations and Finance Leadership',
        },
        {
          id: 'action-pay-now',
          label:
            'Process the $42,500 wire immediately to preserve deal exclusivity, and verify the authorization after the CEO returns from Tokyo',
        },
        {
          id: 'action-partial-wire',
          label:
            'Wire a small deposit of $5,000 to keep the advisors engaged while waiting for verbal confirmation',
        },
        {
          id: 'action-forward-all',
          label:
            'Forward the email thread to the company-wide staff mailing list asking if other departments have seen similar requests',
        },
      ],
      answerKey: { chosen: 'action-refuse-report' },
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Compare the sender\'s email address in the thread against CEO Victoria Sterling\'s official address in the trusted company directory.',
    'Notice how the sender reacts when the finance associate brings up verification policy FIN-402. Why would a real CEO forbid speaking to her own assistant?',
    'Never verify an urgent financial instruction using contact info provided inside the suspicious email itself. Always rely on independent out-of-band channels.',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'business-email-compromise',
    'social-engineering-defense',
    'out-of-band-verification',
    'email-header-analysis',
  ],

  // ── Scoring ───────────────────────────────────────────────────────────────
  passThreshold: 70,

  // ── Explanations ─────────────────────────────────────────────────────────
  successExplanation:
    'Outstanding investigation! You successfully intercepted a classic Business Email Compromise (BEC) / CEO Fraud attack. The adversary spoofed CEO Victoria Sterling\'s display name using an external lookalike domain (mail-executive.example) with a mismatched Reply-To routing address (wire-portal-routing.example), and manufactured extreme urgency to intimidate finance staff into bypassing dual-control policy FIN-402. Crucially, while SPF, DKIM, and DMARC passed for the external domain mail-executive.example, authenticating an external sender domain does NOT establish that the sender is the CEO—attackers configure valid authentication on domains they control so emails pass spam filters. The trusted company directory and wire authorization policy are the decisive checks. Similarly, the CEO\'s Tokyo travel was a real event the attacker exploited as a pretext, not evidence of fraud. Relying on out-of-band directory verification protected Veridian Logistics from an irreversible $42,500 loss.',

  failureExplanation:
    'This was a Business Email Compromise (BEC) attack, also known as CEO Fraud. Attackers rely on authority, confidentiality, and urgency to coerce staff into bypassing financial safeguards. Decisive clues indicating fraud included: (1) sender address victoria.sterling-ceo@mail-executive.example did not match official directory email v.sterling@veridian-logistics.example; (2) Reply-To routed replies to a different external domain (wire-portal-routing.example); (3) demand for an unauthorized policy exception bypassing FIN-402; and (4) manufactured urgency and enforced secrecy (forbidding contact with executive assistant Marcus Vance). Crucially, authentication of an external sender domain does not establish that the sender is the CEO—SPF, DKIM, and DMARC passing only proves that mail-executive.example authorized the message. The trusted company directory and payment policy are the decisive checks. Furthermore, the CEO\'s legitimate Tokyo travel schedule was a known business fact exploited as a social-engineering pretext, not evidence of fraud. Always verify through the trusted directory and report suspected BEC attempts immediately.',

  shuffleItems: false,
};
