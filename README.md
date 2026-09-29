# CyberCampus

CyberCampus is an interactive cybersecurity learning platform featuring simulated investigative challenges across security domains.

## Routing & URL Conventions

The application follows strict route hierarchy conventions:

| Route Path | Description | Example URL |
|---|---|---|
| `/` | Landing page | `http://localhost:5173/` |
| `/campus` | 2D Interactive Campus Map (5 rooms) | `http://localhost:5173/campus` |
| `/room/:roomId` | Room Lobby (e.g. Phishing Defense) | `http://localhost:5173/room/phishing` |
| `/challenge/:challengeId` | Challenge Runner | `http://localhost:5173/challenge/cc-ph-01`, `/challenge/cc-ph-02` |
| `/results/:attemptId` | Results View (keyed by unique Attempt ID) | `http://localhost:5173/results/att-1727539200000-abcd` |
| `/dashboard` | User Progress Dashboard | `http://localhost:5173/dashboard` |
| `/portfolio` | Local Skill Portfolio | `http://localhost:5173/portfolio` |

> **Note on URL Conventions:**
> - Room pages use the path `/room/:roomId` (for example, `/room/phishing`, not `/campus/phishing`).
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
    - Rule 4 (`ZONE-WAN -> Internal 10.0.0.0/16 Any ACCEPT`, citing closed ticket `CHG-9941`) is overly broad and completely shadows Rule 5 (`ZONE-WAN -> ZONE-DB 10.0.3.0/24 Any DROP`), allowing external packets arriving at database VIP `198.51.100.50` to bypass the perimeter block and access internal databases.
    - Rule 7 is a redundant duplicate of Rule 6, adding administrative confusion.
  - Reject the "change ticket fallacy": the existence of a ticket does not justify an insecure rule or permit leaving temporary troubleshooting rules active past project completion.
  - Construct a least-privilege replacement rule via the interactive Guided Form widget: specify the vendor's static IP (`203.0.113.50/32`), DMZ jump-host (`10.0.1.25/32`), port `TCP 22 (SSH)`, and action `ACCEPT`, fulfilling the vendor maintenance need while eliminating the shadow over Rule 5.

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
