# CyberCampus

CyberCampus is an interactive cybersecurity learning platform featuring simulated investigative challenges across security domains.

## Project Status

> **Status:** Challenge content complete; interactive 3D campus navigation active with accessible 2D fallback.
> All 15 challenges across all 5 rooms are fully implemented, registered as live, and playable locally with zero external network dependencies.

## Campus Architecture & Wayfinding

The campus page (`/campus`) provides an interactive wayfinding experience for all 5 security domains:

- **Accessible Room Navigation**: All five room links (*Phishing Defense*, *Security Operations*, *Network Security*, *Digital Forensics*, and *Privacy & Account Security*) remain in the DOM within semantic `<nav>` landmarks, fully accessible to assistive technology and keyboard navigation in both 3D and 2D modes. Focusable links are never placed inside `aria-hidden` ancestors.
- **Building Selection & Detail Panel**: Clicking a building selects that room and displays an accessible HTML room details panel with its title, description, real-time completion count (from saved progress), and an "Enter Room" link routing to `/room/:roomId`.
- **Drag vs. Click Distinction**: Pointer movements exceeding 5px are identified as camera drag/orbit interactions, preventing accidental room activation when dragging ends over a building.
- **Motion & Reduced-Motion Support**: Respects both user profile settings (`profile.settings.reducedMotion`) and OS preferences (`prefers-reduced-motion`). When reduced motion is active, the camera remains static, hover float/scaling is disabled, stale lifted building positions are immediately cleared, and CSS shimmer/transitions are suppressed.
- **Camera Controls & Demand Rendering**: Uses demand rendering (`frameloop="demand"`) to avoid continuous GPU/CPU rendering when idle. Orbit controls are bounded with auto-rotation disabled. An accessible **"Reset View"** button restores the initial camera position and orbit target.
- **Reliable WebGL Fallback & Recovery**: Features single-probe WebGL availability detection with context cleanup via `WEBGL_lose_context`. A React `CampusErrorBoundary` catches runtime rendering and dynamic import failures, while WebGL context loss events automatically recover to functional 2D navigation with an explanatory notice and safe retry option. Low-performance mode avoids mounting or loading Three.js.

## Routing & URL Conventions

The application follows strict route hierarchy conventions:

| Route Path | Description | Example URL |
|---|---|---|
| `/` | Landing page | `http://localhost:5173/` |
| `/campus` | Interactive Campus Map (3D Scene & 2D Accessible Navigation) | `http://localhost:5173/campus` |
| `/room/:roomId` | Room Lobby (e.g. Phishing Defense, Privacy) | `http://localhost:5173/room/privacy` |
| `/challenge/:challengeId` | Challenge Runner | `http://localhost:5173/challenge/cc-pr-03` |
| `/results/:attemptId` | Results View (keyed by unique Attempt ID) | `http://localhost:5173/results/att-1727539200000-abcd` |
| `/dashboard` | User Progress Dashboard | `http://localhost:5173/dashboard` |
| `/portfolio` | Local Skill Portfolio | `http://localhost:5173/portfolio` |

> **Note on URL Conventions:**
> - Room pages use the path `/room/:roomId` (for example, `/room/privacy`, not `/campus/privacy`).
> - Results pages use the unique attempt UUID `/results/:attemptId` generated upon submission (not `/results/:challengeId`).

---

## Playable Challenges

### 1. The Suspicious Invoice (`cc-ph-01`)
- **Room**: Phishing Defense (`phishing`)
- **Difficulty**: Beginner (100 pts, pass threshold: 70)
- **Investigation**: Fictional invoice email from lookalike domain (`apexstat1onery.example.net`), link inspection (`apexstat-pay.example`), typosquatted attachment (`Stat10nery.pdf`), and SPF/DKIM/DMARC authentication failure.

### 2. CEO Fraud (`cc-ph-02`)
- **Room**: Phishing Defense (`phishing`)
- **Difficulty**: Intermediate (100 pts, pass threshold: 70)
- **Investigation**: Multi-message email thread appearing to be from CEO Victoria Sterling requesting an urgent $42,500 wire transfer for a confidential acquisition.
- **Evidence**:
  - Email thread with mismatched Reply-To routing (`wire-portal-routing.example` vs `mail-executive.example`).
  - Trusted internal company directory with official email (`v.sterling@veridian-logistics.example`) and policy `FIN-402` (requiring verbal out-of-band dual-control verification).
  - Email header analysis showing valid SPF, DKIM, and DMARC for the external domain `mail-executive.example`.
- **Educational Objective**:
  - Demonstrates that external email authentication passing only verifies the external domain owner, NOT that the sender is the company executive.
  - Distinguishes genuine warning signs (unauthorized exception demands, secrecy, pressure, domain mismatch) from non-fraud details (legitimate travel schedules, standard SPF/DKIM pass).

### 3. Spear-Phish Campaign (`cc-ph-03`)
- **Room**: Phishing Defense (`phishing`)
- **Difficulty**: Advanced (100 pts, pass threshold: 70)
- **Investigation**: Triage a simulated inbox containing 3 emails (2 legitimate and 1 targeted spear-phishing attempt targeting a DevOps lead).
- **Evidence**:
  - Simulated interactive webmail inbox with 3 distinct emails (IT SSO maintenance, MetricsCloud APM latency digest, and an urgent Kubernetes zero-day patch lure).
  - Trusted IT Engineering Directory and Emergency Patch Policy `CHG-204` (mandating GitOps repository commits and forbidding external mirrors).
  - Email Comparison Matrix showing sender domains, masked destinations, and authentication status.
- **Educational Objective**:
  - Classify multiple messages accurately (distinguishing genuine operational and SaaS vendor alerts from targeted executive impersonation).
  - Identify specific indicators of spear-phishing (link masking, lookalike domain, policy violation, credential harvesting, artificial urgency) while rejecting benign technical distractors (CVE citation, kubectl syntax, valid external SPF/DKIM).
  - Apply proper operational incident response (quarantine, SOC reporting, out-of-band phone verification).

### 4. Alert Triage (`cc-so-01`)
- **Room**: Security Operations (`secops`)
- **Difficulty**: Beginner (100 pts, pass threshold: 70)
- **Investigation**: Fictional shift dashboard queue containing 8 incoming SIEM and EDR alerts during morning shift handover at Veridian Logistics.
- **Evidence**:
  - Reusable SIEM Alert Queue viewer with interactive alert selection, severity indicators, affected hosts, timestamps, detection rules, operational context, and technical telemetry (source IPs, process paths, command lines, raw log snippets).
  - Shift Handover & Maintenance Calendar with approved change tickets (`CHG-8910`, `SEC-3301`, `INFRA-9042`) and SOC SOP-102 triage standards.
- **Educational Objective**:
  - Distinguish genuine security threats (`ALT-201` LSASS memory dump, `ALT-203` impossible travel anomaly, `ALT-205` Kerberoasting RC4 ticket spike, `ALT-207` active rclone data exfiltration) from explained benign operational activity (`ALT-202` vulnerability scanner, `ALT-204` service account rotation failure, `ALT-206` WAF perimeter block, `ALT-208` approved least-privilege cloud IAM autoscaling maintenance).
  - Emphasizes the critical IAM principle that excessive permissions (like `AdministratorAccess`) must never be dismissed simply because a change ticket exists; dismissal of `ALT-208` is only justified because the attached policy was verified to be strictly least-privilege (`AmazonEKSClusterAutoscalerPolicy`).
  - Anti-guessing scoring ensures a blanket "Investigate" or "Dismiss" strategy cannot pass or earn full credit (balanced 4/4 split).
  - Choose the safest immediate containment action for critical data exfiltration (isolate host via EDR, terminate process, preserve volatile memory) over destructive reboots or delayed email queries.

### 5. The 3am Login (`cc-so-02`)
- **Room**: Security Operations (`secops`)
- **Difficulty**: Intermediate (100 pts, pass threshold: 70)
- **Investigation**: Investigate an off-hours administrative authentication alert and IAM key generation on Senior DBA Niall Gallagher's account.
- **Evidence**:
  - Interactive multi-system timeline (Okta IdP, Duo MFA, ZTNA VPN, AWS CloudTrail) spanning 02:45–03:25 UTC.
  - User Baseline Profile with hardware inventory (`VER-MBP-9021`), on-call rotation schedule between Ireland (`eu-west-1`) and Frankfurt (`eu-central-1`), and SOP SEC-204 incident triage standards.
- **Educational Objective**:
  - Teach that off-hours access (03:14 UTC) and European IP geolocations alone do NOT prove compromise (on-call rotation, European database replicas in Frankfurt `eu-central-1`).
  - Identify genuine indicators of compromise: unmanaged Windows endpoint vs corporate Mac, commercial hosting ASN vs residential ISP, MFA push fatigue cluster (5 denials in 3.5m followed by 1 approval), and unauthorized programmatic IAM access key generation (`AKIA2048NGAL902`).
  - Distinguish confirmed facts directly established by log evidence from plausible unproven hypotheses (such as how the password was acquired or why MFA was approved).
  - Select a proportionate response: immediately terminate the rogue session, deactivate the new access key, contact the user via out-of-band directory phone, mandate credential resets, and preserve audit logs without premature breach declarations or panic-wiping uninvolved devices.

### 6. Incident Response Timeline (`cc-so-03`)
- **Room**: Security Operations (`secops`)
- **Difficulty**: Advanced (100 pts, pass threshold: 70)
- **Investigation**: Piece together 11 multi-system log artifacts collected from edge WAF, web server Nginx, Linux auditd/EDR, internal network firewall, Active Directory KDC, and PostgreSQL database servers, initially presented in ingestion arrival order.
- **Evidence**:
  - Multi-System Telemetry Dossier with 11 out-of-order log records spanning 14:00–18:15 UTC.
  - Incident Handling SOP IR-302 detailing attack chain reconstruction, foothold identification, and volatile evidence preservation protocols.
- **Educational Objective**:
  - Reconstruct the true chronological attack chain using an accessible ordering widget (supporting mouse, touch, and keyboard up/down controls with partial credit scoring):
    1. Unauthenticated file upload exploit planting web shell `invoice_spec.pdf.phtml` (14:22 UTC)
    2. Interactive reverse shell connection to external C2 `203.0.113.88:443` (14:23 UTC)
    3. Local privilege escalation via SUID `pkexec` binary to root (15:02 UTC)
    4. Internal network SYN sweep against database subnet `10.0.2.0/24` (15:35 UTC)
    5. Bulk database extraction (`pg_dump`) archiving customer billing records (17:15 UTC)
    6. High-volume encrypted data exfiltration (14.2 GB) to drop server `203.0.113.99` (17:42 UTC)
  - Distinguish the initial entry vector (unauthenticated web application file upload) from subsequent internal lateral movement (Kerberoasting at 16:12 UTC or database querying at 16:48 UTC).
  - Apply forensic containment discipline: never reboot or wipe live servers (which destroys volatile memory RAM and network artifacts); isolate hosts at the network layer, capture memory dumps, revoke compromised credentials, and archive logs.
### 7. The Open Port (`cc-nw-01`)
- **Room**: Network Security (`network`)
- **Difficulty**: Beginner (100 pts, pass threshold: 70)
- **Investigation**: Review a simulated network exposure and port audit report for fictional perimeter gateway `web-gateway-01.veridian-logistics.example` across 8 listening services.
- **Evidence**:
  - Interactive Exposure Report Viewer showing 8 listening ports, protocols, service banners, bound network interfaces (`0.0.0.0`, `127.0.0.1`, `10.0.1.15`), and reachability classifications (`Public Internet`, `Internal LAN Only`, `Localhost Only`).
  - Company Network Security Standard (SOP NET-101) mandating TLS encryption for public access, restricting remote administrative management to management VPNs, and requiring database and cache services to bind strictly to localhost or private subnets.
- **Educational Objective**:
  - Teach that a port number alone does not determine security posture: configuration, authentication, encryption, and network reachability matter.
    - Safe/Intended public services: Port 80 (HTTP plaintext redirecting to HTTPS) and Port 443 (HTTPS TLS 1.3 reverse proxy).
    - Unsafe public services: Port 21 (cleartext vsftpd 2.3.4 with backdoor signature), Port 22 (SSH on `0.0.0.0` with password auth and root login enabled), Port 6379 (Redis bound to `0.0.0.0` with no authentication), Port 8080 (Cockpit Web Admin over unencrypted HTTP).
    - Safe internal/localhost services: Port 9100 (Prometheus node-exporter bound strictly to private LAN `10.0.1.15`) and Port 5432 (PostgreSQL bound strictly to loopback `127.0.0.1`).
  - Distinguish genuine security remediation needs from intended services; selecting all ports or guessing indiscriminately cannot pass due to anti-guessing scoring (balanced 4 safe / 4 unsafe split).
  - Formulate an effective administrative access remediation strategy: restrict SSH/management ingress to the dedicated corporate VPN (`10.0.100.0/24`) with public-key authentication, rather than relying on security-through-obscurity or exposing administrative dashboards to the open internet.

### 8. Firewall Rule Audit (`cc-nw-02`)
- **Room**: Network Security (`network`)
- **Difficulty**: Intermediate (100 pts, pass threshold: 70)
- **Investigation**: Perform a scheduled firewall audit on perimeter appliance `fw-perimeter-01.veridian-logistics.example` across 9 ordered rules.
- **Evidence**:
  - Interactive Firewall Policy Viewer with network zone topology cards (WAN `0.0.0.0/0`, DMZ `10.0.1.0/24`, Corporate LAN `10.0.2.0/24`, Secure DB Tier `10.0.3.0/24`, Management VPN `10.0.100.0/24`), Destination NAT (Post-DNAT Security Inspection) architecture with public VIP mappings (`198.51.100.0/24 -> 10.0.x.x`), evaluation semantics banner, and full ordered rule table with source, destination, service/port, action, log state, and change tickets.
  - Enterprise Firewall Standard (SOP NET-201) establishing top-to-bottom first-match processing, prohibition of shadowed rules, least-privilege addressing (mandatory `/32` host scoping for management access), change ticket expiration, deduplication, and post-DNAT policy inspection semantics.
- **Educational Objective**:
  - Understand post-DNAT inspection semantics and top-to-bottom rule processing (first-match-wins):
    - External WAN traffic arrives at public Virtual IPs (`198.51.100.0/24`) and translates to internal targets (`10.0.x.x`) in pre-routing; security filter rules match against translated internal destination IPs.
    - Rule 3 (`ZONE-MGMT -> Admin Bastion Host 10.0.100.10/32:22 ACCEPT`) is properly scoped to an exact `/32` administrative bastion, fully complying with SOP NET-201.
    - Rule 4 (`ZONE-WAN -> Internal 10.0.0.0/16 Any ACCEPT`, citing closed ticket `CHG-9941`) is overly broad and completely shadows Rule 5 (`ZONE-WAN -> ZONE-DB 10.0.3.0/24 Any DROP`), allowing external packets reaching the database VIP `198.51.100.50` on TCP 5432 to bypass the perimeter block and access internal databases.
    - Rule 7 is a redundant duplicate of Rule 6, adding administrative confusion.
  - Reject the "change ticket fallacy": the existence of a ticket does not justify an insecure rule or permit leaving temporary troubleshooting rules active past project completion.
  - Construct a least-privilege replacement rule via the interactive Guided Form widget: specify the vendor's static IP (`203.0.113.50/32`), DMZ jump-host (`10.0.1.25/32`), port `TCP 22 (SSH)`, and action `ACCEPT`, fulfilling the vendor maintenance need while eliminating the shadow over Rule 5.

### 9. Packet Trace Analysis (`cc-nw-03`)
- **Room**: Network Security (`network`)
- **Difficulty**: Advanced (100 pts, pass threshold: 70)
- **Investigation**: Investigate a simulated 36-packet network capture recorded on core switch `sw-core-01.veridian-logistics.example` across internal LAN subnets.
- **Evidence**:
  - Interactive Packet Trace Viewer with protocol quick-filters (`All`, `DNS`, `Tunneling Only`, `TLS/HTTPS`, `NTP`), real-time search, packet dissection inspector (Ethernet, IPv4, UDP/TCP, DNS layers), and an exfiltration volume methodology guide.
  - Network Forensic & Covert Channel Standard (SOP NET-301) establishing DNS tunneling indicators (burst frequency, non-dictionary high-entropy hexadecimal labels), false-positive differentiation (single TXT query verification), exfiltration volume formulas, and volatile memory preservation protocols.
- **Educational Objective**:
  - Detect covert DNS tunneling channels (MITRE ATT&CK T1071.004 / T1048.003):
    - Identify compromised host `10.0.2.84` (`ws-fin-exec-84`) generating a continuous burst of 24 DNS queries with 32-character hexadecimal labels to external domain `*.sync-telemetry.example`.
  - Avoid common false positives: distinguish legitimate, isolated DNS TXT lookups (such as `_spf.cloudvendor.example` on host `10.0.2.15`) from malicious query repetition and high-entropy label sequences.
  - Calculate exfiltration volume accurately using reproducible formulas:
    - Encoded Payload Size = 24 queries × 32 bytes/label = 768 bytes.
    - Distinguish encoded payload size from total network frame traffic (24 × 102 bytes = 2,448 bytes) and raw decoded binary data (384 bytes).

### 10. USB Drive Forensics (`cc-df-01`)
- **Room**: Digital Forensics (`forensics`)
- **Difficulty**: Beginner (100 pts, pass threshold: 70)
- **Investigation**: Examine a simulated forensic image of a discarded USB drive recovered on campus premises.
- **Evidence**: USB filesystem directory tree, file metadata, hash table, file carving logs, and digital forensics SOP FOR-101.
- **Educational Objective**:
  - Distinguish active files from deleted and carved files, inspect modified and deleted timestamps, and calculate cryptographic hashes (SHA-256) to verify forensic integrity.
  - Apply chain-of-custody protocols without altering evidence or mounting media write-enabled.

### 11. Browser History Audit (`cc-df-02`)
- **Room**: Digital Forensics (`forensics`)
- **Difficulty**: Intermediate (100 pts, pass threshold: 70)
- **Investigation**: Examine browser forensic telemetry extracted from workstation `WS-FIN-04`.
- **Evidence**: Browser SQLite history table, downloads record, cache entries, typed URLs, and forensic policy FOR-202.
- **Educational Objective**:
  - Correlate timestamps across visits and downloads, reconstruct user navigation paths, and identify suspicious redirect sequences.
  - Distinguish intentional navigation from automated background assets and drive-by download staging.

### 12. Steganography Detection (`cc-df-03`)
- **Room**: Digital Forensics (`forensics`)
- **Difficulty**: Advanced (100 pts, pass threshold: 70)
- **Investigation**: Examine three PNG image files (`report_cover.png`, `arch_diagram.png`, `badge_photo.png`) to detect hidden covert communications.
- **Evidence**: Interactive Stego Lens / Bit-Plane Inspector, file metadata & SHA-256 hashes, in-browser LSB payload extraction tool, and SOP FOR-303.
- **Educational Objective**:
  - Inspect least-significant bit (LSB) planes, recognize spatial noise patterns, and extract and verify harmless UTF-8 hidden payloads.
  - Understand that visual appearance, file size, or metadata alone does not prove steganographic alteration.

### 13. Password Audit (`cc-pr-01`)
- **Room**: Privacy & Account Security (`privacy`)
- **Difficulty**: Beginner (100 pts, pass threshold: 70)
- **Investigation**: Review 8 simulated account records across personal and enterprise services.
- **Evidence**: Account credentials table with password reuse indicators, breach exposure flags, credential age, privilege tier, and MFA status.
- **Educational Objective**:
  - Evaluate account risks holistically (password reuse, breach exposure, administrative privilege, lack of MFA).
  - Prioritize immediate remediation for exposed privileged accounts and apply defense-in-depth principles (unique passphrases, password managers, MFA) rather than relying solely on arbitrary password complexity rules.

### 14. MFA Under Attack (`cc-pr-02`)
- **Room**: Privacy & Account Security (`privacy`)
- **Difficulty**: Intermediate (100 pts, pass threshold: 70)
- **Investigation**: Investigate repeated unsolicited MFA push notifications sent to Lead Systems Architect Elena Rostova.
- **Evidence**: Multi-system authentication logs with explicit primary password verification preceding push requests, device inventory, push fatigue timeline, and security policy SEC-304.
- **Educational Objective**:
  - Recognize MFA fatigue (prompt bombing) attacks and understand evidence-based password compromise based on explicit primary-password authentication logs.
  - Understand that authentication architectures differ (including passwordless push flows where passwords are not used).
  - Execute immediate containment (session revocation, out-of-band communication, credential reset) and harden authentication with phishing-resistant standards (FIDO2 / WebAuthn passkeys).

### 15. Data Minimisation Audit (`cc-pr-03`)
- **Room**: Privacy & Account Security (`privacy`)
- **Difficulty**: Advanced (100 pts, pass threshold: 70)
- **Investigation**: Perform a fictional privacy engineering audit on study-planning application "StudyTrack" with documented purposes: core study session scheduling, optional reminders, and optional calendar integration.
- **Evidence**:
  - Product requirements document (`PRD-ST-204`) with declared purposes.
  - Data collection and permission inventory (8 entries).
  - Draft retention and access-control matrix.
  - Privacy-by-design policy standard (`POL-PRIV-01`).
- **Educational Objective**:
  - Apply core privacy engineering principles: necessity (essential for core functionality), proportionality, purpose limitation (restricting data collection to declared legitimate purposes), storage limitation (retention schedules with automated purging), least privilege (role-based access control), and user control (explicit opt-in consent for optional features).
  - Classify data inventory items, construct a proportionate retention and access policy, and choose an actionable remediation plan without making country-specific legal determinations.

---

## Development & Test Commands

```bash
# Run Vitest test suite
npm run test:run

# Run ESLint
npm run lint

# TypeScript verification
npx tsc -b

# Production build
npm run build

# Start local dev server
npm run dev
```
