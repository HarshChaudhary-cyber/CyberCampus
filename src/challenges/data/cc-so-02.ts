// ============================================================
// Challenge: cc-so-02 — The 3am Login
// Room: Security Operations | Difficulty: Intermediate
//
// Scenario:
//   At 03:15 UTC, the SOC SIEM alerted on an off-hours administrative
//   sign-in and IAM key creation attributed to Senior DBA Marcus Vance.
//   Marcus is on the scheduled secondary on-call rotation for an active
//   database migration project, meaning off-hours activity alone does
//   NOT prove an attack. However, detailed log telemetry reveals critical
//   anomalies: an unmanaged Windows endpoint, commercial hosting exit node,
//   MFA push notification fatigue pattern, and persistent API key creation.
//
//   The analyst must:
//   1. Identify genuine anomalous indicators vs benign operational details.
//   2. Distinguish confirmed facts from plausible unproven hypotheses.
//   3. Select a proportionate incident response following SOP SEC-204.
//
// All domains use RFC 2606 .example TLDs.
// All IPs use RFC 5737 documentation addresses.
// All personas and organizations are entirely fictional.
// ============================================================

import type { Challenge } from '../../types';

export const challengeCC_SO_02: Challenge = {
  id: 'cc-so-02',
  roomId: 'secops',
  difficulty: 'intermediate',
  title: 'The 3am Login',
  briefing:
    'At 03:15 UTC, the SOC SIEM flagged an off-hours sign-in and IAM key creation on the account of Senior DBA Marcus Vance (m.vance@veridian-logistics.example). Marcus is currently on the scheduled secondary on-call rotation for an ongoing database cluster migration. Review the multi-system authentication timeline and user baseline profile. Identify the genuine technical anomalies, distinguish verified facts from unproven hypotheses, and determine the safest, most proportionate containment response.',

  // ── Evidence ──────────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-timeline',
      type: 'log',
      label: 'Authentication & CloudTrail Timeline (8 Events)',
      content: {
        isTimeline: true,
        timelineTitle: 'Identity Provider & CloudTrail Audit Timeline',
        timelineSubtitle: 'Correlation Scope: m.vance@veridian-logistics.example (02:45 – 03:25 UTC)',
        subjectAccount: 'm.vance@veridian-logistics.example',
        timeRange: '29 Sep 2026, 02:45 – 03:25 UTC',
        events: [
          {
            id: 'evt-01',
            timestamp: '02:48:10 UTC',
            system: 'Okta Cloud IdP',
            eventType: 'user.authentication.auth_via_mfa.failure',
            status: 'failure',
            title: 'Primary Authentication Failed (Password Incorrect)',
            description:
              'Failed password authentication attempt for user m.vance@veridian-logistics.example.',
            sourceIp: '203.0.113.180',
            location: 'Frankfurt, Germany (ASN 49505 — M247 Commercial Hosting / VPN)',
            device: {
              name: 'DESKTOP-R9Q721 (Unmanaged)',
              os: 'Windows 10 Pro 64-bit',
              browser: 'Chrome 128.0.0.0',
              isManaged: false,
              trustStatus: 'Untrusted (No MDM Certificate)',
            },
            sessionId: 'sess_pre_auth_fail',
            rawPayload:
              'EVENT: user.auth.fail | Reason: INVALID_CREDENTIALS | Actor: m.vance | ClientIP: 203.0.113.180 | Host: vpn-exit-04.m247-hosting.example.net | UA: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0',
          },
          {
            id: 'evt-02',
            timestamp: '02:49:15 UTC',
            system: 'Okta Cloud IdP',
            eventType: 'user.authentication.auth_via_mfa.failure',
            status: 'failure',
            title: 'Second Failed Authentication Attempt',
            description:
              'Consecutive failed password attempt from the same client IP and unmanaged device.',
            sourceIp: '203.0.113.180',
            location: 'Frankfurt, Germany (M247 Hosting)',
            device: {
              name: 'DESKTOP-R9Q721 (Unmanaged)',
              os: 'Windows 10 Pro',
              browser: 'Chrome 128.0.0.0',
              isManaged: false,
              trustStatus: 'Untrusted',
            },
            rawPayload:
              'EVENT: user.auth.fail | Attempt: 2 | Actor: m.vance | ClientIP: 203.0.113.180 | Status: 401_UNAUTHORIZED',
          },
          {
            id: 'evt-03',
            timestamp: '02:50:40 UTC',
            system: 'Okta Cloud IdP',
            eventType: 'user.authentication.verify',
            status: 'warning',
            title: 'Primary Authentication Succeeded — MFA Challenge Dispatched',
            description:
              'Valid password submitted on attempt 3. Duo/Okta Verify push challenge automatically dispatched to registered mobile device.',
            sourceIp: '203.0.113.180',
            location: 'Frankfurt, Germany (M247 Hosting)',
            device: {
              name: 'DESKTOP-R9Q721 (Unmanaged)',
              os: 'Windows 10 Pro',
              browser: 'Chrome 128.0.0.0',
              isManaged: false,
              trustStatus: 'Untrusted',
            },
            rawPayload:
              'EVENT: user.auth.password.success | Action: MFA_DISPATCHED | Factor: OKTA_VERIFY_PUSH | RecipientPhone: +353-1-496-XXXX',
          },
          {
            id: 'evt-04',
            timestamp: '02:50:42 – 02:54:12 UTC',
            system: 'Duo / Okta Verify MFA',
            eventType: 'system.mfa.factor.push_cluster',
            status: 'alert',
            title: 'MFA Push Fatigue Cluster (5 Denials, 1 Approval)',
            description:
              '6 push prompts generated within 3.5 minutes. Prompts 1 through 5 timed out or were explicitly denied. Prompt 6 was approved at 02:54:12 UTC.',
            sourceIp: '203.0.113.180',
            location: 'Client: Frankfurt, DE | Mobile Responder: Dublin, IE',
            device: {
              name: 'Push notification response via iPhone 15 (iOS 18.0)',
              trustStatus: 'Enrolled Mobile MFA Device',
            },
            rawPayload:
              'MFA_TELEMETRY: Push_1 (02:50:42, DENIED) | Push_2 (02:51:15, TIMEOUT) | Push_3 (02:52:00, DENIED) | Push_4 (02:52:50, DENIED) | Push_5 (02:53:30, DENIED) | Push_6 (02:54:12, APPROVED) | TotalElapsed: 210s',
          },
          {
            id: 'evt-05',
            timestamp: '02:54:15 UTC',
            system: 'Okta Cloud IdP',
            eventType: 'user.session.start',
            status: 'warning',
            title: 'Administrative Web Session Established',
            description:
              'Single Sign-On session sess_882a9f10 granted full administrative portal access from unmanaged Windows device.',
            sourceIp: '203.0.113.180',
            location: 'Frankfurt, Germany (Host: vpn-exit-04.m247-hosting.example.net)',
            device: {
              name: 'DESKTOP-R9Q721 (Unmanaged Windows 10)',
              isManaged: false,
              trustStatus: 'Untrusted / Missing Corporate Certificate',
            },
            sessionId: 'sess_882a9f10',
            rawPayload:
              'EVENT: user.session.start | SessionID: sess_882a9f10 | User: m.vance | AuthMethod: PWD+MFA_PUSH | RiskScore: High (Unfamiliar Device + Hosting IP)',
          },
          {
            id: 'evt-06',
            timestamp: '03:02:18 UTC',
            system: 'Corporate ZTNA / Client VPN',
            eventType: 'network.vpn.tunnel.keepalive',
            status: 'success',
            title: 'Concurrent Active Session on Corporate Laptop (Dublin, IE)',
            description:
              'Routine ZTNA keepalive telemetry from Marcus\'s company-managed laptop VER-MBP-9021. Jamf MDM compliance verified.',
            sourceIp: '198.51.100.120',
            location: 'Dublin, Ireland (Corporate Office / Residential Fiber)',
            device: {
              name: 'VER-MBP-9021',
              os: 'macOS 15.0 Sequoia',
              isManaged: true,
              trustStatus: 'Fully Compliant (Cert: Veridian-Device-CA-4029)',
            },
            rawPayload:
              'ZTNA_HEARTBEAT: Host: VER-MBP-9021 | Serial: VM-98421 | IP: 198.51.100.120 | Compliance: TRUE | Jamf_Last_Checkin: 03:00:00 UTC | Status: Connected',
          },
          {
            id: 'evt-07',
            timestamp: '03:14:22 UTC',
            system: 'AWS CloudTrail',
            eventType: 'iam.CreateAccessKey',
            status: 'alert',
            title: 'SIEM High-Severity Alert: CreateAccessKey on Admin IAM User',
            description:
              'Session sess_882a9f10 executed CreateAccessKey for IAM user m.vance-admin, generating persistent programmatic API key AKIA2048VANCE902.',
            sourceIp: '203.0.113.180',
            location: 'Frankfurt, Germany',
            sessionId: 'sess_882a9f10',
            rawPayload:
              'CLOUDTRAIL: eventName: CreateAccessKey | userName: m.vance-admin | sourceIP: 203.0.113.180 | userAgent: aws-cli/2.15.0 Python/3.11.6 | accessKeyId: AKIA2048VANCE902 | Status: 200_OK | SIEM_Rule: ANOM_IAM_KEY_GEN',
          },
          {
            id: 'evt-08',
            timestamp: '03:18:40 UTC',
            system: 'AWS CloudTrail',
            eventType: 'rds.DescribeDBClusters',
            status: 'warning',
            title: 'Database Reconnaissance Query Executed',
            description:
              'API call DescribeDBClusters invoked using newly created access key AKIA2048VANCE902 from IP 203.0.113.180.',
            sourceIp: '203.0.113.180',
            location: 'Frankfurt, Germany',
            rawPayload:
              'CLOUDTRAIL: eventName: DescribeDBClusters | accessKeyId: AKIA2048VANCE902 | targetRegion: eu-west-1 | clustersReturned: [prod-aurora-cluster-01, prod-aurora-cluster-replica]',
          },
        ],
      },
    },
    {
      id: 'ev-user-baseline',
      type: 'policy',
      label: 'User Baseline Profile & Incident Standards',
      content: {
        type: 'directory',
        company: 'Veridian Logistics — Personnel & Security Policy Reference',
        employee: {
          name: 'Marcus Vance',
          title: 'Senior Database Administrator & Platform Reliability Engineer',
          department: 'Core Infrastructure & Data Platform',
          officialEmail: 'm.vance@veridian-logistics.example',
          internalPhone: '+353 1 496 0192 (Dublin Primary Desk & Mobile Bridge)',
          officeLocation: 'Dublin Tech Center, Building 2, Floor 4',
          assistant: 'Platform Team On-Call Desk: Ext. 5100',
          currentStatus:
            'Active On-Call: Secondary Platform Reliability Rotation (00:00 – 08:00 UTC) for DB Migration Sprint',
        },
        policy: {
          code: 'SOP SEC-204',
          title: 'Anomalous Administrative Access & Compromise Triage Standards',
          rules: [
            'Principle 1 (Operational Context): Working off-hours or during night shifts is expected for designated on-call engineers. Off-hours login timestamps or European regional connections alone do NOT constitute evidence of compromise.',
            'Principle 2 (High-Risk Behavioral Anomalies): Access from unmanaged/unrecognized operating systems lacking corporate MDM certificates, source IPs resolving to commercial datacenter/VPN hosting nodes, or clusters of repeated MFA prompt rejections followed by sudden approval represent strong indicators of credential compromise.',
            'Principle 3 (Fact vs. Hypothesis Discipline): Analysts must strictly distinguish confirmed facts (e.g. concurrent active sessions, executed CloudTrail API calls) from unproven hypotheses (e.g. assuming how credentials were leaked, or declaring data exfiltration occurred before proof).',
            'Principle 4 (Proportionate Containment): Upon detecting unauthorized administrative access: (a) Immediately terminate the rogue session token; (b) Deactivate newly generated IAM access keys; (c) Contact the user out-of-band via verified corporate directory telephone; (d) Mandate password/MFA reset; (e) Preserve CloudTrail and IdP audit logs for investigation.',
            'Principle 5 (Avoid Disproportionate Escalation): Do NOT remotely wipe corporate laptops without host-level malware evidence, and do NOT issue premature public breach declarations before root cause and data impact are verified.',
          ],
        },
      },
    },
  ],

  // ── Steps ─────────────────────────────────────────────────────────────────
  //
  // Step 1 (35 pts): Identify genuine technical anomalies (flag-selection, 4 correct, 2 distractors)
  // Step 2 (35 pts): Distinguish confirmed facts from unproven hypotheses (classification, 4 items)
  // Step 3 (30 pts): Select proportionate incident response (single-choice, no partial)
  //
  // Total: 100 pts. Pass threshold: 70.
  steps: [
    {
      id: 'step-anomalies',
      prompt:
        'Review the authentication timeline and user baseline profile. Select all genuine anomalous indicators that warrant security investigation. Do NOT flag details that are benign or explained by normal operations.',
      interaction: 'flag-selection',
      partialCreditAllowed: true,
      pointValue: 35,
      items: [
        {
          id: 'anom-mfa-fatigue',
          label:
            'Multiple rapid MFA push notification denials (5 failures within 3.5 minutes) followed by a sudden approval.',
        },
        {
          id: 'anom-unmanaged-device',
          label:
            'Authentication originated from an unmanaged Windows workstation lacking a corporate MDM certificate connecting from a commercial hosting IP (203.0.113.180), whereas Marcus only uses a company-managed macOS laptop (VER-MBP-9021).',
        },
        {
          id: 'anom-create-access-key',
          label:
            'Creation of a persistent programmatic IAM access key (AKIA2048VANCE902) directly from an interactive web session rather than using standard federated SSO.',
        },
        {
          id: 'dist-off-hours',
          label:
            'The sign-in occurred at 03:14 UTC outside of normal daytime business hours.',
        },
        {
          id: 'dist-german-ip',
          label:
            'The IP address is geographically located in Frankfurt, Germany.',
        },
        {
          id: 'dist-chrome-browser',
          label:
            'The web authentication request used a standard Google Chrome desktop browser.',
        },
      ],
      answerKey: {
        'anom-mfa-fatigue': true,
        'anom-unmanaged-device': true,
        'anom-create-access-key': true,
        'dist-off-hours': false,
        'dist-german-ip': false,
        'dist-chrome-browser': false,
      },
    },
    {
      id: 'step-fact-vs-inference',
      prompt:
        'In incident triage, analysts must distinguish confirmed facts directly established by log evidence from plausible hypotheses that require further verification. Classify each of the following statements as a "Confirmed Fact" or a "Plausible Hypothesis (Unproven)".',
      interaction: 'classification',
      partialCreditAllowed: true,
      pointValue: 35,
      items: [
        {
          id: 'fact-concurrent-laptop',
          label:
            'Marcus\'s assigned corporate laptop (VER-MBP-9021) maintained an active, compliant session from Ireland concurrently with the session from the German hosting IP.',
          options: ['Confirmed Fact', 'Plausible Hypothesis (Unproven)'],
        },
        {
          id: 'hypo-stolen-password',
          label:
            'The attacker acquired Marcus\'s password from a third-party credential stuffing dump or previous phishing lure.',
          options: ['Confirmed Fact', 'Plausible Hypothesis (Unproven)'],
        },
        {
          id: 'hypo-mfa-accidental',
          label:
            'Marcus accidentally approved the 6th push notification on his phone while half-asleep after being spammed by prompt notifications.',
          options: ['Confirmed Fact', 'Plausible Hypothesis (Unproven)'],
        },
        {
          id: 'fact-access-key-created',
          label:
            'A programmatic AWS IAM access key (AKIA2048VANCE902) was successfully generated by the session originating from 203.0.113.180.',
          options: ['Confirmed Fact', 'Plausible Hypothesis (Unproven)'],
        },
      ],
      answerKey: {
        'fact-concurrent-laptop': 'Confirmed Fact',
        'hypo-stolen-password': 'Plausible Hypothesis (Unproven)',
        'hypo-mfa-accidental': 'Plausible Hypothesis (Unproven)',
        'fact-access-key-created': 'Confirmed Fact',
      },
    },
    {
      id: 'step-response',
      prompt:
        'Based on the confirmed facts and proportionate incident response standards (SOP SEC-204), what is the safest and most proportionate immediate response?',
      interaction: 'single-choice',
      partialCreditAllowed: false,
      pointValue: 30,
      items: [
        {
          id: 'resp-proportionate',
          label:
            'Immediately revoke session sess_882a9f10, deactivate the newly created IAM access key AKIA2048VANCE902, initiate out-of-band telephone contact with Marcus via his verified directory number (+353 1 496 0192) to verify activity, and preserve CloudTrail/IdP audit logs.',
        },
        {
          id: 'resp-overkill-wipe',
          label:
            'Remotely wipe Marcus\'s corporate laptop (VER-MBP-9021) immediately and issue a company-wide breach notification declaring that the customer database has been compromised.',
        },
        {
          id: 'resp-under-react-email',
          label:
            'Send an email to Marcus\'s corporate inbox asking if he is currently using a Windows machine in Germany, and wait for his reply before taking containment action.',
        },
        {
          id: 'resp-ignore-oncall',
          label:
            'Dismiss the alert without action because Marcus is scheduled on-call and database administrators frequently create access keys during off-hours maintenance.',
        },
      ],
      answerKey: { chosen: 'resp-proportionate' },
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Do not assume off-hours access or European IP geolocation is malicious on its own. Check the user profile: Marcus is on scheduled secondary on-call rotation for database migration.',
    'Carefully inspect device posture and MFA telemetry: unmanaged personal devices with no MDM certificate and repeated push denials followed by an approval strongly indicate an unauthorized access attempt via push fatigue.',
    'Proportionate incident response focuses on immediate containment of active risks (revoking the rogue session and deactivating the new IAM key) while preserving logs and verifying with the user out-of-band. Avoid premature claims of catastrophic breach or panic-wiping uninvolved devices.',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'log-timeline-analysis',
    'mfa-fatigue-detection',
    'fact-vs-hypothesis',
    'device-posture-assessment',
    'proportionate-incident-response',
  ],

  // ── Scoring ───────────────────────────────────────────────────────────────
  passThreshold: 70,

  // ── Explanations ─────────────────────────────────────────────────────────
  successExplanation:
    'Superb investigative work! You correctly analyzed the multi-system timeline, identified the genuine indicators of credential compromise while filtering out operational noise, distinguished confirmed facts from hypotheses, and chose the proportionate containment response.\n\nInvestigation Breakdown:\n1. Why the 3am Timestamp and German IP Alone Are NOT Evidence of Compromise:\n- Marcus Vance is actively on-call (00:00–08:00 UTC) for a planned database migration sprint. Legitimate DBA work during off-hours is normal.\n- Veridian operates database replicas in Frankfurt; regional European traffic is expected. Neither the timestamp nor the country proves fraud.\n\n2. Genuine Indicators of Compromise:\n- Unmanaged Windows Endpoint: Marcus is only assigned a corporate macOS laptop (VER-MBP-9021). The unmanaged Windows machine had no MDM device certificate.\n- Hosting Provider / Datacenter ASN: The IP 203.0.113.180 belongs to M247 Hosting (a commercial VPN/proxy provider), not a residential ISP or office.\n- MFA Push Fatigue Attack: 5 consecutive push rejections in 3.5 minutes followed by an approval is a classic push-bombing signature.\n- Unauthorized IAM Access Key: Creating persistent API key AKIA2048VANCE902 bypasses SSO session controls and is a classic persistence technique.\n\n3. Fact vs. Hypothesis Discipline:\n- Facts established by logs: Marcus\'s official laptop was online in Ireland concurrently with the German session; and an IAM key was created.\n- Plausible hypotheses: How the password was stolen (phishing vs breach) and whether Marcus approved MFA accidentally vs being coerced are plausible explanations that require out-of-band user verification before being stated as facts.\n\n4. Proportionate Response:\n- Terminating the suspicious session and disabling the new IAM key neutralizes active risk immediately.\n- Contacting Marcus via his verified directory telephone ensures direct confirmation without alerting an adversary in his email.',

  failureExplanation:
    'Effective incident triage requires looking beyond surface-level details like timestamps or countries, and applying proportionate response protocols without jumping to unproven conclusions.\n\nKey Investigation Takeaways:\n- Off-Hours & Location Context: Do not flag off-hours logins as suspicious without checking on-call schedules. Marcus was on active secondary on-call rotation for database migration.\n- Real Indicators of Compromise:\n  • Device posture mismatch: Unmanaged Windows 10 client vs company-managed macOS laptop.\n  • Infrastructure ASN: Datacenter hosting/VPN exit node (M247 Hosting) rather than an ISP.\n  • Authentication telemetry: MFA push bombing (5 rapid denials followed by 1 approval).\n  • Persistence activity: Interactive creation of programmatic IAM access keys.\n- Fact vs Hypothesis: Always distinguish what the logs prove (concurrent sessions, API calls) from speculative theories (exact password theft vector, reason for MFA approval).\n- Safe & Proportionate Response: Invalidate the rogue session, deactivate the unauthorized access key, contact the user via out-of-band telephone (+353 1 496 0192), and preserve audit logs. Avoid under-reacting (emailing the compromised account) or over-reacting (panic-wiping Marcus\'s laptop).',

  shuffleItems: false,
};
