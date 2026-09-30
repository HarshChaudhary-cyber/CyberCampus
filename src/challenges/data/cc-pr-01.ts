// ============================================================
// CyberCampus — Challenge cc-pr-01: "Password Audit"
// Room: Privacy & Account Security | Difficulty: Beginner
// ============================================================

import type { Challenge } from '../../types';

export interface PasswordAuditAccount {
  id: string;
  serviceName: string;
  category: 'cloud' | 'identity' | 'database' | 'vendor' | 'internal' | 'developer' | 'system' | 'perks';
  username: string;
  roleDescription: string;
  passwordDisplay: string;
  passwordPattern: string;
  passwordLength: number;
  breachStatus: {
    isExposed: boolean;
    breachSource?: string;
    details: string;
  };
  privilegeLevel: 'critical' | 'high' | 'medium' | 'low';
  mfaStatus: {
    enabled: boolean;
    type: 'fido2' | 'totp' | 'sms' | 'none';
    label: string;
  };
  reuseLink?: {
    isReused: boolean;
    reusedWithServiceId?: string;
    reusedWithServiceName?: string;
    warning: string;
  };
  requiresRemediation: boolean;
  remediationReason: string;
  lastChangedDate: string;
  notes: string;
}

export interface PasswordAuditContent {
  isPasswordAudit: boolean;
  title: string;
  targetUser: {
    name: string;
    title: string;
    department: string;
    employeeId: string;
  };
  auditDate: string;
  auditorName: string;
  overviewSummary: string;
  accounts: PasswordAuditAccount[];
}

export interface PasswordPolicyContent {
  title: string;
  code: string;
  category: string;
  effectiveDate: string;
  classification: string;
  rules: string[];
}

export const challengeCC_PR_01: Challenge = {
  id: 'cc-pr-01',
  roomId: 'privacy',
  difficulty: 'beginner',
  title: 'Password Audit',
  briefing:
    'During an identity and access security review at Apex Global, the security team conducted an internal credential audit for Jordan Lee, Senior Systems Engineer. Investigators cross-referenced eight active account records against fictional breach compilations, reuse patterns, credential predictability, and multi-factor authentication (MFA) enforcement. Learners must review the ledger, recognize that password length and character complexity alone do not guarantee security, identify which accounts require immediate remediation, prioritize the single most urgent vulnerability, and formulate an effective account-protection plan.',

  // ── Evidence Items ────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-password-audit',
      type: 'file',
      label: 'Credential Audit Ledger (8 Accounts)',
      content: {
        isPasswordAudit: true,
        title: 'Identity & Access Review — Credential Audit Ledger',
        targetUser: {
          name: 'Jordan Lee',
          title: 'Senior Systems Engineer',
          department: 'Cloud Platform Engineering',
          employeeId: 'EMP-7402',
        },
        auditDate: '2026-10-15',
        auditorName: 'Alex Mercer (Identity Security Operations)',
        overviewSummary:
          'Audit of enterprise and partner credentials maintained by Jordan Lee across corporate, cloud, database, and local administrative environments. All cross-referenced against offline simulated breach intelligence and known credential dictionary attacks.',
        accounts: [
          {
            id: 'acc-1',
            serviceName: 'Cloud Infrastructure Console (Apex Cloud / AWS Equivalent)',
            category: 'cloud',
            username: 'jordan.lee@corp.example',
            roleDescription: 'Full Cloud Infrastructure Administrator (Root/IAM Admin with compute, storage, and IAM rights)',
            passwordDisplay: 'Autumn2024!#Secure',
            passwordPattern: 'Predictable seasonal template (Capital + Season + Year + Symbol + Common Word)',
            passwordLength: 18,
            breachStatus: {
              isExposed: true,
              breachSource: '2024 CloudVendor Public Dump',
              details: 'Identical plaintext credential found in 2024 leaked credentials dataset.',
            },
            privilegeLevel: 'critical',
            mfaStatus: {
              enabled: false,
              type: 'none',
              label: 'None (Disabled)',
            },
            reuseLink: {
              isReused: true,
              reusedWithServiceId: 'acc-4',
              reusedWithServiceName: 'Logistics Partner Extranet',
              warning: 'Identical password reused on external Third-Party Logistics Portal (acc-4).',
            },
            requiresRemediation: true,
            remediationReason:
              'Critical Cloud Admin account with password actively exposed in public dumps, reused on an external vendor portal, and unprotected by MFA.',
            lastChangedDate: '2024-09-22',
            notes: 'Permits complete takeover of production cloud environments and customer workloads.',
          },
          {
            id: 'acc-2',
            serviceName: 'Corporate SSO & Email Portal (Apex Workspace)',
            category: 'identity',
            username: 'jordan.lee@corp.example',
            roleDescription: 'Primary corporate identity, internal email, and SSO identity provider',
            passwordDisplay: 'k9#mP$2vL&8qR*5w',
            passwordPattern: 'High-entropy machine-generated random alphanumeric with symbols (Generated by Password Manager)',
            passwordLength: 16,
            breachStatus: {
              isExposed: false,
              details: 'Zero matches across all simulated dark web and credential leak databases.',
            },
            privilegeLevel: 'high',
            mfaStatus: {
              enabled: true,
              type: 'fido2',
              label: 'Enforced (Hardware FIDO2 Security Key / Passkey)',
            },
            reuseLink: {
              isReused: false,
              warning: 'Unique credential. No cross-account reuse detected.',
            },
            requiresRemediation: false,
            remediationReason:
              'Unique high-entropy credential with zero breach exposure, protected by phishing-resistant hardware FIDO2 authentication.',
            lastChangedDate: '2026-06-10',
            notes: 'Compliant with SEC-301 standards. No remediation needed.',
          },
          {
            id: 'acc-3',
            serviceName: 'Production Database Bastion (PostgreSQL Cluster)',
            category: 'database',
            username: 'jlee-dba-bastion',
            roleDescription: 'Production Database Administrator Access (Customer PII and financial tables)',
            passwordDisplay: 'P@ssw0rd_Apex2023',
            passwordPattern: 'Dictionary base with predictable leetspeak substitutions, company name, and calendar year',
            passwordLength: 17,
            breachStatus: {
              isExposed: true,
              breachSource: 'Public Credential Compilations (ComboList v4)',
              details: 'Found across 12 public credential collections; matches known dictionary-rule attack masks.',
            },
            privilegeLevel: 'critical',
            mfaStatus: {
              enabled: true,
              type: 'totp',
              label: 'Enforced (Authenticator App TOTP)',
            },
            reuseLink: {
              isReused: false,
              warning: 'Unique to database cluster.',
            },
            requiresRemediation: true,
            remediationReason:
              'Highly predictable dictionary pattern found in multiple breach compilations. While TOTP reduces immediate risk, a compromised database password violates baseline security policy.',
            lastChangedDate: '2023-11-04',
            notes: 'Must be rotated to a 20+ character random secret stored in the enterprise secrets vault.',
          },
          {
            id: 'acc-4',
            serviceName: 'Third-Party Logistics Partner Extranet (FleetTrack)',
            category: 'vendor',
            username: 'jlee-external',
            roleDescription: 'External partner shipping tracking and logistics inventory dispatch',
            passwordDisplay: 'Autumn2024!#Secure',
            passwordPattern: 'Predictable seasonal template (Capital + Season + Year + Symbol + Common Word)',
            passwordLength: 18,
            breachStatus: {
              isExposed: true,
              breachSource: '2024 CloudVendor Public Dump',
              details: 'Exposed in public leak dumps alongside Jordan Lee username.',
            },
            privilegeLevel: 'medium',
            mfaStatus: {
              enabled: false,
              type: 'none',
              label: 'None (Disabled by Vendor)',
            },
            reuseLink: {
              isReused: true,
              reusedWithServiceId: 'acc-1',
              reusedWithServiceName: 'Cloud Infrastructure Console',
              warning: 'Shares identical password with critical Cloud Infrastructure Console (acc-1).',
            },
            requiresRemediation: true,
            remediationReason:
              'Credential reuse with root cloud infrastructure creates an immediate lateral attack vector from a low-security external partner site.',
            lastChangedDate: '2024-09-22',
            notes: 'Password reuse between external suppliers and core cloud infrastructure is a critical policy violation.',
          },
          {
            id: 'acc-5',
            serviceName: 'Internal Knowledge Base & Wiki (DocuWiki Enterprise)',
            category: 'internal',
            username: 'jordan.lee',
            roleDescription: 'Standard employee documentation authoring and engineering runbooks',
            passwordDisplay: 'correct-horse-battery-staple-77',
            passwordPattern: 'Multi-word random diceware passphrase with numeric suffix (33 characters, high entropy)',
            passwordLength: 33,
            breachStatus: {
              isExposed: false,
              details: 'Zero matches in simulated breach feeds.',
            },
            privilegeLevel: 'low',
            mfaStatus: {
              enabled: true,
              type: 'totp',
              label: 'Enforced (Authenticator App TOTP)',
            },
            reuseLink: {
              isReused: false,
              warning: 'Unique passphrase.',
            },
            requiresRemediation: false,
            remediationReason:
              'High-entropy 33-character passphrase, no breach matches, unique to this service, and protected by TOTP MFA.',
            lastChangedDate: '2026-04-18',
            notes: 'Exemplifies sound passphrase design without artificial character-substitution constraints.',
          },
          {
            id: 'acc-6',
            serviceName: 'Corporate Code Repository & CI/CD (GitLab Enterprise)',
            category: 'developer',
            username: 'jordan-dev',
            roleDescription: 'Senior Developer with write/merge permissions to core platform repositories and build pipelines',
            passwordDisplay: 'WinterSnow2025!!',
            passwordPattern: 'Predictable seasonal word + calendar year + punctuation pattern',
            passwordLength: 16,
            breachStatus: {
              isExposed: true,
              breachSource: '2025 DevTools Leak Archive',
              details: 'Matches entries in recent developer ecosystem credential archive.',
            },
            privilegeLevel: 'high',
            mfaStatus: {
              enabled: true,
              type: 'sms',
              label: 'Enforced (SMS OTP Code)',
            },
            reuseLink: {
              isReused: false,
              warning: 'Unique to GitLab.',
            },
            requiresRemediation: true,
            remediationReason:
              'Exposed in recent breach archive, follows predictable seasonal pattern, and relies on SMS OTP which is vulnerable to SIM-swap and interception.',
            lastChangedDate: '2025-01-05',
            notes: 'Must be rotated to a password-manager generated credential and upgraded to hardware or TOTP MFA.',
          },
          {
            id: 'acc-7',
            serviceName: 'Local Workstation Administration (Laptop WS-0842)',
            category: 'system',
            username: 'jlee-ws01\\localadmin',
            roleDescription: 'Local Administrator privileges on corporate engineering laptop',
            passwordDisplay: 'Tr0ub4dor&3',
            passwordPattern: 'Famous dictionary substitution pattern from public security literature',
            passwordLength: 11,
            breachStatus: {
              isExposed: true,
              breachSource: 'Top 1,000 Common Passwords & Wordlists',
              details: 'Present in universally known dictionary wordlists and automated brute-force dictionaries.',
            },
            privilegeLevel: 'high',
            mfaStatus: {
              enabled: false,
              type: 'none',
              label: 'None (Local OS SAM Database — No MFA)',
            },
            reuseLink: {
              isReused: false,
              warning: 'Unique to this workstation.',
            },
            requiresRemediation: true,
            remediationReason:
              'Standard dictionary wordlist password on a local admin account without MFA protection. If an attacker gains network or console access, local privilege escalation is trivial.',
            lastChangedDate: '2024-02-14',
            notes: 'Should be enrolled in automated Local Administrator Password Solution (LAPS) with rotating random secrets.',
          },
          {
            id: 'acc-8',
            serviceName: 'Corporate Cafeteria & Wellness Perks (BiteReward App)',
            category: 'perks',
            username: 'jordan.lee.perks',
            roleDescription: 'Cafeteria meal ordering, gym reimbursement points, and social perk badges',
            passwordDisplay: 'gX7!bN2@vK9#mQ4$',
            passwordPattern: 'High-entropy machine-generated random alphanumeric with symbols (Generated by Password Manager)',
            passwordLength: 16,
            breachStatus: {
              isExposed: false,
              details: 'Zero matches in simulated breach feeds.',
            },
            privilegeLevel: 'low',
            mfaStatus: {
              enabled: true,
              type: 'sms',
              label: 'Optional / Email Verification Code',
            },
            reuseLink: {
              isReused: false,
              warning: 'Unique credential. No cross-account reuse detected.',
            },
            requiresRemediation: false,
            remediationReason:
              'Unique high-entropy random password, zero breach exposure, and non-sensitive low-privilege service.',
            lastChangedDate: '2026-08-01',
            notes: 'Good credential isolation. Acceptable configuration.',
          },
        ],
      } as unknown as Record<string, unknown>,
    },
    {
      id: 'ev-password-policy',
      type: 'policy',
      label: 'Enterprise Credential & MFA Standard (SEC-301)',
      content: {
        title: 'SOP SEC-301: Enterprise Credential Security & Authentication Standard',
        code: 'SEC-301-REV3',
        category: 'IDENTITY & ACCESS MANAGEMENT STANDARD',
        effectiveDate: '2026-02-01',
        classification: 'INTERNAL SECURITY STANDARD',
        rules: [
          'Rule 1 (Password Uniqueness & Prohibition of Cross-Service Reuse): Passwords must never be shared across accounts. Reusing credentials between low-security external partner sites and internal corporate or administrative services creates critical lateral movement vectors.',
          'Rule 2 (Predictability vs. Artificial Complexity): Password length and entropy matter far more than character-class complexity rules. Predictable seasonal templates (e.g. "Spring2026!"), leetspeak substitutions (e.g. "P@ssw0rd"), and company name patterns are systematically tested by automated dictionary-mask tools and do not provide genuine protection.',
          'Rule 3 (Breach Exposure Mandatory Remediation): Any password detected in public or simulated credential breach dumps is compromised and must be replaced immediately, regardless of when it was last changed or how long it is.',
          'Rule 4 (Multi-Factor Authentication Requirements): All administrative, cloud infrastructure, and corporate identity access must enforce Multi-Factor Authentication. FIDO2 hardware keys or app-based TOTP are required for administrative roles; SMS OTP should be upgraded due to SIM-swap vulnerabilities.',
          'Rule 5 (Modern Password Management): Employees must use approved enterprise password managers to generate long, unique, high-entropy passwords for all services. Arbitrary periodic calendar rotations (e.g. every 30 days) are discouraged because they induce predictable incremental password patterns.',
        ],
      } as unknown as Record<string, unknown>,
    },
  ],

  // ── Steps ──────────────────────────────────────────────────────────────────
  steps: [
    // Step 1: Flag accounts requiring remediation (40 pts, flag-selection, partial credit allowed)
    {
      id: 'step-identify-accounts',
      prompt:
        'Review the eight accounts in the Credential Audit Ledger. Flag the accounts that require credential replacement or security remediation due to breach exposure, password reuse, or predictable patterns.',
      interaction: 'flag-selection',
      items: [
        {
          id: 'acc-1',
          label: 'Cloud Infrastructure Console — Cloud Admin (Autumn2024!#Secure, Reused, Exposed, No MFA)',
        },
        {
          id: 'acc-2',
          label: 'Corporate SSO & Email Portal — Identity Provider (k9#mP$2vL&8qR*5w, Unique Random, 0 Breaches, FIDO2)',
        },
        {
          id: 'acc-3',
          label: 'Production Database Bastion — DB Admin (P@ssw0rd_Apex2023, Leetspeak Dictionary, Exposed, TOTP)',
        },
        {
          id: 'acc-4',
          label: 'Third-Party Logistics Partner Extranet — External Vendor (Autumn2024!#Secure, Reused with Cloud Admin, Exposed, No MFA)',
        },
        {
          id: 'acc-5',
          label: 'Internal Knowledge Base & Wiki — Documentation (correct-horse-battery-staple-77, 33-char Passphrase, 0 Breaches, TOTP)',
        },
        {
          id: 'acc-6',
          label: 'Corporate Code Repository & CI/CD — Developer (WinterSnow2025!!, Seasonal Pattern, Exposed, SMS OTP)',
        },
        {
          id: 'acc-7',
          label: 'Local Workstation Administration — Local Admin (Tr0ub4dor&3, Wordlist Dictionary, Exposed, No MFA)',
        },
        {
          id: 'acc-8',
          label: 'Corporate Cafeteria & Wellness Perks — Perks App (gX7!bN2@vK9#mQ4$, Unique Random, 0 Breaches, Low Privilege)',
        },
      ],
      answerKey: {
        'acc-1': true,
        'acc-2': false,
        'acc-3': true,
        'acc-4': true,
        'acc-5': false,
        'acc-6': true,
        'acc-7': true,
        'acc-8': false,
      },
      pointValue: 40,
      partialCreditAllowed: true,
    },

    // Step 2: Prioritize Most Urgent Remediation (30 pts, single-choice)
    {
      id: 'step-prioritize-urgency',
      prompt:
        'Evaluating the accounts requiring remediation, which single account presents the most critical, immediate operational risk and must be remediated first?',
      interaction: 'single-choice',
      items: [
        {
          id: 'prio-acc1',
          label:
            'Cloud Infrastructure Console (acc-1) — Critical Cloud Admin account with password confirmed exposed in public dumps, reused on an external vendor portal, and unprotected by MFA.',
        },
        {
          id: 'prio-acc3',
          label:
            'Production Database Bastion (acc-3) — Production DB admin access exposed in breaches, though immediate exploitation is mitigated by active TOTP MFA.',
        },
        {
          id: 'prio-acc6',
          label:
            'Corporate Code Repository (acc-6) — Senior developer access exposed in dev-tools dump, but currently guarded by mandatory SMS OTP.',
        },
        {
          id: 'prio-acc7',
          label:
            'Local Workstation Administration (acc-7) — Local laptop admin account with a dictionary password, requiring physical device access or existing network footholds to exploit.',
        },
      ],
      answerKey: { chosen: 'prio-acc1' },
      pointValue: 30,
      partialCreditAllowed: false,
    },

    // Step 3: Choose comprehensive hygiene & remediation plan (30 pts, single-choice)
    {
      id: 'step-hygiene-plan',
      prompt:
        'What is the most effective and defensible long-term credential security and hygiene plan for Jordan Lee and the enterprise under SEC-301?',
      interaction: 'single-choice',
      items: [
        {
          id: 'plan-password-manager-mfa',
          label:
            'Deploy an enterprise password manager to generate and store unique, high-entropy passwords for all services, immediately replace all exposed and reused credentials, and mandate phishing-resistant or app-based MFA across all corporate and administrative systems.',
        },
        {
          id: 'plan-frequent-rotation-calendar',
          label:
            'Enforce mandatory 30-day password expiration policies across all systems without a password manager, instructing the employee to increment trailing numbers each month to maintain memory recall.',
        },
        {
          id: 'plan-single-complex-master',
          label:
            'Create a single 30-character master passphrase that exceeds standard length requirements and reuse it across all cloud, database, and vendor accounts so the employee never forgets it.',
        },
        {
          id: 'plan-character-substitution-policy',
          label:
            'Mandate strict character-class rules requiring at least one symbol, capital, and number via leetspeak substitutions (e.g. replacing "a" with "@" or "e" with "3"), relying on complex patterns instead of MFA.',
        },
      ],
      answerKey: { chosen: 'plan-password-manager-mfa' },
      pointValue: 30,
      partialCreditAllowed: false,
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Do not judge password security solely by character variety or length. A 17- or 18-character password using predictable seasonal templates (like "Autumn2024!#Secure") or company names found in breach dumps is far less secure than an unbreached random credential or a long, unique passphrase.',
    'Cross-reference credentials between systems: pay close attention to accounts that share identical passwords. When a low-security external partner site shares credentials with an administrative cloud console, a breach of the partner immediately compromises the cloud.',
    'When prioritizing remediation, weigh the severity of impact and the presence of protective barriers. A compromised root cloud administrator account with zero MFA and active breach exposure poses a catastrophic immediate risk compared to an account guarded by active TOTP or a low-privilege service.',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'password-auditing',
    'credential-hygiene',
    'breach-exposure-analysis',
    'mfa-assessment',
    'risk-prioritization',
  ],

  // ── Feedback Explanations ──────────────────────────────────────────────────
  passThreshold: 70,
  successExplanation:
    'Outstanding credential audit! You demonstrated that effective account security is not about artificial character-substitution rules or invented "strength scores," but about eliminating credential reuse, rotating breach-exposed secrets, generating unique high-entropy passwords with a password manager, and enforcing robust multi-factor authentication (MFA). By prioritizing the Cloud Infrastructure Console (acc-1), you neutralized the single catastrophic path allowing immediate unauthorized takeover of core cloud assets.',
  failureExplanation:
    'In account security, length and character symbols alone do not prevent credential attacks. Accounts with known breach exposures, predictable seasonal/company patterns, cross-service password reuse, or missing MFA require urgent remediation. Re-examine the Credential Audit Ledger against SOP SEC-301 to distinguish safe accounts (like acc-2, acc-5, and acc-8) from compromised credentials.',
};
