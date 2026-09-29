// ============================================================
// Challenge: cc-nw-01 — The Open Port
// Room: Network Security | Difficulty: Beginner
//
// Scenario:
//   An automated perimeter exposure audit scanned the external application
//   gateway web-gateway-01.veridian-logistics.example (Public IP: 198.51.100.80).
//   The scan revealed 8 listening services across various ports and interfaces.
//   Some services are intended public endpoints, some are safely restricted
//   to localhost or internal networks, and others represent severe security
//   risks (cleartext protocols, unauthenticated data stores, exposed admin consoles).
//
//   The analyst must:
//   1. Identify which listening services represent unacceptable exposures requiring remediation.
//   2. Classify exposure postures (acceptable/properly scoped vs insecure).
//   3. Select the appropriate network remediation strategy for administrative access following SOP NET-101.
//
// All domains use RFC 2606 .example TLDs.
// All IPs use RFC 5737 documentation addresses or RFC 1918 private subnets.
// All personas and organizations are entirely fictional.
// ============================================================

import type { Challenge } from '../../types';

export const challengeCC_NW_01: Challenge = {
  id: 'cc-nw-01',
  roomId: 'network',
  difficulty: 'beginner',
  title: 'The Open Port',
  briefing:
    'You are reviewing an automated network exposure audit for web-gateway-01.veridian-logistics.example (198.51.100.80), an Internet-facing edge gateway server. The audit lists 8 active listening services, their socket bindings, reachability, and operational context. Review the exposure report alongside corporate Network Security Standard NET-101. Identify which services present an unacceptable risk requiring remediation, evaluate their exposure posture, and determine the safest remediation strategy. Remember: a port number alone does not determine risk—service configuration and reachability matter.',

  // ── Evidence ──────────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-exposure-report',
      type: 'network',
      label: 'Perimeter Exposure Audit (8 Ports)',
      content: {
        isExposureReport: true,
        scanTitle: 'Automated External Network Exposure Audit',
        scanSubtitle: 'Host Target: web-gateway-01.veridian-logistics.example',
        targetHost: 'web-gateway-01.veridian-logistics.example',
        targetIpPublic: '198.51.100.80 (WAN / Public Ingress)',
        targetIpPrivate: '10.0.1.15 (VLAN 10 — DMZ Web Tier)',
        operatingSystem: 'Ubuntu 24.04 LTS (Linux 6.8.0-31-generic)',
        scanTimestamp: '29 Sep 2026, 09:14:02 UTC',
        scannerTool: 'Veridian NetScan Engine v4.2 (TCP SYN Full Port Sweep)',
        ports: [
          {
            id: 'port-80',
            port: 80,
            protocol: 'tcp',
            service: 'HTTP',
            version: 'nginx 1.24.0',
            boundAddress: '0.0.0.0:80',
            reachability: 'public',
            reachabilityLabel: 'Public Internet',
            purpose: 'HTTP-to-HTTPS Redirection Service',
            businessContext:
              'Listens on all public interfaces to redirect unencrypted HTTP visitors to HTTPS with a permanent 301 redirect rule. Transmits no data or credentials over cleartext.',
            status: 'safe',
            banner: 'HTTP/1.1 301 Moved Permanently\r\nLocation: https://web-gateway-01.veridian-logistics.example/',
          },
          {
            id: 'port-443',
            port: 443,
            protocol: 'tcp',
            service: 'HTTPS',
            version: 'nginx 1.24.0',
            boundAddress: '0.0.0.0:443',
            reachability: 'public',
            reachabilityLabel: 'Public Internet',
            purpose: 'Primary Customer Logistics & Tracking Portal',
            businessContext:
              'Core customer-facing web application. Enforces modern TLS 1.3 with a valid Let\'s Encrypt certificate, HSTS headers enabled, and WAF rate-limiting.',
            status: 'safe',
            banner: 'HTTP/1.1 200 OK\r\nServer: nginx\r\nStrict-Transport-Security: max-age=63072000',
          },
          {
            id: 'port-21',
            port: 21,
            protocol: 'tcp',
            service: 'FTP',
            version: 'vsftpd 3.0.3',
            boundAddress: '0.0.0.0:21',
            reachability: 'public',
            reachabilityLabel: 'Public Internet',
            purpose: 'Legacy Vendor Document Exchange',
            businessContext:
              'Cleartext File Transfer Protocol service set up 3 years ago for an offshore contractor. Transmits usernames, passwords, and file contents unencrypted over the public Internet. Violates NET-101.',
            status: 'unsafe',
            banner: '220 (vsFTPd 3.0.3 - Veridian Supplier FTP Server Ready)',
          },
          {
            id: 'port-22',
            port: 22,
            protocol: 'tcp',
            service: 'SSH',
            version: 'OpenSSH 9.3p1',
            boundAddress: '0.0.0.0:22',
            reachability: 'public',
            reachabilityLabel: 'Public Internet',
            purpose: 'Server Remote Administration',
            businessContext:
              'Administrative terminal listener bound to public WAN with password authentication permitted. Receives over 1,500 automated dictionary brute-force attempts per hour from botnets.',
            status: 'unsafe',
            banner: 'SSH-2.0-OpenSSH_9.3p1 Ubuntu-1ubuntu3',
          },
          {
            id: 'port-6379',
            port: 6379,
            protocol: 'tcp',
            service: 'Redis',
            version: 'Redis server 7.2.4',
            boundAddress: '0.0.0.0:6379',
            reachability: 'public',
            reachabilityLabel: 'Public Internet',
            purpose: 'Web Session Store & Rate-Limit Cache',
            businessContext:
              'In-memory session cache accidentally bound to 0.0.0.0 due to a Docker port publishing misconfiguration (6379:6379). No requirepass password configured; allows unauthenticated external access.',
            status: 'unsafe',
            banner: '+PONG\r\n(Redis Server Ready - No Authentication Required)',
          },
          {
            id: 'port-9100',
            port: 9100,
            protocol: 'tcp',
            service: 'Prometheus Node Exporter',
            version: 'node_exporter 1.7.0',
            boundAddress: '10.0.1.15:9100',
            reachability: 'internal',
            reachabilityLabel: 'Internal LAN Only',
            purpose: 'Server Telemetry & Performance Metrics',
            businessContext:
              'Metrics exporter bound strictly to private interface 10.0.1.15. The perimeter firewall drops all external WAN packets targeting this port. Polled exclusively by the internal Prometheus server (10.0.1.5).',
            status: 'safe',
            banner: 'HTTP/1.1 200 OK\r\nContent-Type: text/plain; version=0.0.4\r\n# HELP node_cpu_seconds_total',
          },
          {
            id: 'port-8080',
            port: 8080,
            protocol: 'tcp',
            service: 'HTTP (Cockpit Admin UI)',
            version: 'Cockpit Web Service 310',
            boundAddress: '0.0.0.0:8080',
            reachability: 'public',
            reachabilityLabel: 'Public Internet',
            purpose: 'Linux System Management Web Dashboard',
            businessContext:
              'Web administration console exposed directly to the public Internet without TLS encryption or VPN requirement. Login screen allows direct root/system credential submission over plaintext HTTP.',
            status: 'unsafe',
            banner: 'HTTP/1.1 200 OK\r\nServer: Cockpit\r\nTitle: Veridian Gateway System Administration',
          },
          {
            id: 'port-5432',
            port: 5432,
            protocol: 'tcp',
            service: 'PostgreSQL',
            version: 'PostgreSQL 16.2',
            boundAddress: '127.0.0.1:5432',
            reachability: 'localhost',
            reachabilityLabel: 'Localhost Only',
            purpose: 'Local Configuration Database',
            businessContext:
              'Database engine bound strictly to the local loopback interface (127.0.0.1). Completely unreachable from outside the host (neither public Internet nor adjacent LAN hosts can connect).',
            status: 'safe',
            banner: '(Socket connection refused from remote IP - bound to 127.0.0.1 only)',
          },
        ],
      },
    },
    {
      id: 'ev-policy-net101',
      type: 'policy',
      label: 'Network Security Standards (SOP NET-101)',
      content: {
        type: 'directory',
        company: 'Veridian Logistics — Enterprise Network Security Architecture',
        employee: {
          name: 'Network Infrastructure & Firewall Team',
          title: 'Lead Network Security Architect',
          department: 'Enterprise Infrastructure & Cloud Operations',
          officialEmail: 'netsec@veridian-logistics.example',
          internalPhone: '+353 1 496 0220 (NetSec Dispatch & Ops)',
          officeLocation: 'Dublin Tech Center, Building 1, Floor 3',
          assistant: 'NOC / SecOps Hotline Ext. 2200',
          currentStatus: 'Routine Production Audit — Server Exposure Assessment',
        },
        policy: {
          code: 'SOP NET-101',
          title: 'Perimeter Ingress, Service Hardening & Administrative Exposure Standards',
          rules: [
            'Rule 1 (Minimal Public Surface): Only services strictly required for public customer transactions (HTTP/80 redirect and HTTPS/443) may be exposed to the public Internet. All storage, cache, administrative, and database services must remain unreachable from public WANs.',
            'Rule 2 (Administrative Access): Administrative consoles (including SSH/22 and Web Management Panels/8080) must NEVER be directly exposed to the public Internet. Administration is permitted strictly via the corporate management VPN / bastion subnet (10.0.100.0/24) with hardware MFA and cryptographic key authentication.',
            'Rule 3 (Insecure Legacy Protocols): Unencrypted plaintext protocols (including FTP/21, Telnet/23, and unencrypted HTTP admin interfaces) are strictly prohibited on perimeter hosts. File exchanges must use SFTP or TLS-encrypted APIs.',
            'Rule 4 (Data Stores & In-Memory Caches): Databases (PostgreSQL, MySQL) and memory caches (Redis, Memcached) must bind exclusively to localhost (127.0.0.1) or internal backend networks with mandatory authentication. Accidental binding to 0.0.0.0 represents a critical exposure.',
            'Rule 5 (Port Number vs Service Context): A port number alone does not determine security. Port 80 is safe when solely performing a 301 redirect to HTTPS; Port 22 is unsafe when exposed publicly with password auth; Port 9100 is safe when restricted to internal telemetry subnets.',
          ],
        },
      },
    },
  ],

  // ── Steps ─────────────────────────────────────────────────────────────────
  //
  // Step 1 (40 pts): Identify risky exposures requiring remediation (flag-selection, 4 correct, 4 distractors)
  // Step 2 (30 pts): Classify exposure posture & configuration (classification, 4 items = 7.5 pts each)
  // Step 3 (30 pts): Select proper administrative access remediation (single-choice, no partial)
  //
  // Total: 100 pts. Pass threshold: 70.
  steps: [
    {
      id: 'step-identify-exposures',
      prompt:
        'Review the simulated port exposure audit report and corporate network policy NET-101. Select all listening services whose current exposure or configuration represents an unacceptable security risk requiring remediation. Do NOT flag services that are intended, properly scoped, or safe.',
      interaction: 'flag-selection',
      partialCreditAllowed: true,
      pointValue: 40,
      items: [
        {
          id: 'port-80',
          label: 'Port 80/tcp (HTTP — Nginx redirecting all traffic to HTTPS on 0.0.0.0:80)',
        },
        {
          id: 'port-443',
          label: 'Port 443/tcp (HTTPS — Nginx customer web application with TLS 1.3 on 0.0.0.0:443)',
        },
        {
          id: 'port-21',
          label: 'Port 21/tcp (FTP — vsftpd cleartext legacy file transfer service on 0.0.0.0:21)',
        },
        {
          id: 'port-22',
          label: 'Port 22/tcp (SSH — OpenSSH public remote administration with password auth on 0.0.0.0:22)',
        },
        {
          id: 'port-6379',
          label: 'Port 6379/tcp (Redis — in-memory cache bound to 0.0.0.0:6379 without authentication)',
        },
        {
          id: 'port-9100',
          label: 'Port 9100/tcp (Prometheus Node Exporter bound to private internal IP 10.0.1.15:9100)',
        },
        {
          id: 'port-8080',
          label: 'Port 8080/tcp (HTTP — Cockpit web management console exposed on 0.0.0.0:8080)',
        },
        {
          id: 'port-5432',
          label: 'Port 5432/tcp (PostgreSQL database server bound strictly to loopback 127.0.0.1:5432)',
        },
      ],
      answerKey: {
        'port-80': false,
        'port-443': false,
        'port-21': true,
        'port-22': true,
        'port-6379': true,
        'port-9100': false,
        'port-8080': true,
        'port-5432': false,
      },
    },
    {
      id: 'step-classify-posture',
      prompt:
        'A port number alone does not reveal whether a service is secure. The listening interface, reachability, authentication, and transport security determine risk. Classify each service according to its exposure posture.',
      interaction: 'classification',
      partialCreditAllowed: true,
      pointValue: 30,
      items: [
        {
          id: 'eval-port-80',
          label:
            'Port 80 (HTTP) on 0.0.0.0:80 configured exclusively to issue 301 redirects to HTTPS (Port 443).',
          options: ['Acceptable / Properly Scoped Exposure', 'Insecure Exposure Requiring Action'],
        },
        {
          id: 'eval-port-21',
          label:
            'Port 21 (vsftpd) on 0.0.0.0:21 providing unencrypted FTP file exchange for external vendors.',
          options: ['Acceptable / Properly Scoped Exposure', 'Insecure Exposure Requiring Action'],
        },
        {
          id: 'eval-port-6379',
          label:
            'Port 6379 (Redis) bound to all interfaces (0.0.0.0:6379) with no password requirement.',
          options: ['Acceptable / Properly Scoped Exposure', 'Insecure Exposure Requiring Action'],
        },
        {
          id: 'eval-port-9100',
          label:
            'Port 9100 (Node Exporter) bound to internal IP 10.0.1.15 and blocked from the Internet by the firewall.',
          options: ['Acceptable / Properly Scoped Exposure', 'Insecure Exposure Requiring Action'],
        },
      ],
      answerKey: {
        'eval-port-80': 'Acceptable / Properly Scoped Exposure',
        'eval-port-21': 'Insecure Exposure Requiring Action',
        'eval-port-6379': 'Insecure Exposure Requiring Action',
        'eval-port-9100': 'Acceptable / Properly Scoped Exposure',
      },
    },
    {
      id: 'step-remediation-strategy',
      prompt:
        'The exposure report reveals two administrative services exposed to the public Internet: OpenSSH on port 22 and the Cockpit Web Management Console on port 8080. In accordance with Network Security Standard NET-101, what is the most secure and proportionate remediation strategy?',
      interaction: 'single-choice',
      partialCreditAllowed: false,
      pointValue: 30,
      items: [
        {
          id: 'remed-vpn-bastion',
          label:
            'Configure host and perimeter firewall rules to block public WAN traffic to ports 22 and 8080, restrict administrative access exclusively to the corporate management VPN subnet (10.0.100.0/24), disable SSH password authentication in favor of ed25519 SSH keys, and enforce TLS with MFA on the web dashboard.',
        },
        {
          id: 'remed-port-knocking',
          label:
            'Change SSH from port 22 to port 2222 and move the web dashboard to port 8443 on the public Internet, relying on non-standard port numbers to hide them from attackers.',
        },
        {
          id: 'remed-complex-password',
          label:
            'Keep ports 22 and 8080 open to the public Internet so system administrators can connect from any location without a VPN, but mandate 20-character passwords.',
        },
        {
          id: 'remed-shut-down-server',
          label:
            'Uninstall the OpenSSH and Cockpit packages entirely and require system administrators to travel to the datacenter and use a physical keyboard and monitor for all maintenance.',
        },
      ],
      answerKey: { chosen: 'remed-vpn-bastion' },
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Check the listening address and network reachability for each port. A service bound to 127.0.0.1 or restricted to an internal management interface (10.0.1.15) cannot be reached by external Internet attackers.',
    'Do not assume standard web ports (80 and 443) are threats merely because they are open. Port 80 redirecting to HTTPS and Port 443 serving encrypted web traffic are intended public services for an Internet-facing gateway.',
    'Administrative interfaces (SSH, management panels) and data stores (Redis) must never be directly exposed to the public Internet. Changing port numbers (security through obscurity) is not an acceptable substitute for network firewall restriction and VPN bastions.',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'network-exposure-analysis',
    'port-and-service-auditing',
    'least-privilege-network-binding',
    'perimeter-security-controls',
    'insecure-protocol-remediation',
  ],

  // ── Scoring ───────────────────────────────────────────────────────────────
  passThreshold: 70,

  // ── Explanations ─────────────────────────────────────────────────────────
  successExplanation:
    'Outstanding network security audit! You accurately evaluated the server exposure report, distinguished between legitimate public services and dangerous vulnerabilities, and selected the appropriate defense-in-depth remediation strategy.\n\nAudit Findings Breakdown:\n1. Acceptable / Properly Scoped Services:\n- Port 80 (HTTP): Listening on 0.0.0.0:80 is standard practice when configured exclusively to issue 301 permanent redirects to HTTPS. It handles no sensitive data.\n- Port 443 (HTTPS): Core customer portal running TLS 1.3 with a valid certificate and WAF protection. This is an intended public service.\n- Port 9100 (Prometheus Node Exporter): Bound strictly to the private IP 10.0.1.15 with the perimeter firewall dropping WAN traffic. Scoped correctly for internal telemetry.\n- Port 5432 (PostgreSQL): Bound strictly to loopback (127.0.0.1). Unreachable from any external or internal network packets.\n\n2. Insecure Exposures Requiring Action:\n- Port 21 (FTP): Plaintext protocol transmitting authentication credentials and files unencrypted over the public Internet. Must be decommissioned or replaced with SFTP/HTTPS.\n- Port 22 (SSH): Publicly accessible administration listener allowing password authentication. Subject to continuous botnet brute-forcing. Must be restricted to the management VPN.\n- Port 6379 (Redis): Unauthenticated in-memory cache published to 0.0.0.0. External attackers can read sensitive session tokens or achieve remote code execution (RCE). Must bind to localhost only.\n- Port 8080 (Cockpit Admin UI): Unencrypted web dashboard exposed to the WAN. Transmits system administrator credentials over plaintext HTTP.\n\n3. Remediation Principles:\n- Security through obscurity (such as changing SSH to port 2222) does not protect against automated scanners and violates policy.\n- Proper remediation uses defense in depth: restrict management traffic to the internal VPN (10.0.100.0/24), enforce cryptographic key authentication, and bind local caches to loopback.',

  failureExplanation:
    'Effective network exposure management requires evaluating service configurations and listening socket boundaries rather than assuming port numbers alone define risk.\n\nKey Network Security Principles:\n- Intended Public Services:\n  • Port 80 (HTTP) redirecting to Port 443 is normal and required for public web traffic.\n  • Port 443 (HTTPS) with modern TLS is the intended purpose of a public web gateway.\n- Scoped Internal Services:\n  • Port 9100 bound to 10.0.1.15 is blocked by perimeter firewalls and serves internal monitoring.\n  • Port 5432 bound to 127.0.0.1 is unreachable across the network.\n- Critical Exposures Requiring Remediation:\n  • Port 21 (vsftpd): Cleartext legacy protocol leaking credentials.\n  • Port 22 (SSH): Public administrative access receiving continuous brute-force attacks.\n  • Port 6379 (Redis): Unauthenticated database published to 0.0.0.0.\n  • Port 8080 (Cockpit): Unencrypted public management interface.\n- Remediation Strategy: Do not rely on port-hopping (e.g. port 2222). Restrict administrative access to corporate management VPNs (10.0.100.0/24), disable password auth in favor of SSH keys, and decommission cleartext services.',

  shuffleItems: false,
};
