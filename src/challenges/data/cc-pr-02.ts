// ============================================================
// CyberCampus — Challenge cc-pr-02: "MFA Under Attack"
// Room: Privacy & Account Security | Difficulty: Intermediate
// ============================================================

import type { Challenge } from '../../types';

export interface AuthTimelineEvent {
  id: string;
  timestamp: string;
  eventType: 'legitimate_login' | 'logout' | 'push_dispatched' | 'push_denied' | 'push_timeout' | 'sms_social_engineering' | 'security_alert';
  serviceName: string;
  sourceIp: string;
  location: string;
  device: string;
  userAgent: string;
  status: string;
  details: string;
  isSuspicious: boolean;
}

export interface AuthTimelineContent {
  isAuthTimeline: boolean;
  targetUser: {
    name: string;
    email: string;
    title: string;
    department: string;
    officeLocation: string;
  };
  auditDate: string;
  events: AuthTimelineEvent[];
}

export interface PushSimulatorContent {
  isPushSimulator: boolean;
  deviceModel: string;
  appName: string;
  recipientPhone: string;
  activePrompt: {
    promptId: string;
    service: string;
    account: string;
    timestamp: string;
    location: string;
    ipAddress: string;
    deviceInfo: string;
  };
  unsolicitedCount: number;
  recentSms: {
    sender: string;
    receivedTime: string;
    messageText: string;
  };
}

export const challengeCC_PR_02: Challenge = {
  id: 'cc-pr-02',
  roomId: 'privacy',
  difficulty: 'intermediate',
  title: 'MFA Under Attack',
  briefing:
    'Late on a Sunday evening, Elena Rostova, Senior Product Director for Cloud Services at Apex Global, was awakened by repeated multi-factor authentication (MFA) push approval prompts on her corporate mobile device, followed by an urgent text message claiming to be from corporate IT Support. Learners must inspect the identity provider authentication logs, examine the incoming mobile prompt telemetry, distinguish the expected business login from the unauthorized barrage, explain what unsolicited push requests indicate regarding credential exposure, and formulate an immediate containment and phishing-resistant hardening plan under SOP SEC-304.',

  // ── Evidence Items ────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-auth-timeline',
      type: 'log',
      label: 'Authentication Activity Log (Identity Provider)',
      content: {
        isAuthTimeline: true,
        targetUser: {
          name: 'Elena Rostova',
          email: 'elena.rostova@corp.example',
          title: 'Senior Product Director, Cloud Services',
          department: 'Core Product Engineering',
          officeLocation: 'Seattle Corporate HQ (USA)',
        },
        auditDate: '2026-10-18',
        events: [
          {
            id: 'evt-01',
            timestamp: '2026-10-18 09:14:22 UTC',
            eventType: 'legitimate_login',
            serviceName: 'Apex Cloud Management Console',
            sourceIp: '198.51.100.45',
            location: 'Seattle, WA, United States',
            device: 'Apex-Managed Win11 Laptop (WS-4412)',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
            status: 'SUCCESS (Single Push Approved)',
            details: 'Elena started her regular business workday from the Seattle corporate office. Primary password verified; single push notification promptly approved on corporate iPhone.',
            isSuspicious: false,
          },
          {
            id: 'evt-02',
            timestamp: '2026-10-18 17:30:10 UTC',
            eventType: 'logout',
            serviceName: 'Apex Cloud Management Console',
            sourceIp: '198.51.100.45',
            location: 'Seattle, WA, United States',
            device: 'Apex-Managed Win11 Laptop (WS-4412)',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36',
            status: 'SESSION_TERMINATED',
            details: 'Normal end-of-day session sign-out.',
            isSuspicious: false,
          },
          {
            id: 'evt-03',
            timestamp: '2026-10-18 23:42:15 UTC',
            eventType: 'push_timeout',
            serviceName: 'Apex Cloud Management Console',
            sourceIp: '203.0.113.88',
            location: 'Bucharest, Romania',
            device: 'Linux x86_64 (Unknown Host)',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
            status: 'TIMEOUT / EXPIRED (Prompt PUSH-9041)',
            details: 'Primary username and password correctly authenticated from an unfamiliar foreign IP. MFA push dispatched to Elena\'s phone; timed out after 60 seconds with no user interaction.',
            isSuspicious: true,
          },
          {
            id: 'evt-04',
            timestamp: '2026-10-18 23:43:02 UTC',
            eventType: 'push_denied',
            serviceName: 'Apex Cloud Management Console',
            sourceIp: '203.0.113.88',
            location: 'Bucharest, Romania',
            device: 'Linux x86_64 (Unknown Host)',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
            status: 'DENIED_BY_USER (Prompt PUSH-9042)',
            details: 'Immediate re-authentication with valid primary password. Push prompt dispatched; Elena tapped "Deny".',
            isSuspicious: true,
          },
          {
            id: 'evt-05',
            timestamp: '2026-10-18 23:43:20 UTC',
            eventType: 'push_denied',
            serviceName: 'Apex Cloud Management Console',
            sourceIp: '203.0.113.88',
            location: 'Bucharest, Romania',
            device: 'Linux x86_64 (Unknown Host)',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
            status: 'DENIED_BY_USER (Prompt PUSH-9043)',
            details: 'Primary password authenticated 18 seconds later. Push prompt dispatched; Elena tapped "Deny".',
            isSuspicious: true,
          },
          {
            id: 'evt-06',
            timestamp: '2026-10-18 23:44:05 UTC',
            eventType: 'push_denied',
            serviceName: 'Apex Cloud Management Console',
            sourceIp: '203.0.113.88',
            location: 'Bucharest, Romania',
            device: 'Linux x86_64 (Unknown Host)',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
            status: 'DENIED_BY_USER (Prompt PUSH-9044)',
            details: 'Primary password authenticated. Push prompt dispatched; Elena tapped "Deny".',
            isSuspicious: true,
          },
          {
            id: 'evt-07',
            timestamp: '2026-10-18 23:44:48 UTC',
            eventType: 'push_timeout',
            serviceName: 'Apex Cloud Management Console',
            sourceIp: '203.0.113.88',
            location: 'Bucharest, Romania',
            device: 'Linux x86_64 (Unknown Host)',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
            status: 'TIMEOUT / EXPIRED (Prompt PUSH-9045)',
            details: 'Primary password authenticated. Push prompt dispatched; timed out.',
            isSuspicious: true,
          },
          {
            id: 'evt-08',
            timestamp: '2026-10-18 23:45:12 UTC',
            eventType: 'push_timeout',
            serviceName: 'Apex Cloud Management Console',
            sourceIp: '203.0.113.88',
            location: 'Bucharest, Romania',
            device: 'Linux x86_64 (Unknown Host)',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
            status: 'TIMEOUT / EXPIRED (Prompt PUSH-9046)',
            details: 'Primary password authenticated. Push prompt dispatched; timed out.',
            isSuspicious: true,
          },
          {
            id: 'evt-09',
            timestamp: '2026-10-18 23:46:01 UTC',
            eventType: 'push_denied',
            serviceName: 'Apex Cloud Management Console',
            sourceIp: '203.0.113.88',
            location: 'Bucharest, Romania',
            device: 'Linux x86_64 (Unknown Host)',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
            status: 'DENIED_BY_USER (Prompt PUSH-9047)',
            details: 'Primary password authenticated. Push prompt dispatched; Elena tapped "Deny".',
            isSuspicious: true,
          },
          {
            id: 'evt-10',
            timestamp: '2026-10-18 23:47:30 UTC',
            eventType: 'push_dispatched',
            serviceName: 'Apex Cloud Management Console',
            sourceIp: '203.0.113.88',
            location: 'Bucharest, Romania',
            device: 'Linux x86_64 (Unknown Host)',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
            status: 'ACTIVE_PENDING (Prompt PUSH-9048)',
            details: 'Primary password authenticated. 8th push prompt dispatched in 5 minutes; currently awaiting response on Elena\'s mobile device.',
            isSuspicious: true,
          },
          {
            id: 'evt-11',
            timestamp: '2026-10-18 23:48:10 UTC',
            eventType: 'sms_social_engineering',
            serviceName: 'Telephony Gateway / SMS Notification',
            sourceIp: '192.0.2.77',
            location: 'VoIP Provider Relay (Virtual Number)',
            device: 'Automated SMS Gateway',
            userAgent: 'TwilioVoIPGateway/2.4',
            status: 'MESSAGE_DELIVERED',
            details: 'Incoming SMS received on Elena\'s personal cell from spoofed number +1 (555) 019-4822: "Apex IT Support: Elena, we are detecting an authentication sync loop on your account. Please click Approve on the pending Authenticator prompt to clear the stuck queue."',
            isSuspicious: true,
          },
          {
            id: 'evt-12',
            timestamp: '2026-10-18 23:49:00 UTC',
            eventType: 'security_alert',
            serviceName: 'Identity Threat Detection Engine (ITDR)',
            sourceIp: 'Internal Cluster',
            location: 'Automated Rule Alert',
            device: 'IdP Security Service',
            userAgent: 'ApexIdentityWatcher/1.0',
            status: 'ALERT_HIGH: ANOMALOUS_MFA_FREQUENCY',
            details: 'Alert triggered: 8 push prompts requested within 7 minutes for account elena.rostova@corp.example from an anomalous IP range with repeated user rejections.',
            isSuspicious: true,
          },
        ],
      } as unknown as Record<string, unknown>,
    },
    {
      id: 'ev-push-simulator',
      type: 'file',
      label: "Elena's Mobile Device View (Simulated Authenticator)",
      content: {
        isPushSimulator: true,
        deviceModel: 'Apple iPhone 15 Pro (Elena Corporate Device)',
        appName: 'Apex Authenticator Enterprise v4.8',
        recipientPhone: '+1 (555) 014-9921',
        activePrompt: {
          promptId: 'PUSH-9048',
          service: 'Apex Cloud Management Console',
          account: 'elena.rostova@corp.example',
          timestamp: '2026-10-18 23:47:30 UTC',
          location: 'Bucharest, Romania',
          ipAddress: '203.0.113.88',
          deviceInfo: 'Linux x86_64 / Firefox 128.0',
        },
        unsolicitedCount: 8,
        recentSms: {
          sender: '+1 (555) 019-4822 (Claiming to be Apex IT Support)',
          receivedTime: '23:48:10 UTC',
          messageText:
            'Apex IT Support: Elena, we are detecting an authentication sync loop on your account. Please click Approve on the pending Authenticator prompt to clear the stuck queue.',
        },
      } as unknown as Record<string, unknown>,
    },
    {
      id: 'ev-mfa-sop',
      type: 'policy',
      label: 'MFA Incident Response Standard (SOP SEC-304)',
      content: {
        title: 'SOP SEC-304: Multi-Factor Authentication Threat Response & Hardening',
        code: 'SEC-304-REV2',
        category: 'IDENTITY DEFENSE & INCIDENT RESPONSE STANDARD',
        effectiveDate: '2026-05-15',
        classification: 'INTERNAL INCIDENT PROCEDURE',
        rules: [
          'Rule 1 (The Forensic Meaning of Unsolicited MFA Prompts): An unsolicited MFA push prompt is conclusive technical evidence that an adversary has already entered the user\'s correct primary password. The attacker is currently blocked solely by the secondary authentication barrier.',
          'Rule 2 (MFA Fatigue / Push Bombing Protocol): Users must never approve any authentication prompt they did not personally initiate. Repeated notifications are an adversary tactic to induce fatigue, confusion, or accidental acceptance. Tapping "Approve" immediately hands full access to the adversary.',
          'Rule 3 (Social Engineering & Impersonation Defense): Adversaries frequently coordinate push fatigue attacks with urgent text messages, emails, or phone calls impersonating IT Helpdesk or Security staff. Official Apex IT personnel will NEVER instruct an employee to approve an MFA prompt, bypass authentication, or read back security codes.',
          'Rule 4 (Mandatory Immediate Containment Procedure): When subjected to push bombing or suspicious authentication requests, employees and responders must: (1) Reject and deny all pending prompts; (2) Refrain from replying to out-of-band social engineering messages; (3) Report the attack immediately to the SOC via verified internal hotlines; (4) Terminate all existing sessions across identity providers (revoke refresh tokens); and (5) Initiate an immediate primary password reset.',
          'Rule 5 (Authentication Assurance & Phishing Resistance Hierarchy):',
          '  - SMS / Voice OTP: Least secure; vulnerable to SIM swapping, cellular eavesdropping, and SS7 routing interception.',
          '  - Simple Mobile Push ("Tap to Approve"): Convenient, but highly vulnerable to push fatigue, prompt bombing, and accidental acceptance.',
          '  - Authenticator App TOTP (6-digit rolling codes): Requires manual code entry and immune to remote push fatigue, but NOT phishing-resistant because real-time adversary-in-the-middle (AiTM) reverse proxies can relay intercepted codes.',
          '  - Phishing-Resistant FIDO2 / WebAuthn (Hardware Keys & Passkeys): Highest security; cryptographically binds the authentication assertion to the exact domain origin via public-key cryptography. Cannot be phished, intercepted by AiTM proxies, or triggered via unsolicited remote push prompts.',
        ],
      } as unknown as Record<string, unknown>,
    },
  ],

  // ── Steps ──────────────────────────────────────────────────────────────────
  steps: [
    // Step 1: Identify Attack Pattern & Credential Status (30 pts, single-choice)
    {
      id: 'step-attack-pattern',
      prompt:
        "Based on the authentication logs and mobile notifications, what type of security incident is occurring, and what does the arrival of repeated MFA push prompts prove about the attacker's progress?",
      interaction: 'single-choice',
      items: [
        {
          id: 'att-mfa-fatigue-password-compromised',
          label:
            "MFA Fatigue / Push Notification Bombing: The attacker has already obtained Elena's valid primary password and is repeatedly triggering push approval prompts to fatigue or trick her into authorizing the session.",
        },
        {
          id: 'att-network-dos-ddos',
          label:
            'Network Denial of Service (DoS): An external adversary is flooding the corporate identity server with SYN packets to exhaust bandwidth, having no access to user credentials.',
        },
        {
          id: 'att-authenticator-glitch',
          label:
            "Mobile Authenticator Bug: The corporate authentication server has an internal synchronization glitch resending Elena's legitimate morning login token from earlier in the day.",
        },
        {
          id: 'att-brute-force-no-password',
          label:
            'Primary Password Brute Force: The attacker is guessing passwords at the portal login screen, but has not yet discovered or entered Elena\'s valid primary password.',
        },
      ],
      answerKey: { chosen: 'att-mfa-fatigue-password-compromised' },
      pointValue: 30,
      partialCreditAllowed: false,
    },

    // Step 2: Immediate Containment Response (35 pts, single-choice)
    {
      id: 'step-immediate-containment',
      prompt:
        'Under SOP SEC-304, how must Elena immediately respond to the barrage of unsolicited push prompts and the suspicious IT helpdesk message?',
      interaction: 'single-choice',
      items: [
        {
          id: 'resp-deny-report-revoke',
          label:
            'Deny all pending push prompts, do not reply to the SMS message, immediately contact the SOC through verified corporate emergency channels, revoke all active user sessions, and reset the corporate password.',
        },
        {
          id: 'resp-approve-to-silence',
          label:
            'Approve the next incoming push notification to silence the incessant phone notifications, planning to change the account password the following morning during normal business hours.',
        },
        {
          id: 'resp-call-caller-back',
          label:
            'Reply to the SMS text message asking the helpdesk technician for their employee badge number, and approve the prompt once they provide a plausible IT ticket reference.',
        },
        {
          id: 'resp-uninstall-app',
          label:
            'Uninstall the Authenticator app from the mobile phone so notifications cease, leaving existing login sessions and the compromised primary password active.',
        },
      ],
      answerKey: { chosen: 'resp-deny-report-revoke' },
      pointValue: 35,
      partialCreditAllowed: false,
    },

    // Step 3: Long-Term Account Protection & Phishing Resistance (35 pts, single-choice)
    {
      id: 'step-longterm-defense',
      prompt:
        'To definitively eliminate push fatigue attacks and real-time adversary-in-the-middle (AiTM) credential phishing across the organization, which authentication modernization policy should the security team implement?',
      interaction: 'single-choice',
      items: [
        {
          id: 'def-fido2-phishing-resistant',
          label:
            'Mandate FIDO2/WebAuthn hardware security keys or device-bound passkeys for high-risk access, as they cryptographically bind authentication to the origin URL and cannot be phished or triggered via unsolicited remote push prompts.',
        },
        {
          id: 'def-switch-to-sms',
          label:
            'Replace mobile push notifications with SMS text verification codes across all employees, because SMS messages are completely immune to SIM-swapping and cellular interception.',
        },
        {
          id: 'def-app-totp-phishing-resistant',
          label:
            'Switch to standard 6-digit rolling authenticator app codes (TOTP) and declare them fully phishing-resistant, because software codes are immune to real-time proxy phishing pages.',
        },
        {
          id: 'def-hide-push-buttons',
          label:
            'Retain simple push approvals but remove the "Deny" button from the mobile prompt so users can only tap "Approve" when they are ready.',
        },
      ],
      answerKey: { chosen: 'def-fido2-phishing-resistant' },
      pointValue: 35,
      partialCreditAllowed: false,
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Analyze the timing and origin of each event in the authentication log. Notice the legitimate morning login from Seattle (09:14 UTC) versus the midnight cluster originating from an unfamiliar IP in Bucharest, Romania (23:42–23:47 UTC).',
    'Remember the fundamental rule of multi-factor authentication: an MFA push prompt is only dispatched AFTER the correct primary username and password have already been submitted. The arrival of repeated prompts proves the adversary already holds valid primary credentials.',
    'Carefully evaluate authentication factor capabilities under SOP SEC-304: simple push notifications can be spammed remotely, and 6-digit TOTP app codes can still be intercepted by real-time reverse proxies. Only cryptographic FIDO2/WebAuthn hardware keys and passkeys provide true phishing resistance through domain origin binding.',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'mfa-fatigue-detection',
    'push-bombing-analysis',
    'authentication-log-investigation',
    'social-engineering-defense',
    'phishing-resistant-architecture',
  ],

  // ── Feedback Explanations ──────────────────────────────────────────────────
  passThreshold: 70,
  successExplanation:
    'Outstanding incident response! You recognized that repeated unsolicited MFA push notifications signify an active MFA fatigue (push bombing) attack, proving the adversary already possesses the valid primary password. By rejecting the prompts, ignoring the social engineering SMS, and choosing an immediate session revocation and password reset, you prevented an unauthorized cloud console takeover. Furthermore, you correctly identified that only FIDO2/WebAuthn public-key authentication provides genuine phishing resistance through origin binding, whereas simple push can be spammed and rolling app codes (TOTP) remain vulnerable to real-time AiTM proxy relay.',
  failureExplanation:
    'Review the authentication timeline and SOP SEC-304. An MFA push notification is only triggered after the identity provider successfully verifies the primary password; therefore, repeated prompts prove the password has been breached. Never approve an unsolicited prompt to stop notifications or comply with unverified IT callers. To stop push fatigue attacks permanently, organizations must deploy phishing-resistant FIDO2/WebAuthn authentication.',
};
