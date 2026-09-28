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
