// ============================================================
// Challenge: cc-ph-03 — Spear-Phish Campaign
// Room: Phishing Defense | Difficulty: Advanced
//
// Scenario:
//   The user plays the role of Jordan Ellis, Principal Infrastructure
//   Engineer at Veridian Logistics. They receive three incoming emails
//   in a simulated inbox:
//     1. A legitimate internal IT SSO maintenance notification.
//     2. A legitimate weekly cluster latency report from approved
//        monitoring vendor MetricsCloud.
//     3. A targeted spear-phishing email masquerading as VP of
//        Infrastructure Dr. Dan Kim, claiming an urgent zero-day
//        vulnerability requires applying an unverified hotfix from
//        a deceptive link and entering corporate credentials.
//
// All domains use RFC 2606 .example TLDs.
// All IPs use RFC 5737 documentation addresses.
// All organizations and personas are entirely fictional.
// ============================================================

import type { Challenge } from '../../types';

export const challengeCC_PH_03: Challenge = {
  id: 'cc-ph-03',
  roomId: 'phishing',
  difficulty: 'advanced',
  title: 'Spear-Phish Campaign',
  briefing:
    'You are Jordan Ellis, Principal Infrastructure Engineer at Veridian Logistics. Three incoming emails have arrived in your inbox today: an internal IT SSO maintenance schedule, an automated cluster latency report from cloud vendor MetricsCloud, and an urgent zero-day patch advisory purportedly from VP of Infrastructure Dr. Dan Kim. Investigate all three messages, evaluate link destinations and headers, cross-reference the internal engineering directory and patch policy CHG-204, and stop the targeted attack before credentials or cluster access are compromised.',

  // ── Evidence ──────────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-inbox',
      type: 'email',
      label: 'Simulated Inbox (3 Emails)',
      content: {
        isInbox: true,
        inboxOwner: 'j.ellis@veridian-logistics.example (Principal Infrastructure Engineer)',
        emails: [
          {
            id: 'email-1',
            sender_display: 'IT Infrastructure Operations',
            sender_address: 'it-ops@veridian-logistics.example',
            to: 'engineering-all@veridian-logistics.example',
            date: 'Tue, 29 Sep 2026 09:15:00 +0000',
            subject: '[Scheduled Maintenance] Central SSO Gateway Rolling Restart (Oct 01)',
            preview: 'Scheduled maintenance for SSO gateway on Sunday 02:00 UTC (INFRA-8821)...',
            category: 'Internal Notice',
            body:
              'Engineering Team,\n\nPlease be advised that Central Identity Services will perform a rolling restart of the staging and production SSO authentication gateways on Sunday, October 01 between 02:00 and 03:00 UTC.\n\nSummary of Impact:\n- Active web sessions will experience a brief 10-15 second reconnect window.\n- CLI authentication tokens and automated service accounts will not be affected.\n- Tracking ticket: INFRA-8821\n\nReference documentation and the rollback procedure are documented on our internal engineering wiki:\nhttps://wiki.veridian-logistics.example/kb/sso-maintenance\n\nIf you have concerns regarding critical pipeline runs during this window, please reach out in #it-ops or contact ext. 2200.\n\nIT Infrastructure Operations\nVeridian Logistics',
            link: {
              displayedText: 'https://wiki.veridian-logistics.example/kb/sso-maintenance',
              actualDestination: 'https://wiki.veridian-logistics.example/kb/sso-maintenance',
            },
            headers: {
              returnPath: '<ops-bounce@veridian-logistics.example>',
              receivedFrom: 'mail-internal.veridian-logistics.example (198.51.100.10)',
              spf: 'PASS (internal mail gateway)',
              dkim: 'PASS for domain veridian-logistics.example',
              dmarc: 'PASS (p=reject, aligned with veridian-logistics.example)',
              isExternal: false,
            },
          },
          {
            id: 'email-2',
            sender_display: 'MetricsCloud Notifications',
            sender_address: 'alerts@metricscloud-alerts.example',
            to: 'j.ellis@veridian-logistics.example',
            date: 'Tue, 29 Sep 2026 10:40:22 +0000',
            subject: '[MetricsCloud] Weekly Cluster Ingress Latency Report: us-west-prod',
            preview: 'Weekly APM report: P99 latency 42ms (within SLA), 0 unhandled 5xx errors...',
            category: 'Vendor Report',
            body:
              'Hi Jordan,\n\nHere is your automated weekly cluster latency performance summary for us-west-prod:\n\n- Ingress Requests: 4.82M\n- P99 Latency: 42ms (Target: < 50ms — SLA Met)\n- Unhandled 5xx Errors: 0\n- Worker Nodes Healthy: 24/24\n\nReview the full historical latency breakdown and error distribution in your MetricsCloud APM portal:\nhttps://app.metricscloud-alerts.example/dashboards/latency\n\nTo configure threshold alerts or adjust team notification frequencies, manage your account preferences in the portal.\n\nMetricsCloud Automated APM Services\nAccount: Veridian Logistics (Contract V-109)',
            link: {
              displayedText: 'https://app.metricscloud-alerts.example/dashboards/latency',
              actualDestination: 'https://app.metricscloud-alerts.example/dashboards/latency',
            },
            headers: {
              returnPath: '<bounces@metricscloud-alerts.example>',
              receivedFrom: 'outbound-relay4.metricscloud-alerts.example (203.0.113.50)',
              spf: 'PASS (sender IP matches metricscloud-alerts.example)',
              dkim: 'PASS for domain metricscloud-alerts.example',
              dmarc: 'PASS (p=quarantine, aligned with metricscloud-alerts.example)',
              isExternal: true,
            },
          },
          {
            id: 'email-3',
            sender_display: 'Dr. Dan Kim — VP of Infrastructure',
            sender_address: 'd.kim-exec@veridian-cloudops.example',
            to: 'j.ellis@veridian-logistics.example',
            date: 'Tue, 29 Sep 2026 11:25:48 +0000',
            subject: 'CRITICAL: Urgent Zero-Day Patch Required for Kubernetes Ingress Controller',
            preview: 'Immediate action needed: CVE-2026-44910 zero-day hotfix before 12:30 audit...',
            category: 'Executive Urgent',
            body:
              'Jordan,\n\nOur third-party scanning team just confirmed an active zero-day vulnerability (CVE-2026-44910) affecting our external Kubernetes ingress controllers on us-west-prod. Exploitation allows unauthenticated remote code execution and cluster privilege escalation.\n\nBecause you lead cluster operations, I need you to apply the emergency hotfix configuration immediately before our 12:30 PM compliance audit with our enterprise partners.\n\nReview the advisory notes and download the signed patch manifest from our emergency mirror:\nhttps://k8s-patch.veridian-logistics.example/advisory/cve-2026-44910\n\nYou will need to authenticate with your corporate SSO credentials on the mirror gateway to access the raw YAML manifest, then execute `kubectl apply -f patch.yaml` on us-west-prod.\n\nI am in closed budget reviews until 2:00 PM and cannot take calls, so do not wait for the standard Change Advisory Board (CAB) review. Apply the fix and reply once completed.\n\nDr. Dan Kim\nVP of Infrastructure & Platform Engineering\nVeridian Logistics',
            link: {
              displayedText: 'https://k8s-patch.veridian-logistics.example/advisory/cve-2026-44910',
              actualDestination: 'https://veridian-k8s-patch.attacker-portal.example/login?redirect=manifest',
            },
            headers: {
              returnPath: '<bounce@veridian-cloudops.example>',
              receivedFrom: 'relay08.external-cloud.example (198.51.100.210)',
              spf: 'PASS (sender IP matches veridian-cloudops.example)',
              dkim: 'PASS for domain veridian-cloudops.example',
              dmarc: 'PASS for domain veridian-cloudops.example',
              isExternal: true,
            },
          },
        ],
      },
    },
    {
      id: 'ev-directory',
      type: 'policy',
      label: 'IT Directory & Emergency Patch Policy',
      content: {
        type: 'directory',
        company: 'Veridian Logistics Internal Directory & Engineering Protocol',
        employee: {
          name: 'Dr. Dan Kim',
          title: 'VP of Infrastructure & Platform Engineering',
          department: 'Engineering Leadership',
          officialEmail: 'd.kim@veridian-logistics.example',
          internalPhone: '+1 (555) 0192, Ext. 3100',
          officeLocation: 'HQ Building B, Suite 410',
          assistant: 'Sarah Lin (Ext. 3102, s.lin@veridian-logistics.example)',
          currentStatus: 'On-site — In Executive Budget Review (10:00 – 14:00)',
        },
        policy: {
          code: 'CHG-204',
          title: 'Production Infrastructure Emergency Patching & Change Policy',
          rules: [
            'All production Kubernetes configurations and hotfix patches must be committed to the internal GitOps repository (git.veridian-logistics.example). Applying manifests from external URLs or third-party download mirrors is strictly prohibited.',
            'Any emergency procedure bypassing the weekly Change Advisory Board (CAB) requires verbal dual-authorization with the VP of Engineering or on-call Incident Commander via internal phone extension.',
            'Approved corporate SaaS vendors are registered in the IT vendor catalog (e.g. MetricsCloud: metricscloud-alerts.example, Contract V-109). Corporate infrastructure services never solicit SSO passwords via email links.',
          ],
        },
      },
    },
    {
      id: 'ev-headers',
      type: 'log',
      label: 'Email Comparison Matrix',
      content: {
        rows: [
          { field: 'Email 1 (SSO Notice) From',        value: 'it-ops@veridian-logistics.example (Internal Verified)' },
          { field: 'Email 1 Destination',              value: 'https://wiki.veridian-logistics.example/kb/sso-maintenance (Matches internal domain)' },
          { field: 'Email 1 Auth',                     value: 'SPF PASS, DKIM PASS for veridian-logistics.example (Relay: 198.51.100.10)' },
          { field: 'Email 2 (MetricsCloud) From',      value: 'alerts@metricscloud-alerts.example (Approved Vendor Contract V-109)' },
          { field: 'Email 2 Destination',              value: 'https://app.metricscloud-alerts.example/dashboards/latency (Matches vendor domain)' },
          { field: 'Email 2 Auth',                     value: 'SPF PASS, DKIM PASS for metricscloud-alerts.example (Relay: 203.0.113.50)' },
          { field: 'Email 3 (K8s Patch) From',         value: 'd.kim-exec@veridian-cloudops.example (External domain; mismatch with directory)' },
          { field: 'Email 3 Displayed Link',           value: 'https://k8s-patch.veridian-logistics.example/advisory/cve-2026-44910' },
          { field: 'Email 3 Actual Destination',       value: 'https://veridian-k8s-patch.attacker-portal.example/login?redirect=manifest' },
          { field: 'Email 3 Auth',                     value: 'SPF PASS, DKIM PASS for veridian-cloudops.example (Relay: 198.51.100.210)' },
        ],
      },
    },
  ],

  // ── Steps ─────────────────────────────────────────────────────────────────
  //
  // Step 1 (30 pts): Classify all three emails (classification, 3 items = 10 pts each, partial credit)
  // Step 2 (40 pts): Select evidence supporting suspicious email (flag-selection, 8 items = 5 pts each, partial credit)
  // Step 3 (30 pts): Choose safe operational response (single-choice, no partial)
  //
  // Total: 100 pts. Pass threshold: 70.
  steps: [
    {
      id: 'step-classify',
      prompt:
        'Review the three incoming emails in the simulated inbox. Classify each message as either "Legitimate" or "Suspicious".',
      interaction: 'classification',
      partialCreditAllowed: true,
      pointValue: 30,
      items: [
        {
          id: 'email-1',
          label: 'Email 1: [Scheduled Maintenance] Central SSO Gateway Rolling Restart',
          options: ['Legitimate', 'Suspicious'],
        },
        {
          id: 'email-2',
          label: 'Email 2: [MetricsCloud] Weekly Cluster Ingress Latency Report: us-west-prod',
          options: ['Legitimate', 'Suspicious'],
        },
        {
          id: 'email-3',
          label: 'Email 3: CRITICAL: Urgent Zero-Day Patch Required for Kubernetes Ingress Controller',
          options: ['Legitimate', 'Suspicious'],
        },
      ],
      answerKey: {
        'email-1': 'Legitimate',
        'email-2': 'Legitimate',
        'email-3': 'Suspicious',
      },
    },
    {
      id: 'step-evidence',
      prompt:
        'Focus on Email 3 (the Kubernetes zero-day patch request). Select every piece of evidence that supports classifying it as a targeted spear-phishing attack. Do not select benign technical details.',
      interaction: 'flag-selection',
      partialCreditAllowed: true,
      pointValue: 40,
      items: [
        {
          id: 'flag-link-mismatch',
          label:
            'The displayed link (k8s-patch.veridian-logistics.example) masks a deceptive destination on an external domain (veridian-k8s-patch.attacker-portal.example)',
        },
        {
          id: 'flag-sender-mismatch',
          label:
            'The sender address (d.kim-exec@veridian-cloudops.example) does not match Dr. Dan Kim\'s official corporate email (d.kim@veridian-logistics.example) in the directory',
        },
        {
          id: 'flag-policy-violation',
          label:
            'The email demands applying an unverified hotfix from an external mirror and bypassing change control, violating emergency patch policy CHG-204',
        },
        {
          id: 'flag-credential-harvest',
          label:
            'The email directs the engineer to enter corporate SSO credentials on an external third-party portal to access a cluster configuration manifest',
        },
        {
          id: 'flag-coercive-urgency',
          label:
            'The message manufactures extreme urgency ("before our 12:30 PM client audit") while claiming the executive is unreachable to discourage verification',
        },
        {
          id: 'flag-cve-reference',
          label:
            'The email references a CVE vulnerability identifier (CVE-2026-44910)',
        },
        {
          id: 'flag-auth-pass',
          label:
            'The email headers show SPF, DKIM, and DMARC authentication passed for the sender domain (veridian-cloudops.example)',
        },
        {
          id: 'flag-kubectl-syntax',
          label:
            'The email references standard Kubernetes command-line syntax (kubectl apply -f)',
        },
      ],
      answerKey: {
        'flag-link-mismatch':     true,
        'flag-sender-mismatch':   true,
        'flag-policy-violation':  true,
        'flag-credential-harvest': true,
        'flag-coercive-urgency':  true,
        'flag-cve-reference':     false,
        'flag-auth-pass':         false,
        'flag-kubectl-syntax':    false,
      },
    },
    {
      id: 'step-response',
      prompt:
        'As the Principal Infrastructure Engineer, what is the safest and most effective response to this targeted spear-phish?',
      interaction: 'single-choice',
      partialCreditAllowed: false,
      pointValue: 30,
      items: [
        {
          id: 'resp-quarantine-report',
          label:
            'Quarantine the email without clicking the link, report the incident and deceptive URL to Security Operations (SOC), and verify Dr. Kim\'s status via internal extension 3100',
        },
        {
          id: 'resp-test-sandbox',
          label:
            'Open the link in an incognito window to inspect the patch manifest YAML in a sandbox, and deploy it if no malicious commands are visible',
        },
        {
          id: 'resp-reply-verify',
          label:
            'Reply directly to d.kim-exec@veridian-cloudops.example asking Dr. Kim to confirm the SHA-256 hash of the patch before deploying',
        },
        {
          id: 'resp-forward-team',
          label:
            'Forward the email to the entire devops-engineers mailing list asking if any other cluster admin has applied the CVE-2026-44910 hotfix',
        },
      ],
      answerKey: { chosen: 'resp-quarantine-report' },
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Compare the sender email domain of each message against the trusted company directory and approved vendor list. Legitimate internal services use veridian-logistics.example, while MetricsCloud alerts use their registered vendor domain.',
    'Inspect the link in Email 3 carefully. Does the actual destination match what is displayed in the text, and what domain will receive your credentials?',
    'Review emergency change policy CHG-204 in the directory tab. How must production cluster patches be sourced, and what should you do when an email demands an emergency exception?',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'spear-phishing-defense',
    'email-classification',
    'link-inspection',
    'incident-response',
    'cloud-security-policy',
  ],

  // ── Scoring ───────────────────────────────────────────────────────────────
  passThreshold: 70,

  // ── Explanations ─────────────────────────────────────────────────────────
  successExplanation:
    'Outstanding triage! You accurately classified all three emails, recognized the sophisticated spear-phishing attack, and applied the correct incident response protocol.\n\nWhy Email 3 is a targeted spear-phish:\n1. Link Masking: The text displayed k8s-patch.veridian-logistics.example, but the actual destination led to veridian-k8s-patch.attacker-portal.example—a credential harvesting site.\n2. Domain Mismatch: The sender used d.kim-exec@veridian-cloudops.example, which is completely outside Veridian Logistics\' official directory domain (veridian-logistics.example).\n3. Policy Violation: Policy CHG-204 mandates that all production hotfixes be committed to internal GitOps repositories, strictly forbidding external mirrors.\n4. Credential Harvesting: Solicits corporate SSO credentials under the guise of accessing a patch.\n5. Artificial Urgency & Isolation: Claims an impending 12:30 PM audit deadline while stating the VP is unreachable.\n\nWhy Emails 1 and 2 are legitimate:\n- Email 1 (SSO Notice) originates from internal IT (it-ops@veridian-logistics.example), links directly to the internal wiki with no redirects, references an authentic ticket (INFRA-8821), and asks for no credentials.\n- Email 2 (MetricsCloud) originates from verified vendor domain alerts@metricscloud-alerts.example (contract V-109 in IT catalog), passes vendor authentication, links directly to the vendor APM dashboard, and requests no sensitive actions.\n\nWhy distractors are not evidence of fraud:\n- Citing a CVE (CVE-2026-44910) and using kubectl syntax are standard in technical discussions and weaponized by attackers to create false credibility, but the syntax itself is not evidence of fraud.\n- Passing SPF/DKIM/DMARC for veridian-cloudops.example only proves the attacker configured authentication on their own domain; it does not prove the sender is Dr. Dan Kim.',

  failureExplanation:
    'Triaging targeted spear-phishing requires contrasting multiple messages and cross-referencing trusted reference systems.\n\nAnalysis of the three emails:\n- Email 1 (Legitimate): Standard internal IT maintenance notice originating from it-ops@veridian-logistics.example with valid internal authentication and links pointing to the company wiki.\n- Email 2 (Legitimate): Automated telemetry digest from approved vendor MetricsCloud (metricscloud-alerts.example, Contract V-109) linking directly to the monitoring portal without credential requests.\n- Email 3 (Suspicious Spear-Phish): A targeted attack impersonating VP Dr. Dan Kim. Key indicators of fraud included: (1) lookalike external sender domain (veridian-cloudops.example); (2) masked link destination routing to attacker-portal.example; (3) credential-harvesting prompt for corporate SSO login; (4) violation of GitOps patch policy CHG-204; and (5) manufactured audit urgency with executive unavailability.\n\nKey takeaways:\n- Attackers frequently reference real technical terms (CVE identifiers, kubectl commands) and configure valid SPF/DKIM on domains they own. These technical details are not evidence of fraud or safety.\n- Always quarantine suspected attacks, report deceptive URLs to security, and verify requests using internal directory extensions.',

  shuffleItems: false,
};
