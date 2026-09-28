// ============================================================
// Challenge: cc-ph-01 — The Suspicious Invoice
// Room: Phishing Defense | Difficulty: Beginner
//
// Scenario:
//   The user plays the role of an accounts-payable employee at
//   Veridian Logistics (fictional company). They receive an
//   invoice email from an unfamiliar supplier and must identify
//   three planted warning signs before deciding to pay or flag.
//
// All domains, IPs, names, and amounts are entirely fictional.
// Domains use RFC 2606 .example TLD.
// ============================================================

import type { Challenge } from '../../types';

export const challengeCC_PH_01: Challenge = {
  id: 'cc-ph-01',
  roomId: 'phishing',
  difficulty: 'beginner',
  title: 'The Suspicious Invoice',
  briefing:
    'You work in accounts payable at Veridian Logistics. An invoice email just arrived for $8,400 from "Apex Stationery Ltd." — a vendor you don\'t recognise. Your manager is travelling and cannot be reached. Examine the email carefully before deciding what to do.',

  // ── Evidence ──────────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-email',
      type: 'email',
      label: 'Invoice Email',
      content: {
        from_display: 'Apex Stationery Ltd — Accounts',
        from_address: 'accounts@apex-stationery-ltd.example.com',
        reply_to: 'payments@apexstat1onery.example.net',     // ← RED FLAG 1: reply-to on different domain with "1" replacing "i"
        to: 'ap-team@veridian-logistics.example',
        subject: 'INVOICE #INV-20481 — Payment Due 30 Sep 2026',
        date: 'Mon, 28 Sep 2026 07:14:02 +0000',
        body: [
          'Dear Accounts Payable Team,',
          '',
          'Please find attached our invoice #INV-20481 for stationery supplies',
          'delivered to your Northgate warehouse on 15 Sep 2026.',
          '',
          'Amount due: £8,400.00',
          'Payment terms: Net 7 days',
          '',
          'To review your account or pay online, please click the link below:',
          '',
          '  Pay Invoice Now → https://veridian-logistics-portal.example',  // ← display text looks internal
          '',
          'Note: To avoid a late-payment fee, please ensure payment is made by',
          '30 September 2026.',
          '',
          'Many thanks,',
          'Sarah Jennings',
          'Accounts Receivable | Apex Stationery Ltd',
          'T: +44 20 7946 0132',
        ].join('\n'),
        // The actual href behind the link is different from display text
        link_display: 'https://veridian-logistics-portal.example',
        link_actual: 'http://apexstat-pay.example.xyz/inv/20481', // ← RED FLAG 2: link goes to different domain
        attachment: 'INV-20481_Apex-Stat10nery.pdf',              // ← RED FLAG 3: "10" in filename (typosquat)
      },
    },
    {
      id: 'ev-header',
      type: 'log',
      label: 'Email Header Analysis',
      content: {
        rows: [
          { field: 'Return-Path',       value: '<bounce@apexstat1onery.example.net>' },
          { field: 'Received: from',    value: 'mail.apexstat1onery.example.net (185.220.101.42)' },
          { field: 'Message-ID',        value: '<20260928071402.A3F2@apexstat1onery.example.net>' },
          { field: 'From',              value: '"Apex Stationery Ltd — Accounts" <accounts@apex-stationery-ltd.example.com>' },
          { field: 'Reply-To',          value: '<payments@apexstat1onery.example.net>' },
          { field: 'DKIM-Signature',    value: 'FAIL — signature does not match sending domain' },
          { field: 'SPF',               value: 'SOFTFAIL — domain apex-stationery-ltd.example.com' },
          { field: 'DMARC',             value: 'FAIL' },
        ],
      },
    },
  ],

  // ── Steps ─────────────────────────────────────────────────────────────────
  //
  // Step 1 (40 pts): Flag the three planted red flags in the email
  // Step 2 (40 pts): Single-choice — what action should you take?
  // Step 3 (20 pts): Classification — is each authentication result a
  //                  concern or expected?
  //
  // Total: 100 pts. Pass threshold: 70.
  steps: [
    {
      id: 'step-flags',
      prompt:
        'Inspect the email. Select every item below that is a warning sign of a phishing attempt. You may select as many as apply.',
      interaction: 'flag-selection',
      partialCreditAllowed: true,
      pointValue: 40,
      items: [
        { id: 'flag-reply-to',    label: 'Reply-To address is on a different domain (apexstat1onery.example.net) from the From address' },
        { id: 'flag-link-dest',   label: 'The "Pay Invoice Now" link actually goes to a different domain than displayed' },
        { id: 'flag-attachment',  label: 'The attachment filename contains a number substituting a letter (Stat10nery)' },
        { id: 'flag-urgency',     label: 'The email creates urgency with a 7-day deadline' },    // ← plausible distractor; partial credit
        { id: 'flag-vendor',      label: 'The vendor "Apex Stationery Ltd" is unfamiliar' },     // ← plausible distractor
      ],
      answerKey: {
        // The three definitive red flags
        'flag-reply-to':   true,
        'flag-link-dest':  true,
        'flag-attachment': true,
        // Urgency and unfamiliarity are common but NOT definitive technical red flags
        'flag-urgency':    false,
        'flag-vendor':     false,
      },
    },
    {
      id: 'step-action',
      prompt:
        'Based on your investigation, what is the correct action to take right now?',
      interaction: 'single-choice',
      partialCreditAllowed: false,
      pointValue: 40,
      items: [
        { id: 'action-pay',        label: 'Process the payment — the deadline is urgent and the invoice looks professional' },
        { id: 'action-flag',       label: 'Do NOT pay. Mark the email as suspicious and report it to your security team' },
        { id: 'action-reply',      label: 'Reply to the email asking for more details before paying' },
        { id: 'action-call-num',   label: 'Call the phone number in the email to verify the invoice' },
      ],
      answerKey: { chosen: 'action-flag' },
    },
    {
      id: 'step-auth',
      prompt:
        'The header analysis shows three email authentication results. Classify each one.',
      interaction: 'classification',
      partialCreditAllowed: true,
      pointValue: 20,
      items: [
        { id: 'auth-dkim', label: 'DKIM: FAIL — signature does not match sending domain', options: ['Concern', 'Expected / Normal'] },
        { id: 'auth-spf',  label: 'SPF: SOFTFAIL — domain apex-stationery-ltd.example.com',  options: ['Concern', 'Expected / Normal'] },
        { id: 'auth-dmarc',label: 'DMARC: FAIL',                                             options: ['Concern', 'Expected / Normal'] },
      ],
      answerKey: {
        'auth-dkim':  'Concern',
        'auth-spf':   'Concern',
        'auth-dmarc': 'Concern',
      },
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Carefully compare the "From" address with the "Reply-To" address. They should match for a legitimate email.',
    'Hover over (or read carefully) the actual destination of the "Pay Invoice Now" link — does it match the display text?',
    'Read every word in the attachment filename letter by letter. Do any digits substitute letters?',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: ['email-header-analysis', 'phishing-detection', 'link-inspection'],

  // ── Scoring ───────────────────────────────────────────────────────────────
  passThreshold: 70,

  // ── Explanations ─────────────────────────────────────────────────────────
  successExplanation:
    'Well done! You identified the key red flags: a mismatched Reply-To domain (apexstat1onery.example.net uses a "1" in place of the letter "i"), a "Pay Invoice Now" link pointing to a completely different domain (apexstat-pay.example.xyz), and a typosquat in the attachment filename (Stat10nery). The correct action is to flag and report — never pay an unverified invoice, and never call the number provided in the suspicious email itself.',

  failureExplanation:
    'This email contained three technical red flags: (1) The Reply-To address was on a different, visually similar domain — apexstat1onery.example.net — with "1" replacing "i". (2) The "Pay Invoice Now" link led to apexstat-pay.example.xyz, not the displayed URL. (3) The PDF filename included "Stat10nery" — "10" replacing "io". All three authentication checks (DKIM, SPF, DMARC) also failed. The right response is always to flag the email and report it, not to pay or reply.',

  shuffleItems: false,
};
