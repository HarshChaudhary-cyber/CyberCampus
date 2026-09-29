// ============================================================
// CyberCampus — Challenge Data: cc-nw-02
// Room: Network Security | Difficulty: Intermediate
// Title: "Firewall Rule Audit"
//
// All domains use RFC 2606 reserved example names (.example).
// All IPs use RFC 5737 documentation addresses or RFC 1918 private subnets.
// All organizations and personas are entirely fictional.
// ============================================================

import type { Challenge } from '../../types';

export const challengeCC_NW_02: Challenge = {
  id: 'cc-nw-02',
  roomId: 'network',
  difficulty: 'intermediate',
  title: 'Firewall Rule Audit',
  briefing:
    'You are performing a scheduled firewall audit on perimeter appliance fw-perimeter-01 at Veridian Logistics. The security team has provided the active ordered rule set alongside the enterprise network zone architecture, public Virtual IP (VIP) mappings, and change management tickets. Review the rules to detect overly broad access grants, shadowed configurations resulting from rule order, and redundant entries. Then analyze the potential security impact under the firewall’s post-DNAT inspection model and construct a least-privilege replacement rule.',

  // ── Evidence ──────────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-firewall-rules',
      type: 'network',
      label: 'Perimeter Firewall Policy (Active Ruleset)',
      content: {
        isFirewallPolicy: true,
        applianceName: 'fw-perimeter-01.veridian-logistics.example',
        policyName: 'FW-POL-2026-Q3-PROD',
        evaluationModel: 'First-Match-Wins with Default Deny (Post-DNAT Inspection)',
        lastAuditDate: '2026-09-15',
        firewallVendor: 'FortiGate Virtual Appliance v7.4.2',
        natArchitecture: {
          model: 'Perimeter Destination NAT (Post-DNAT Security Inspection)',
          summary:
            'Inbound Internet traffic arrives at public Virtual IPs (VIPs) within the 198.51.100.0/24 pool. The firewall translates public VIPs to internal private IP addresses (10.0.x.x) during pre-routing. Security policy filter rules are evaluated POST-DNAT against the translated internal destination IP and zone.',
          vipMappings: [
            {
              vip: '198.51.100.10',
              targetIp: '10.0.1.10',
              service: 'TCP 80, 443',
              zone: 'ZONE-DMZ',
              description: 'Public customer web portal mapped to DMZ web proxy',
            },
            {
              vip: '198.51.100.25',
              targetIp: '10.0.1.25',
              service: 'TCP 22',
              zone: 'ZONE-DMZ',
              description: 'Temporary vendor maintenance jump-host in DMZ',
            },
            {
              vip: '198.51.100.50',
              targetIp: '10.0.3.50',
              service: 'TCP 5432',
              zone: 'ZONE-DB',
              description: 'Direct database exposure VIP created during troubleshooting',
            },
          ],
        },
        zones: [
          {
            id: 'ZONE-WAN',
            name: 'External WAN (Internet)',
            cidr: '0.0.0.0/0',
            trustLevel: 'Untrusted (Public Internet)',
            description: 'Public Internet traffic entering or exiting the perimeter gateway via 198.51.100.0/24.',
          },
          {
            id: 'ZONE-DMZ',
            name: 'Perimeter DMZ',
            cidr: '10.0.1.0/24',
            trustLevel: 'Semi-Trusted',
            description: 'Public reverse proxy (10.0.1.10) and vendor maintenance jump-host (10.0.1.25).',
          },
          {
            id: 'ZONE-CORP',
            name: 'Corporate LAN',
            cidr: '10.0.2.0/24',
            trustLevel: 'Internal Trusted',
            description: 'Employee workstations, internal business applications, and local office subnets.',
          },
          {
            id: 'ZONE-DB',
            name: 'Secure Database Tier',
            cidr: '10.0.3.0/24',
            trustLevel: 'Restricted Confidential',
            description: 'PostgreSQL primary cluster (10.0.3.50) and customer billing data.',
          },
          {
            id: 'ZONE-MGMT',
            name: 'Management VPN',
            cidr: '10.0.100.0/24',
            trustLevel: 'Administrative Trusted',
            description: 'Dedicated IT and DevOps administrative bastion subnet with mandatory MFA.',
          },
        ],
        rulesTable: [
          {
            ruleNum: 1,
            id: 'rule-1',
            sourceZone: 'Any (0.0.0.0/0)',
            destZone: 'Any (0.0.0.0/0)',
            service: 'ESTABLISHED, RELATED',
            action: 'ACCEPT',
            log: false,
            ticket: 'SYS-BASELINE',
            description: 'Stateful inspection: permit return packets for established outgoing connections.',
          },
          {
            ruleNum: 2,
            id: 'rule-2',
            sourceZone: 'ZONE-WAN (Any)',
            destZone: 'DMZ Web Proxy (10.0.1.10/32 [VIP: 198.51.100.10])',
            service: 'TCP 80, 443 (HTTP/HTTPS)',
            action: 'ACCEPT',
            log: true,
            ticket: 'CHG-1044',
            description: 'Public customer web portal ingress. Traffic matching VIP 198.51.100.10 translates to DMZ proxy 10.0.1.10.',
          },
          {
            ruleNum: 3,
            id: 'rule-3',
            sourceZone: 'ZONE-MGMT (10.0.100.0/24)',
            destZone: 'Admin Bastion Host (10.0.100.10/32)',
            service: 'TCP 22 (SSH)',
            action: 'ACCEPT',
            log: true,
            ticket: 'CHG-2102',
            description:
              'Authorized remote administrative SSH access via VPN with MFA strictly to internal admin bastion host.',
          },
          {
            ruleNum: 4,
            id: 'rule-4',
            sourceZone: 'ZONE-WAN (0.0.0.0/0)',
            destZone: 'Internal Network (10.0.0.0/16 [Encompasses All Mapped Internal Targets])',
            service: 'Any (All Ports & Protocols)',
            action: 'ACCEPT',
            log: false,
            ticket: 'CHG-9941',
            description:
              'Temporary diagnostic rule requested by 3rd-party logistics vendor. Because post-DNAT destination 10.0.0.0/16 encompasses all internal subnets, WAN packets arriving at configured VIPs (such as the database VIP 198.51.100.50 on TCP 5432) are permitted through to their mapped internal destinations, shadowing Rule 5. Ticket closed 3 weeks ago without decommissioning.',
          },
          {
            ruleNum: 5,
            id: 'rule-5',
            sourceZone: 'ZONE-WAN (Any)',
            destZone: 'ZONE-DB (10.0.3.0/24 [DB VIP: 198.51.100.50])',
            service: 'Any (All Ports)',
            action: 'DROP',
            log: true,
            ticket: 'SEC-POL-04',
            description:
              'Perimeter database block: drop direct external WAN connections translated to database tier. (Shadowed by Rule 4 above).',
          },
          {
            ruleNum: 6,
            id: 'rule-6',
            sourceZone: 'DMZ Web Proxy (10.0.1.10/32)',
            destZone: 'Database Server (10.0.3.50/32)',
            service: 'TCP 5432 (PostgreSQL)',
            action: 'ACCEPT',
            log: true,
            ticket: 'CHG-3055',
            description: 'Backend database queries from DMZ web application.',
          },
          {
            ruleNum: 7,
            id: 'rule-7',
            sourceZone: 'DMZ Web Proxy (10.0.1.10/32)',
            destZone: 'Database Server (10.0.3.50/32)',
            service: 'TCP 5432 (PostgreSQL)',
            action: 'ACCEPT',
            log: false,
            ticket: 'CHG-3055-B',
            description: 'Duplicate entry created by shift operations during database failover test.',
          },
          {
            ruleNum: 8,
            id: 'rule-8',
            sourceZone: 'ZONE-CORP (10.0.2.0/24)',
            destZone: 'ZONE-WAN (Any)',
            service: 'TCP 80, 443 (HTTP/HTTPS)',
            action: 'ACCEPT',
            log: false,
            ticket: 'SYS-CORP-OUT',
            description: 'Outbound employee web browsing via secure web gateway.',
          },
          {
            ruleNum: 9,
            id: 'rule-9',
            sourceZone: 'Any',
            destZone: 'Any',
            service: 'Any',
            action: 'DROP',
            log: true,
            ticket: 'SYS-DEFAULT',
            description: 'Default implicit deny: drop all unmatched traffic.',
          },
        ],
      },
    },
    {
      id: 'ev-firewall-standards',
      type: 'policy',
      label: 'Enterprise Firewall Standard (SOP NET-201)',
      content: {
        title: 'Enterprise Firewall Rule Management & Ordering Standard',
        code: 'SOP NET-201',
        category: 'Network Security Policy',
        effectiveDate: '2026-02-01',
        classification: 'Internal Use Only',
        rules: [
          'Rule 1 (Top-to-Bottom First Match): Firewall rules are strictly evaluated in sequential order from top to bottom. The first rule whose criteria (source, destination, port, protocol) matches the packet executes immediately. Subsequent rules are never evaluated for that packet.',
          'Rule 2 (Shadowing Prohibited): A specific rule placed below a broader matching rule is "shadowed" and will never trigger. Placing an explicit deny rule after a broad allow rule renders the deny rule completely inert and useless.',
          'Rule 3 (Least-Privilege Addressing): Using classful wildcards (such as 10.0.0.0/16) or service wildcards (Any) is strictly prohibited on perimeter boundaries. Rules must specify exact host IPs (/32) or minimal CIDR subnets and explicit destination ports. Administrative access rules must terminate strictly on authorized bastion hosts (/32).',
          'Rule 4 (Change Ticket Hygiene & Expiration): The existence of an approved change ticket does not validate an insecure configuration. Temporary troubleshooting rules must be tagged with a sunset timestamp and automatically decommissioned upon ticket completion.',
          'Rule 5 (Deduplication): Redundant and duplicate rules degrade firewall inspection performance and create operational confusion. Duplicate entries must be purged during regular audit cycles.',
          'Rule 6 (Post-DNAT Security Policy Matching): Inbound perimeter security rules are evaluated post-DNAT. Filter rules match the translated internal destination IP, not the incoming public VIP. Overly broad internal destination subnets (e.g. 10.0.0.0/16) in WAN policies inadvertently permit incoming traffic to mapped internal destinations and services—such as mapped database VIPs—bypassing intended downstream tier blocks.',
        ],
      },
    },
  ],

  // ── Steps ─────────────────────────────────────────────────────────────────
  //
  // Step 1 (40 pts): Classify 5 key rules (classification, 5 items = 8 pts each, partial credit)
  // Step 2 (30 pts): Threat impact of Rule 4 (single-choice, no partial credit)
  // Step 3 (30 pts): Construct replacement rule (guided-form, 4 fields = 7.5 pts each, partial credit)
  //
  // Total: 100 pts. Pass threshold: 70.
  steps: [
    {
      id: 'step-rule-classification',
      prompt:
        'Review the active ruleset alongside the network zone architecture, VIP translation mappings, and SOP NET-201. Classify each of the highlighted rules according to its security posture and operational effect.',
      interaction: 'classification',
      partialCreditAllowed: true,
      pointValue: 40,
      items: [
        {
          id: 'rule-2',
          label: 'Rule 2: Inbound Web to DMZ (ZONE-WAN -> DMZ Proxy 10.0.1.10/32:80,443 ACCEPT)',
          options: [
            'Acceptable / Properly Scoped',
            'Too Permissive (Overly Broad)',
            'Ineffective (Shadowed / Order Flaw)',
            'Unnecessary (Redundant Duplicate)',
          ],
        },
        {
          id: 'rule-3',
          label: 'Rule 3: Admin SSH via VPN (ZONE-MGMT -> Admin Bastion 10.0.100.10/32:22 ACCEPT)',
          options: [
            'Acceptable / Properly Scoped',
            'Too Permissive (Overly Broad)',
            'Ineffective (Shadowed / Order Flaw)',
            'Unnecessary (Redundant Duplicate)',
          ],
        },
        {
          id: 'rule-4',
          label: 'Rule 4: Vendor Diagnostic Access (ZONE-WAN -> Internal 10.0.0.0/16:Any ACCEPT)',
          options: [
            'Acceptable / Properly Scoped',
            'Too Permissive (Overly Broad)',
            'Ineffective (Shadowed / Order Flaw)',
            'Unnecessary (Redundant Duplicate)',
          ],
        },
        {
          id: 'rule-5',
          label: 'Rule 5: Perimeter DB Ingress Block (ZONE-WAN -> DB Tier 10.0.3.0/24:Any DROP)',
          options: [
            'Acceptable / Properly Scoped',
            'Too Permissive (Overly Broad)',
            'Ineffective (Shadowed / Order Flaw)',
            'Unnecessary (Redundant Duplicate)',
          ],
        },
        {
          id: 'rule-7',
          label: 'Rule 7: Duplicate Web to DB (10.0.1.10 -> 10.0.3.50:5432 ACCEPT)',
          options: [
            'Acceptable / Properly Scoped',
            'Too Permissive (Overly Broad)',
            'Ineffective (Shadowed / Order Flaw)',
            'Unnecessary (Redundant Duplicate)',
          ],
        },
      ],
      answerKey: {
        'rule-2': 'Acceptable / Properly Scoped',
        'rule-3': 'Acceptable / Properly Scoped',
        'rule-4': 'Too Permissive (Overly Broad)',
        'rule-5': 'Ineffective (Shadowed / Order Flaw)',
        'rule-7': 'Unnecessary (Redundant Duplicate)',
      },
    },
    {
      id: 'step-threat-impact',
      prompt:
        'Under the firewall’s post-DNAT policy inspection model, analyze the operational and security impact of Rule 4 (CHG-9941). In conjunction with the perimeter VIP mappings, which traffic does Rule 4 actually permit through the firewall?',
      interaction: 'single-choice',
      partialCreditAllowed: false,
      pointValue: 30,
      items: [
        {
          id: 'impact-unrestricted-ingress',
          label:
            'Inbound WAN connections reaching the configured public VIP mappings and their services (including the database VIP on TCP 5432 translated to 10.0.3.50), completely shadowing Rule 5’s drop action due to first-match evaluation.',
        },
        {
          id: 'impact-ticket-validated',
          label:
            'Only legitimate diagnostic traffic from the vendor’s verified MAC address during authorized maintenance windows specified in ticket CHG-9941.',
        },
        {
          id: 'impact-stateful-return',
          label:
            'Only inbound responses to outbound requests originally initiated by internal corporate employees to the vendor website.',
        },
        {
          id: 'impact-dmz-only',
          label:
            'Inbound traffic to the DMZ web proxy on port 443 only, because DMZ rules always take precedence in perimeter routers.',
        },
      ],
      answerKey: { chosen: 'impact-unrestricted-ingress' },
    },
    {
      id: 'step-replacement-rule',
      prompt:
        'The 3rd-party logistics vendor only required temporary administrative SSH access from their corporate static IP (203.0.113.50) to the designated vendor jump-host in the DMZ (10.0.1.25/32 [mapped via VIP 198.51.100.25]). In accordance with SOP NET-201, build a properly scoped replacement rule for Rule 4.',
      interaction: 'guided-form',
      partialCreditAllowed: true,
      pointValue: 30,
      items: [
        {
          id: 'source',
          label: 'Source IP / Network',
          options: [
            'Vendor Office Static IP (203.0.113.50/32)',
            'Internet / Any (0.0.0.0/0)',
            'Internal Corporate LAN (10.0.2.0/24)',
            'Management VPN Subnet (10.0.100.0/24)',
          ],
        },
        {
          id: 'destination',
          label: 'Destination IP / Network',
          options: [
            'Vendor DMZ Jump-Host (10.0.1.25/32)',
            'Internal Subnets (10.0.0.0/16)',
            'Database Server (10.0.3.50/32)',
            'Corporate Network Gateway (10.0.1.1/32)',
          ],
        },
        {
          id: 'service',
          label: 'Service / Destination Port',
          options: [
            'TCP 22 (SSH)',
            'Any (All Ports & Protocols)',
            'TCP 80, 443 (HTTP/HTTPS)',
            'TCP 5432 (PostgreSQL)',
          ],
        },
        {
          id: 'action',
          label: 'Firewall Action',
          options: ['ACCEPT (Permit)', 'DROP (Silently Discard)', 'REJECT (Send TCP Reset)'],
        },
      ],
      answerKey: {
        source: 'Vendor Office Static IP (203.0.113.50/32)',
        destination: 'Vendor DMZ Jump-Host (10.0.1.25/32)',
        service: 'TCP 22 (SSH)',
        action: 'ACCEPT (Permit)',
      },
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Remember the fundamental firewall evaluation rule: top-to-bottom, first match wins. Under post-DNAT inspection, incoming WAN packets match rules based on their translated internal IP. If an earlier rule permits 10.0.0.0/16 on all ports, any traffic translated to the database subnet (10.0.3.0/24) will be accepted before reaching Rule 5.',
    'Examine Rule 4 and Rule 5. Rule 4 matches source "ZONE-WAN" to destination "10.0.0.0/16" on all ports. Because the database subnet (10.0.3.0/24) is inside 10.0.0.0/16, external packets translated to the database match Rule 4 and are accepted before Rule 5 can ever be evaluated.',
    'For the replacement rule, apply the principle of least privilege: specify the exact vendor static IP (/32), the specific jump-host in the DMZ (/32), and only port 22 (SSH). Never use a wildcard or broad subnet mask when a single host IP is sufficient.',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'firewall-rule-auditing',
    'rule-order-shadowing-analysis',
    'least-privilege-firewall-scoping',
    'network-segmentation-verification',
    'change-management-hygiene',
  ],

  // ── Scoring ───────────────────────────────────────────────────────────────
  passThreshold: 70,

  // ── Explanations ─────────────────────────────────────────────────────────
  successExplanation:
    'Outstanding firewall audit! You accurately analyzed the ordered rule set, identified dangerous shadowing under the post-DNAT evaluation model, confirmed least-privilege scoping on administrative access, and authored a tightly scoped replacement rule.\n\nAudit Findings Breakdown:\n1. Network Ingress & Post-DNAT Shadowing:\n- The perimeter firewall terminates public WAN traffic on public VIPs (198.51.100.0/24). Destination NAT translates incoming packets to private 10.0.x.x addresses in pre-routing, and security policy rules are evaluated post-DNAT against these translated targets.\n- Rule 4 permitted WAN traffic to 10.0.0.0/16 on all ports. Because the configured database VIP translates to 10.0.3.50 (which falls inside 10.0.0.0/16), and firewalls evaluate top-to-bottom stopping at the first match, Rule 4 permits external connections reaching that database VIP on TCP 5432 and completely shadowed Rule 5 (which intended to drop external traffic to the database tier).\n\n2. Management Access Scoping (Rule 3):\n- Rule 3 is properly scoped under SOP NET-201 because it restricts administrative SSH ingress from the management VPN subnet (10.0.100.0/24) exclusively to the designated administrative bastion host (10.0.100.10/32), avoiding broad subnet exposure.\n\n3. Change Ticket False Sense of Security (Rule 4):\n- Even though Rule 4 cited change ticket CHG-9941, the rule was over-scoped and had remained active three weeks after the vendor finished work. Change tickets do not excuse insecure rules.\n\n4. Rule Hygiene & Redundancy (Rule 7):\n- Rule 7 was an exact duplicate of Rule 6, adding unnecessary processing overhead and administrative confusion.\n\n5. Least-Privilege Replacement Rule:\n- The replacement rule correctly locks down source to the vendor’s static IP (203.0.113.50/32), destination to the DMZ jump-host (10.0.1.25/32), port to TCP 22 (SSH), and action to ACCEPT. This eliminates the broad 10.0.0.0/16 grant and un-shadows Rule 5 so the database tier is once again protected.',

  failureExplanation:
    'Effective firewall management requires understanding rule ordering, post-DNAT evaluation semantics, and the principle of least privilege.\n\nKey Firewall Principles:\n- Top-to-Bottom Evaluation: The first matching rule executes. Any specific deny rule (like Rule 5) placed below a broad allow rule (like Rule 4) is shadowed and completely ineffective for overlapping traffic.\n- Post-DNAT Policy Matching: On perimeter gateways with Virtual IPs, policy rules match against translated internal destination IPs. A broad destination like 10.0.0.0/16 permits traffic reaching mapped internal destinations and services—such as the database VIP on TCP 5432—shadowing subsequent protection rules like Rule 5.\n- Least-Privilege Rule 3: Administrative access must specify exact bastion host IPs (/32) rather than entire internal networks.\n- Change Tickets: Having a ticket number (CHG-9941) does not mean a rule is safe or should remain open indefinitely.\n- Replacement Strategy: Restrict source to the verified external IP (203.0.113.50/32), destination to the DMZ jump-host (10.0.1.25/32), and service strictly to SSH (TCP 22).',

  shuffleItems: false,
};
