// ============================================================
// CyberCampus — Lightweight Challenge & Room Metadata Registry
// Source of truth for room lists, dashboard, portfolio, and campus navigation.
// Does NOT import heavy evidence files, raster assets, or evaluator logic.
// ============================================================

import type { Room, Challenge, ChallengeMetadata } from '../types';
export type { ChallengeMetadata };

export const ALL_CHALLENGES_METADATA: ChallengeMetadata[] = [
  {
    "id": "cc-ph-01",
    "roomId": "phishing",
    "difficulty": "beginner",
    "title": "The Suspicious Invoice",
    "briefing": "You work in accounts payable at Veridian Logistics. An invoice email just arrived for $8,400 from \"Apex Stationery Ltd.\" — a vendor you don't recognise. Your manager is travelling and cannot be reached. Examine the email carefully before deciding what to do.",
    "skills": [
      "email-header-analysis",
      "phishing-detection",
      "link-inspection"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-ph-02",
    "roomId": "phishing",
    "difficulty": "intermediate",
    "title": "CEO Fraud",
    "briefing": "You are a senior finance associate at Veridian Logistics. An urgent email thread arrives from someone identifying as CEO Victoria Sterling, who is travelling in Tokyo. She requests an immediate $42,500 wire transfer for a confidential acquisition and insists on bypassing standard verification. Investigate the email conversation, directory records, and headers before deciding how to respond.",
    "skills": [
      "business-email-compromise",
      "social-engineering-defense",
      "out-of-band-verification",
      "email-header-analysis"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-ph-03",
    "roomId": "phishing",
    "difficulty": "advanced",
    "title": "Spear-Phish Campaign",
    "briefing": "You are Jordan Ellis, Principal Infrastructure Engineer at Veridian Logistics. Three incoming emails have arrived in your inbox today: an internal IT SSO maintenance schedule, an automated cluster latency report from cloud vendor MetricsCloud, and an urgent zero-day patch advisory purportedly from VP of Infrastructure Dr. Dan Kim. Investigate all three messages, evaluate link destinations and headers, cross-reference the internal engineering directory and patch policy CHG-204, and stop the targeted attack before credentials or cluster access are compromised.",
    "skills": [
      "spear-phishing-defense",
      "email-classification",
      "link-inspection",
      "incident-response",
      "cloud-security-policy"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-so-01",
    "roomId": "secops",
    "difficulty": "beginner",
    "title": "Alert Triage",
    "briefing": "You are a new Tier 1 SOC Analyst at Veridian Logistics. Eight security alerts have accumulated in the unassigned queue during the morning shift transition. Review each alert alongside the shift handover notes and approved maintenance schedule. Classify each alert as either \"Investigate\" or \"Dismiss as explained activity\", then determine the safest next step for the most critical incident.",
    "skills": [
      "alert-triage",
      "siem-investigation",
      "incident-classification",
      "containment-strategy",
      "change-management-correlation"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-so-02",
    "roomId": "secops",
    "difficulty": "intermediate",
    "title": "The 3am Login",
    "briefing": "At 03:15 UTC, the SOC SIEM flagged an off-hours sign-in and IAM key creation on the account of Senior DBA Niall Gallagher (n.gallagher@veridian-logistics.example). Niall is currently on the scheduled secondary on-call rotation for an ongoing database cluster migration between Ireland (eu-west-1) and Frankfurt (eu-central-1). Review the multi-system authentication timeline and user baseline profile. Identify the genuine technical anomalies, distinguish verified facts from unproven hypotheses, and determine the safest, most proportionate containment response.",
    "skills": [
      "log-timeline-analysis",
      "mfa-fatigue-detection",
      "fact-vs-hypothesis",
      "device-posture-assessment",
      "proportionate-incident-response"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-so-03",
    "roomId": "secops",
    "difficulty": "advanced",
    "title": "Incident Response Timeline",
    "briefing": "At 18:15 UTC, the SOC received high-severity alerts indicating active data exfiltration and log tampering on the public customer tracking portal (tracking.veridian-logistics.example). You have collected 11 multi-system log artifacts from edge WAF, host EDR, network firewalls, Active Directory, and database servers. The ingested telemetry is currently unsorted. Correlate the timestamps and event details across systems, reconstruct the attack chain in chronological order, determine the most likely initial access vector, and decide on the critical containment and preservation response.",
    "skills": [
      "incident-timeline-reconstruction",
      "multi-source-log-correlation",
      "initial-access-analysis",
      "attack-chain-mapping",
      "incident-containment-and-preservation"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-nw-01",
    "roomId": "network",
    "difficulty": "beginner",
    "title": "The Open Port",
    "briefing": "You are reviewing an automated network exposure audit for web-gateway-01.veridian-logistics.example (198.51.100.80), an Internet-facing edge gateway server. The audit lists 8 active listening services, their socket bindings, reachability, and operational context. Review the exposure report alongside corporate Network Security Standard NET-101. Identify which services present an unacceptable risk requiring remediation, evaluate their exposure posture, and determine the safest remediation strategy. Remember: a port number alone does not determine risk—service configuration and reachability matter.",
    "skills": [
      "network-exposure-analysis",
      "port-and-service-auditing",
      "least-privilege-network-binding",
      "perimeter-security-controls",
      "insecure-protocol-remediation"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-nw-02",
    "roomId": "network",
    "difficulty": "intermediate",
    "title": "Firewall Rule Audit",
    "briefing": "You are performing a scheduled firewall audit on perimeter appliance fw-perimeter-01 at Veridian Logistics. The security team has provided the active ordered rule set alongside the enterprise network zone architecture, public Virtual IP (VIP) mappings, and change management tickets. Review the rules to detect overly broad access grants, shadowed configurations resulting from rule order, and redundant entries. Then analyze the potential security impact under the firewall’s post-DNAT inspection model and construct a least-privilege replacement rule.",
    "skills": [
      "firewall-rule-auditing",
      "rule-order-shadowing-analysis",
      "least-privilege-firewall-scoping",
      "network-segmentation-verification",
      "change-management-hygiene"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-nw-03",
    "roomId": "network",
    "difficulty": "advanced",
    "title": "Packet Trace Analysis",
    "briefing": "Security Operations detected suspicious outbound volume spikes originating from the Corporate LAN subnet. You are assigned to inspect a 36-packet capture recorded on core switch sw-core-01. Review network protocols, query patterns, and host behaviors to identify the compromised machine, determine the exfiltration technique, and calculate the volume of data exfiltrated through covert channels.",
    "skills": [
      "packet-trace-investigation",
      "dns-tunneling-detection",
      "covert-channel-analysis",
      "exfiltration-volume-calculation",
      "network-containment-protocol"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-df-01",
    "roomId": "forensics",
    "difficulty": "beginner",
    "title": "Deleted File Recovery",
    "briefing": "Security Operations received notification of a sensitive customer database leak on an external paste site. Forensic investigators acquired a bit-stream physical image (E01) of a departed financial analyst’s laptop (ws-fin-09). Inspect the recovered file tree, analyze metadata, timestamps, and recovered file content previews to identify the exfiltrated dataset, determine the forensic evidence confirming the leak, and select the correct evidence-preservation protocol.",
    "skills": [
      "filesystem-forensics",
      "deleted-file-recovery",
      "metadata-timestamp-analysis",
      "evidence-preservation",
      "chain-of-custody"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-df-02",
    "roomId": "forensics",
    "difficulty": "intermediate",
    "title": "Browser History Reconstruction",
    "briefing": "Management received an anonymous tip alleging that Senior Logistics Planner Claire Renaud browsed competitor intelligence sites and exfiltrated proprietary corporate route data via an external file locker during a blackout period. Investigators extracted the workstation browser history (History SQLite table) from ws-ops-14.veridian-logistics.example. Claire disputes the allegations, asserting she never accessed the competitor site and was offline during the alleged off-hours timeframe. Correlate the 25 browser history records against the company’s NTP-synchronized forward proxy logs and workstation power telemetry. Distinguish confirmed facts from provisional hypotheses: identify corroborated network visits, evaluate the SQLite timestamp sequencing anomaly alongside benign possibilities (such as delayed sync or import) and telemetry inconsistencies (sleep state and proxy coverage limits), reconstruct the corroborated upload sequence, and formulate a defensible forensic conclusion.",
    "skills": [
      "browser-history-forensics",
      "timeline-reconstruction",
      "proxy-log-correlation",
      "anti-forensics-tampering-detection",
      "evidence-preservation"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-df-03",
    "roomId": "forensics",
    "difficulty": "advanced",
    "title": "Steganography Detection",
    "briefing": "During an internal communications audit, security operations recovered three lossless PNG image files from a workstation suspected of being used for unauthorized data movement. An anonymous tip alleged that confidential warehouse transit schedules were being concealed inside innocent-looking images. Investigators must analyze the three PNG exhibits, recognize that file sizes, standard metadata, and visual appearances alone do not prove or disprove steganography, execute spatial-domain least-significant-bit (LSB) extraction on the actual raster data, evaluate whether any recovered bitstream contains valid framing and integrity checksums, and formulate a defensible forensic reporting and preservation action.",
    "skills": [
      "steganography-detection",
      "lsb-extraction",
      "bitplane-analysis",
      "evidence-preservation",
      "forensic-reporting"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-pr-01",
    "roomId": "privacy",
    "difficulty": "beginner",
    "title": "Password Audit",
    "briefing": "During an identity and access security review at Apex Global, the security team conducted an internal credential audit for Jordan Lee, Senior Systems Engineer. Investigators cross-referenced eight active account records against fictional breach compilations, reuse patterns, credential predictability, and multi-factor authentication (MFA) enforcement. Learners must review the ledger, recognize that password length and character complexity alone do not guarantee security, identify which accounts require immediate remediation, prioritize the single most urgent vulnerability, and formulate an effective account-protection plan.",
    "skills": [
      "password-auditing",
      "credential-hygiene",
      "breach-exposure-analysis",
      "mfa-assessment",
      "risk-prioritization"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-pr-02",
    "roomId": "privacy",
    "difficulty": "intermediate",
    "title": "MFA Under Attack",
    "briefing": "Late on a Sunday evening, Elena Rostova, Senior Product Director for Cloud Services at Apex Global, was awakened by repeated multi-factor authentication (MFA) push approval prompts on her corporate mobile device, followed by an urgent text message claiming to be from corporate IT Support. Learners must inspect the identity provider authentication logs, examine the incoming mobile prompt telemetry, distinguish the expected business login from the unauthorized barrage, explain what unsolicited push requests indicate regarding credential exposure, and formulate an immediate containment and phishing-resistant hardening plan under SOP SEC-304.",
    "skills": [
      "mfa-fatigue-detection",
      "push-bombing-analysis",
      "authentication-log-investigation",
      "social-engineering-defense",
      "phishing-resistant-architecture"
    ],
    "passThreshold": 70
  },
  {
    "id": "cc-pr-03",
    "roomId": "privacy",
    "difficulty": "advanced",
    "title": "Data Minimisation Audit",
    "briefing": "StudyTrack, an independent study-planning utility, is undergoing a comprehensive privacy and data protection architecture audit prior to its production release. The application’s documented purposes are scheduling self-directed study sessions, optional reminder notifications for upcoming study blocks, and optional calendar integration to sync scheduled sessions to a user-chosen calendar. Learners must review the declared functional requirements, inspect an 8-item data collection inventory and draft retention configuration, apply privacy-by-design principles (necessity, proportionality, purpose limitation, least privilege, and storage limitation), classify each inventory entry, construct a compliant configuration, and formulate an actionable minimisation remediation plan without making country-specific legal determinations.",
    "skills": [
      "data-minimisation",
      "purpose-limitation",
      "privacy-by-design",
      "least-privilege",
      "retention-management"
    ],
    "passThreshold": 70
  }
];

export const CHALLENGE_METADATA_MAP: Record<string, ChallengeMetadata> = Object.fromEntries(
  ALL_CHALLENGES_METADATA.map((c) => [c.id, c])
);

export const LIVE_CHALLENGE_IDS: ReadonlySet<string> = new Set([
  'cc-ph-01',
  'cc-ph-02',
  'cc-ph-03',
  'cc-so-01',
  'cc-so-02',
  'cc-so-03',
  'cc-nw-01',
  'cc-nw-02',
  'cc-nw-03',
  'cc-df-01',
  'cc-df-02',
  'cc-df-03',
  'cc-pr-01',
  'cc-pr-02',
  'cc-pr-03',
]);

export const ROOMS: Room[] = [
  {
    id: 'phishing',
    title: 'Phishing Defense',
    description: 'Investigate deceptive emails, malicious attachments, and credential harvesting schemes.',
    icon: 'Mail',
    accentClass: 'room-phishing',
    challengeIds: ['cc-ph-01', 'cc-ph-02', 'cc-ph-03'],
  },
  {
    id: 'secops',
    title: 'Security Operations',
    description: 'Analyze authentication logs, brute-force indicators, and active security incidents.',
    icon: 'Monitor',
    accentClass: 'room-secops',
    challengeIds: ['cc-so-01', 'cc-so-02', 'cc-so-03'],
  },
  {
    id: 'network',
    title: 'Network Security',
    description: 'Audit firewall rules, inspect port activity, and analyze raw network packet captures.',
    icon: 'Network',
    accentClass: 'room-network',
    challengeIds: ['cc-nw-01', 'cc-nw-02', 'cc-nw-03'],
  },
  {
    id: 'forensics',
    title: 'Digital Forensics',
    description: 'Recover deleted file artifacts, reconstruct browser history, and uncover steganographic data.',
    icon: 'Search',
    accentClass: 'room-forensics',
    challengeIds: ['cc-df-01', 'cc-df-02', 'cc-df-03'],
  },
  {
    id: 'privacy',
    title: 'Privacy & Access',
    description: 'Audit credential hygiene, defend against MFA fatigue attacks, and enforce data minimisation.',
    icon: 'Lock',
    accentClass: 'room-privacy',
    challengeIds: ['cc-pr-01', 'cc-pr-02', 'cc-pr-03'],
  },
];

export const ROOM_MAP: Record<string, Room> = Object.fromEntries(
  ROOMS.map((r) => [r.id, r])
);

export function getRoom(id: string): Room | undefined {
  return ROOM_MAP[id];
}

export function getChallengeMetadata(id: string): ChallengeMetadata | undefined {
  return CHALLENGE_METADATA_MAP[id];
}

export function assertMetadataMatchesDefinition(
  metadata: ChallengeMetadata,
  definition: Challenge
): void {
  if (metadata.id !== definition.id) {
    throw new Error(`id mismatch for ${metadata.id}: expected ${definition.id}`);
  }
  if (metadata.roomId !== definition.roomId) {
    throw new Error(`roomId mismatch for ${metadata.id}: expected ${definition.roomId}`);
  }
  if (metadata.difficulty !== definition.difficulty) {
    throw new Error(`difficulty mismatch for ${metadata.id}: expected ${definition.difficulty}`);
  }
  if (metadata.title !== definition.title) {
    throw new Error(`title mismatch for ${metadata.id}: expected ${definition.title}`);
  }
  if (metadata.briefing !== definition.briefing) {
    throw new Error(`briefing mismatch for ${metadata.id}`);
  }
  if (metadata.passThreshold !== definition.passThreshold) {
    throw new Error(`passThreshold mismatch for ${metadata.id}`);
  }
  if (metadata.skills.length !== definition.skills.length) {
    throw new Error(`skills length mismatch for ${metadata.id}`);
  }
  for (let i = 0; i < metadata.skills.length; i++) {
    if (metadata.skills[i] !== definition.skills[i]) {
      throw new Error(`skill mismatch at index ${i} for ${metadata.id}`);
    }
  }
}
