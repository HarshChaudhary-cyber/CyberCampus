// ============================================================
// Challenge: cc-df-02 "Browser History Reconstruction"
// Room: Digital Forensics | Difficulty: Intermediate
// ============================================================

import type { Challenge } from '../../types';

export interface BrowserHistoryItem {
  id: number;
  recordId: string;
  url: string;
  title: string;
  visitTime: string;
  visitCount: number;
  typedCount: number;
  transition: 'typed' | 'link' | 'auto_subframe' | 'reload' | 'generated';
  hidden: boolean;
  notes?: string;
}

export interface BrowserHistoryContent {
  isBrowserHistory: boolean;
  sourceFile: string;
  host: string;
  browserProfile: string;
  totalRecords: number;
  caseReference: string;
  guidanceNote?: {
    title: string;
    rules: string[];
  };
  records: BrowserHistoryItem[];
}

export interface ProxyLogEntry {
  id: string;
  timestamp: string;
  clientIp: string;
  user: string;
  method: 'GET' | 'POST' | 'CONNECT' | 'HEAD';
  destinationUrl: string;
  host: string;
  statusCode: number;
  bytesSent: number;
  bytesReceived: number;
  durationMs: number;
  category: string;
  notes?: string;
}

export interface ProxyLogContent {
  isProxyLog: boolean;
  appliance: string;
  logFile: string;
  timeRange: string;
  monitoredClientIp: string;
  authenticatedUser: string;
  guidanceNote?: {
    title: string;
    rules: string[];
  };
  entries: ProxyLogEntry[];
}

export interface WorkstationTelemetryContent {
  title: string;
  code: string;
  category: string;
  effectiveDate: string;
  classification: string;
  rules: string[];
  systemEvents: {
    eventId: number;
    provider: string;
    timestamp: string;
    description: string;
    powerState: string;
  }[];
}

export const challengeCC_DF_02: Challenge = {
  id: 'cc-df-02',
  roomId: 'forensics',
  difficulty: 'intermediate',
  title: 'Browser History Reconstruction',
  briefing:
    'Management received an anonymous tip alleging that Senior Logistics Planner Claire Renaud browsed competitor intelligence sites and exfiltrated proprietary corporate route data via an external file locker during a blackout period. Investigators extracted the workstation browser history (History SQLite table) from ws-ops-14.veridian-logistics.example. Claire disputes the allegations, asserting she never accessed the competitor site and was offline during the alleged off-hours timeframe. Correlate the 25 browser history records against the company’s NTP-synchronized forward proxy logs and workstation power telemetry. Distinguish confirmed facts from provisional hypotheses: identify corroborated network visits, evaluate the SQLite timestamp sequencing anomaly alongside benign possibilities (such as delayed sync or import) and telemetry inconsistencies (sleep state and proxy coverage limits), reconstruct the corroborated upload sequence, and formulate a defensible forensic conclusion.',

  // ── Evidence ──────────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-browser-history',
      type: 'file',
      label: 'Workstation Browser History (urls table export)',
      content: {
        isBrowserHistory: true,
        sourceFile:
          'C:\\Users\\claire.renaud\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\History',
        host: 'ws-ops-14.veridian-logistics.example (Client IP: 198.51.100.42)',
        browserProfile: 'Default (Google Chrome v128.0.6613.138)',
        totalRecords: 25,
        caseReference: 'IR-2026-1002-BROWSER',
        guidanceNote: {
          title: 'Browser SQLite Artifact Analysis Principles',
          rules: [
            '1. Local Table vs Network Reality: Browser history records URLs stored locally in SQLite. A record indicates an entry was written, but independent network telemetry (proxy/firewall/DNS) is required to confirm external data transmission.',
            '2. SQLite Auto-Increment Sequencing Anomaly: In Chromium history databases, the primary key "id" is an auto-increment integer assigned upon record creation. Entries with higher IDs but older timestamps represent a sequencing anomaly requiring independent corroboration; possible benign causes include delayed commit of background sessions, profile import/restoration, multi-device cloud synchronization, or local clock adjustments.',
            '3. Transition Types: "typed" denotes direct address bar keystrokes, "link" indicates following a hyperlink, and "auto_subframe" represents secondary resources (tracking beacons, embedded ads, fonts) loaded passively without direct user initiation.',
          ],
        },
        records: [
          {
            id: 1,
            recordId: 'bh-01',
            url: 'https://intranet.veridian-logistics.example/portal',
            title: 'Veridian Employee Portal',
            visitTime: '2026-10-02 08:30:10 UTC',
            visitCount: 42,
            typedCount: 12,
            transition: 'typed',
            hidden: false,
          },
          {
            id: 2,
            recordId: 'bh-02',
            url: 'https://auth.veridian-logistics.example/oauth/login',
            title: 'Single Sign-On Authentication',
            visitTime: '2026-10-02 08:31:05 UTC',
            visitCount: 38,
            typedCount: 0,
            transition: 'link',
            hidden: false,
          },
          {
            id: 3,
            recordId: 'bh-03',
            url: 'https://jira.veridian-logistics.example/browse/LOG-4412',
            title: '[LOG-4412] European Freight Route Optimization',
            visitTime: '2026-10-02 08:45:22 UTC',
            visitCount: 5,
            typedCount: 0,
            transition: 'link',
            hidden: false,
          },
          {
            id: 4,
            recordId: 'bh-04',
            url: 'https://docs.veridian-logistics.example/spreadsheets/d/route-manifest-2026',
            title: 'Q4 European Transit Schedules - Veridian Docs',
            visitTime: '2026-10-02 09:12:40 UTC',
            visitCount: 14,
            typedCount: 0,
            transition: 'link',
            hidden: false,
          },
          {
            id: 5,
            recordId: 'bh-05',
            url: 'https://mail.veridian-logistics.example/inbox',
            title: 'Webmail - claire.renaud@veridian-logistics.example',
            visitTime: '2026-10-02 09:40:15 UTC',
            visitCount: 88,
            typedCount: 24,
            transition: 'typed',
            hidden: false,
          },
          {
            id: 6,
            recordId: 'bh-06',
            url: 'https://search.example.org/search?q=maritime+diesel+fuel+surcharges',
            title: 'maritime diesel fuel surcharges - ExampleSearch',
            visitTime: '2026-10-02 10:15:30 UTC',
            visitCount: 1,
            typedCount: 1,
            transition: 'typed',
            hidden: false,
          },
          {
            id: 7,
            recordId: 'bh-07',
            url: 'https://port-authority.example.org/tariffs/2026',
            title: 'Rotterdam Port Tariff Schedule 2026',
            visitTime: '2026-10-02 10:17:45 UTC',
            visitCount: 2,
            typedCount: 0,
            transition: 'link',
            hidden: false,
          },
          {
            id: 8,
            recordId: 'bh-08',
            url: 'https://analytics.ad-tracker.example.com/collect?sid=vld889',
            title: 'Third-Party Analytics Beacon',
            visitTime: '2026-10-02 10:17:46 UTC',
            visitCount: 1,
            typedCount: 0,
            transition: 'auto_subframe',
            hidden: true,
            notes:
              'Passive tracking pixel loaded via iframe on port-authority.example.org; no direct user navigation.',
          },
          {
            id: 9,
            recordId: 'bh-09',
            url: 'https://cdn.font-assets.example.net/fonts/inter.woff2',
            title: 'Web Font Delivery Asset',
            visitTime: '2026-10-02 10:17:47 UTC',
            visitCount: 1,
            typedCount: 0,
            transition: 'auto_subframe',
            hidden: true,
            notes: 'Static web font stylesheet resource fetch; passive sub-resource.',
          },
          {
            id: 10,
            recordId: 'bh-10',
            url: 'https://weather-marine.example.org/north-sea-forecast',
            title: 'North Sea Commercial Shipping Weather',
            visitTime: '2026-10-02 10:45:12 UTC',
            visitCount: 1,
            typedCount: 0,
            transition: 'link',
            hidden: false,
          },
          {
            id: 11,
            recordId: 'bh-11',
            url: 'https://jira.veridian-logistics.example/browse/LOG-4418',
            title: '[LOG-4418] Baltic Corridor Fleet Rebalancing',
            visitTime: '2026-10-02 11:20:00 UTC',
            visitCount: 3,
            typedCount: 0,
            transition: 'link',
            hidden: false,
          },
          {
            id: 12,
            recordId: 'bh-12',
            url: 'https://confluence.veridian-logistics.example/wiki/ops-handbook',
            title: 'Operations Standard Procedures - Wiki',
            visitTime: '2026-10-02 11:50:33 UTC',
            visitCount: 11,
            typedCount: 0,
            transition: 'link',
            hidden: false,
          },
          {
            id: 13,
            recordId: 'bh-13',
            url: 'https://lunch-order.example.com/menu',
            title: 'Downtown Deli Express - Lunch Ordering',
            visitTime: '2026-10-02 12:15:10 UTC',
            visitCount: 6,
            typedCount: 2,
            transition: 'typed',
            hidden: false,
          },
          {
            id: 14,
            recordId: 'bh-14',
            url: 'https://jira.veridian-logistics.example/browse/LOG-4420',
            title: '[LOG-4420] Acquisition Fleet Valuation',
            visitTime: '2026-10-02 13:10:05 UTC',
            visitCount: 2,
            typedCount: 0,
            transition: 'link',
            hidden: false,
          },
          {
            id: 15,
            recordId: 'bh-15',
            url: 'https://docs.veridian-logistics.example/export/route-valuation-confidential.xlsx',
            title: 'Downloading route-valuation-confidential.xlsx',
            visitTime: '2026-10-02 13:42:19 UTC',
            visitCount: 1,
            typedCount: 0,
            transition: 'link',
            hidden: false,
            notes: 'Internal report export containing confidential model schedules.',
          },
          {
            id: 16,
            recordId: 'bh-16',
            url: 'https://search.example.org/search?q=free+anonymous+file+drop',
            title: 'free anonymous file drop - ExampleSearch',
            visitTime: '2026-10-02 14:10:02 UTC',
            visitCount: 1,
            typedCount: 1,
            transition: 'typed',
            hidden: false,
          },
          {
            id: 17,
            recordId: 'bh-17',
            url: 'https://drop-vault.example.net/upload',
            title: 'DropVault - Fast Encrypted File Storage',
            visitTime: '2026-10-02 14:22:45 UTC',
            visitCount: 1,
            typedCount: 1,
            transition: 'typed',
            hidden: false,
          },
          {
            id: 18,
            recordId: 'bh-18',
            url: 'https://drop-vault.example.net/share/confirm?id=dv-99201',
            title: 'DropVault - Share Link Generated',
            visitTime: '2026-10-02 14:24:18 UTC',
            visitCount: 1,
            typedCount: 0,
            transition: 'link',
            hidden: false,
          },
          {
            id: 19,
            recordId: 'bh-19',
            url: 'https://mail.veridian-logistics.example/compose',
            title: 'Compose Message - Webmail',
            visitTime: '2026-10-02 14:35:10 UTC',
            visitCount: 4,
            typedCount: 0,
            transition: 'link',
            hidden: false,
          },
          {
            id: 20,
            recordId: 'bh-20',
            url: 'https://jira.veridian-logistics.example/browse/LOG-4425',
            title: '[LOG-4425] End-of-Day Shift Handover',
            visitTime: '2026-10-02 15:05:40 UTC',
            visitCount: 1,
            typedCount: 0,
            transition: 'link',
            hidden: false,
          },
          {
            id: 21,
            recordId: 'bh-21',
            url: 'https://support.example.com/tickets/urgent-patch-download',
            title: 'Customer Support Portal - Knowledgebase',
            visitTime: '2026-10-02 15:20:10 UTC',
            visitCount: 1,
            typedCount: 0,
            transition: 'link',
            hidden: false,
            notes: 'Vendor support ticket documentation referenced in IT maintenance guide.',
          },
          {
            id: 22,
            recordId: 'bh-22',
            url: 'https://transit-schedule.example.org/metro/line4',
            title: 'Metro Line 4 Evening Timetable',
            visitTime: '2026-10-02 16:45:22 UTC',
            visitCount: 3,
            typedCount: 1,
            transition: 'typed',
            hidden: false,
          },
          {
            id: 23,
            recordId: 'bh-23',
            url: 'https://global-competitor-freight.example.com/insider-pricing',
            title: 'Global Competitor Freight - Internal Rates',
            visitTime: '2026-10-01 23:45:10 UTC',
            visitCount: 1,
            typedCount: 1,
            transition: 'typed',
            hidden: false,
            notes:
              'Disputed entry alleging off-hours espionage. Sequencing anomaly: SQLite rowid=23 exhibits a timestamp earlier than rowid=1, requiring corroboration and assessment of benign causes alongside telemetry.',
          },
          {
            id: 24,
            recordId: 'bh-24',
            url: 'https://paste-dump.example.org/p/leak-771',
            title: 'PasteDump - Leak 771',
            visitTime: '2026-10-01 23:47:30 UTC',
            visitCount: 1,
            typedCount: 0,
            transition: 'link',
            hidden: false,
            notes:
              'Disputed entry alleging off-hours paste leak. Sequencing anomaly: rowid=24 predates rowid=1 daytime records, requiring multi-source corroboration.',
          },
          {
            id: 25,
            recordId: 'bh-25',
            url: 'https://dark-broker.example.com/market',
            title: 'Dark Broker Marketplace',
            visitTime: '2026-10-01 23:52:14 UTC',
            visitCount: 1,
            typedCount: 1,
            transition: 'typed',
            hidden: false,
            notes:
              'Disputed entry alleging dark web data brokerage. Sequencing anomaly: rowid=25 predates rowid=1 daytime records, requiring multi-source corroboration.',
          },
        ],
      },
    },
    {
      id: 'ev-proxy-logs',
      type: 'log',
      label: 'Forward Proxy Egress Logs (proxy01-access.log)',
      content: {
        isProxyLog: true,
        appliance: 'proxy01.internal.veridian-logistics.example (Squid/5.9 NTP-Sync)',
        logFile: '/var/log/squid/access.log.2026-10-02',
        timeRange: '2026-10-01 22:00:00 UTC – 2026-10-02 17:00:00 UTC',
        monitoredClientIp: '198.51.100.42 (ws-ops-14)',
        authenticatedUser: 'VL\\claire.renaud',
        guidanceNote: {
          title: 'Proxy Log Audit & Egress Corroboration Notes',
          rules: [
            '1. Independent Synchronization: Proxy records are timestamped by the central gateway server synced via stratum-1 NTP, completely independent of local workstation system clocks.',
            '2. Payload Volumetrics: Payloads with high bytesSent (e.g. multi-megabyte POST requests) indicate significant outbound file uploads rather than routine metadata exchanges.',
            '3. Telemetry Coverage & Evidentiary Scope: The forward proxy captures standard corporate subnet HTTP/HTTPS egress. Zero log records exist for client 198.51.100.42 between 2026-10-01 22:00:00 and 2026-10-02 08:29:59 UTC, leaving the alleged off-hours browsing uncorroborated by proxy telemetry. Examiners must recognize logging limitations: absence of records in a single log source is not universal proof that an event never occurred via alternative network paths.',
          ],
        },
        entries: [
          {
            id: 'px-01',
            timestamp: '2026-10-02 08:30:10 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://intranet.veridian-logistics.example/portal',
            host: 'intranet.veridian-logistics.example',
            statusCode: 200,
            bytesSent: 540,
            bytesReceived: 18200,
            durationMs: 45,
            category: 'Corporate Intranet',
          },
          {
            id: 'px-02',
            timestamp: '2026-10-02 08:31:05 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://auth.veridian-logistics.example/oauth/login',
            host: 'auth.veridian-logistics.example',
            statusCode: 200,
            bytesSent: 420,
            bytesReceived: 4100,
            durationMs: 38,
            category: 'Authentication',
          },
          {
            id: 'px-03',
            timestamp: '2026-10-02 08:45:22 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://jira.veridian-logistics.example/browse/LOG-4412',
            host: 'jira.veridian-logistics.example',
            statusCode: 200,
            bytesSent: 620,
            bytesReceived: 34600,
            durationMs: 110,
            category: 'Business Operations',
          },
          {
            id: 'px-04',
            timestamp: '2026-10-02 09:12:40 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl:
              'https://docs.veridian-logistics.example/spreadsheets/d/route-manifest-2026',
            host: 'docs.veridian-logistics.example',
            statusCode: 200,
            bytesSent: 840,
            bytesReceived: 142000,
            durationMs: 240,
            category: 'Document Management',
          },
          {
            id: 'px-05',
            timestamp: '2026-10-02 09:40:15 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://mail.veridian-logistics.example/inbox',
            host: 'mail.veridian-logistics.example',
            statusCode: 200,
            bytesSent: 510,
            bytesReceived: 56400,
            durationMs: 95,
            category: 'Corporate Webmail',
          },
          {
            id: 'px-06',
            timestamp: '2026-10-02 10:15:30 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl:
              'https://search.example.org/search?q=maritime+diesel+fuel+surcharges',
            host: 'search.example.org',
            statusCode: 200,
            bytesSent: 480,
            bytesReceived: 28100,
            durationMs: 82,
            category: 'Search Engines',
          },
          {
            id: 'px-07',
            timestamp: '2026-10-02 10:17:45 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://port-authority.example.org/tariffs/2026',
            host: 'port-authority.example.org',
            statusCode: 200,
            bytesSent: 560,
            bytesReceived: 84300,
            durationMs: 145,
            category: 'Transportation & Logistics',
          },
          {
            id: 'px-08',
            timestamp: '2026-10-02 10:17:46 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://analytics.ad-tracker.example.com/collect?sid=vld889',
            host: 'analytics.ad-tracker.example.com',
            statusCode: 200,
            bytesSent: 380,
            bytesReceived: 142,
            durationMs: 32,
            category: 'Web Analytics & Advertising',
            notes: 'Referer: port-authority.example.org; automated iframe tracking pixel',
          },
          {
            id: 'px-09',
            timestamp: '2026-10-02 10:17:47 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://cdn.font-assets.example.net/fonts/inter.woff2',
            host: 'cdn.font-assets.example.net',
            statusCode: 200,
            bytesSent: 320,
            bytesReceived: 45100,
            durationMs: 40,
            category: 'Content Delivery Network',
          },
          {
            id: 'px-10',
            timestamp: '2026-10-02 10:45:12 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://weather-marine.example.org/north-sea-forecast',
            host: 'weather-marine.example.org',
            statusCode: 200,
            bytesSent: 490,
            bytesReceived: 62000,
            durationMs: 90,
            category: 'Weather Information',
          },
          {
            id: 'px-11',
            timestamp: '2026-10-02 11:20:00 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://jira.veridian-logistics.example/browse/LOG-4418',
            host: 'jira.veridian-logistics.example',
            statusCode: 200,
            bytesSent: 580,
            bytesReceived: 31200,
            durationMs: 105,
            category: 'Business Operations',
          },
          {
            id: 'px-12',
            timestamp: '2026-10-02 11:50:33 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://confluence.veridian-logistics.example/wiki/ops-handbook',
            host: 'confluence.veridian-logistics.example',
            statusCode: 200,
            bytesSent: 610,
            bytesReceived: 52800,
            durationMs: 118,
            category: 'Knowledgebase',
          },
          {
            id: 'px-13',
            timestamp: '2026-10-02 12:15:10 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://lunch-order.example.com/menu',
            host: 'lunch-order.example.com',
            statusCode: 200,
            bytesSent: 440,
            bytesReceived: 12400,
            durationMs: 65,
            category: 'Dining & Food',
          },
          {
            id: 'px-14',
            timestamp: '2026-10-02 13:10:05 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://jira.veridian-logistics.example/browse/LOG-4420',
            host: 'jira.veridian-logistics.example',
            statusCode: 200,
            bytesSent: 590,
            bytesReceived: 29800,
            durationMs: 100,
            category: 'Business Operations',
          },
          {
            id: 'px-15',
            timestamp: '2026-10-02 13:42:19 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl:
              'https://docs.veridian-logistics.example/export/route-valuation-confidential.xlsx',
            host: 'docs.veridian-logistics.example',
            statusCode: 200,
            bytesSent: 950,
            bytesReceived: 2450000,
            durationMs: 820,
            category: 'Document Management',
            notes: 'Confidential corporate file download; 2.45 MB payload returned to client',
          },
          {
            id: 'px-16',
            timestamp: '2026-10-02 14:10:02 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://search.example.org/search?q=free+anonymous+file+drop',
            host: 'search.example.org',
            statusCode: 200,
            bytesSent: 520,
            bytesReceived: 24500,
            durationMs: 76,
            category: 'Search Engines',
          },
          {
            id: 'px-17',
            timestamp: '2026-10-02 14:22:45 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'POST',
            destinationUrl: 'https://drop-vault.example.net/upload',
            host: 'drop-vault.example.net',
            statusCode: 200,
            bytesSent: 18432000,
            bytesReceived: 1240,
            durationMs: 3450,
            category: 'Uncategorized / External Cloud Storage',
            notes:
              'High-volume outbound payload upload; 18.43 MB transmitted via HTTP multipart POST (corroborated outbound upload; confidential-data exfiltration remains a provisional hypothesis pending independent payload verification)',
          },
          {
            id: 'px-18',
            timestamp: '2026-10-02 14:24:18 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://drop-vault.example.net/share/confirm?id=dv-99201',
            host: 'drop-vault.example.net',
            statusCode: 200,
            bytesSent: 480,
            bytesReceived: 3400,
            durationMs: 88,
            category: 'External Cloud Storage',
            notes: 'Retrieval link generated: share id dv-99201',
          },
          {
            id: 'px-19',
            timestamp: '2026-10-02 14:35:10 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://mail.veridian-logistics.example/compose',
            host: 'mail.veridian-logistics.example',
            statusCode: 200,
            bytesSent: 530,
            bytesReceived: 48000,
            durationMs: 92,
            category: 'Corporate Webmail',
          },
          {
            id: 'px-20',
            timestamp: '2026-10-02 15:05:40 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://jira.veridian-logistics.example/browse/LOG-4425',
            host: 'jira.veridian-logistics.example',
            statusCode: 200,
            bytesSent: 570,
            bytesReceived: 30100,
            durationMs: 98,
            category: 'Business Operations',
          },
          {
            id: 'px-21',
            timestamp: '2026-10-02 15:20:10 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://support.example.com/tickets/urgent-patch-download',
            host: 'support.example.com',
            statusCode: 200,
            bytesSent: 460,
            bytesReceived: 16500,
            durationMs: 70,
            category: 'Technical Support',
          },
          {
            id: 'px-22',
            timestamp: '2026-10-02 16:45:22 UTC',
            clientIp: '198.51.100.42',
            user: 'VL\\claire.renaud',
            method: 'GET',
            destinationUrl: 'https://transit-schedule.example.org/metro/line4',
            host: 'transit-schedule.example.org',
            statusCode: 200,
            bytesSent: 410,
            bytesReceived: 14200,
            durationMs: 62,
            category: 'Public Transit',
          },
        ],
      },
    },
    {
      id: 'ev-telemetry-sop',
      type: 'policy',
      label: 'Host Power Telemetry & Browser SOP (SOP FOR-202)',
      content: {
        title: 'SOP FOR-202: Browser History & Artifact Correlation Standards',
        code: 'SOP-FOR-202-REV1',
        category: 'DIGITAL FORENSICS STANDARD OPERATING PROCEDURE',
        effectiveDate: '2026-03-01',
        classification: 'INTERNAL FORENSIC STANDARD',
        rules: [
          'Rule 1 (Multi-Source Corroboration Requirement): An entry in a browser history SQLite table demonstrates only that text was committed to the local database file. Examiners must never treat a browser record in isolation as conclusive proof of web navigation. Corroboration against independent network records (forward proxy logs, stateful perimeter firewalls, or DNS resolver queries) is mandatory.',
          'Rule 2 (SQLite Auto-Increment & Timestamp Sequencing Anomaly): In Chromium-based history databases, urls.id and visits.id are sequentially assigned auto-incrementing integers upon row insertion. When records bearing higher primary keys exhibit timestamps earlier than lower primary keys, this establishes a sequencing anomaly requiring independent corroboration. Rather than treating this pattern as standalone proof of manual insertion, tampering, or backdating, examiners must evaluate alternative benign explanations including delayed recording, profile import, multi-device synchronization, or system clock adjustments.',
          'Rule 3 (Transition Types & Passive Web Assets): Evaluators must check the transition flag before attributing user intent. Direct user navigation is marked "typed" or "generated". In contrast, entries with "auto_subframe" or "auto_toplevel" represent passive background assets (such as tracking pixels, embedded advertisements, or iframes) loaded automatically by external websites without user action.',
          'Rule 4 (Host Telemetry & Coverage Boundaries): Hardware power state telemetry (e.g. Windows Kernel-Power Event ID 42 Sleep and Event ID 1 Resume) documents physical host state. Standard interactive local browsing is inconsistent with ACPI S3 sleep. However, examiners must document logging coverage and limitations: sleep-state conflicts and missing proxy records indicate the alleged activity is uncorroborated by and inconsistent with available telemetry, but absence of evidence in specific logs cannot be asserted as universal negative proof across all possible channels.',
          'Rule 5 (Evidence Preservation & Journal Files): When acquiring SQLite database files, examiners must capture both the primary database container and its accompanying Write-Ahead Log (-wal) and Shared Memory (-shm) files. All forensic analyses must be conducted exclusively on verified working copies.',
          'Workstation ws-ops-14 Power Event Log: Event ID 42 (Kernel-Power) recorded on 2026-10-01 17:15:00 UTC (System entering ACPI S3 sleep state; Reason: User idle). Event ID 1 (Kernel-General / Power-Troubleshooter) recorded on 2026-10-02 08:22:15 UTC (System resumed from sleep; Sleep duration: 54,435 seconds). Zero user logins or interactive sessions occurred between these timestamps.',
        ],
      },
    },
  ],

  // ── Steps ──────────────────────────────────────────────────────────────────
  steps: [
    // Step 1: Corroborating Disputed Visits (30 pts, multi-choice, partial credit)
    {
      id: 'step-corroborated-visits',
      prompt:
        'Which of the following browser history entries are corroborated by independent forward proxy logs as actual outbound network traffic from workstation ws-ops-14? Select the 3 confirmed visits.',
      interaction: 'multi-choice',
      items: [
        {
          id: 'corr-drop-vault',
          label:
            'https://drop-vault.example.net/upload (2026-10-02 14:22:45 UTC) — Matched by proxy log with an 18.4 MB POST upload from 198.51.100.42',
        },
        {
          id: 'corr-search-filedrop',
          label:
            'https://search.example.org/search?q=free+anonymous+file+drop (2026-10-02 14:10:02 UTC) — Matched by proxy log with a 24.5 KB search query',
        },
        {
          id: 'corr-route-docs',
          label:
            'https://docs.veridian-logistics.example/export/route-valuation-confidential.xlsx (2026-10-02 13:42:19 UTC) — Matched by proxy log with a 2.4 MB document export',
        },
        {
          id: 'corr-competitor',
          label:
            'https://global-competitor-freight.example.com/insider-pricing (2026-10-01 23:45:10 UTC) — Alleged off-hours competitor rate browsing',
        },
        {
          id: 'corr-dark-broker',
          label:
            'https://dark-broker.example.com/market (2026-10-01 23:52:14 UTC) — Alleged off-hours marketplace navigation',
        },
        {
          id: 'corr-ad-tracker',
          label:
            'https://analytics.ad-tracker.example.com/collect?sid=vld889 (2026-10-02 10:17:46 UTC) — Deliberate manual user navigation to a commercial intelligence platform',
        },
      ],
      answerKey: {
        chosen: ['corr-drop-vault', 'corr-search-filedrop', 'corr-route-docs'],
      },
      pointValue: 30,
      partialCreditAllowed: true,
    },

    // Step 2: Anomaly & Tampering Detection (25 pts, single-choice)
    {
      id: 'step-tampering-indicators',
      prompt:
        'Which forensic assessment accurately reflects the disputed off-hours entries on 2026-10-01 (global-competitor-freight.example.com and dark-broker.example.com) across the available host and network telemetry?',
      interaction: 'single-choice',
      items: [
        {
          id: 'anom-id-telemetry',
          label:
            'The entries show an SQLite ID sequencing anomaly (#23–#25 older than #1–#22) requiring corroboration rather than proving tampering, while the browsing is uncorroborated by proxy logs and inconsistent with host telemetry showing ws-ops-14 in S3 ACPI sleep (subject to log coverage limitations).',
        },
        {
          id: 'anom-url-protocol',
          label:
            'The URLs used HTTPS instead of HTTP, which automatically invalidates all local browser history entries.',
        },
        {
          id: 'anom-single-visit',
          label:
            'The visit_count field was 1, and forensic guidelines specify that any site visited only once is considered a simulated phantom record.',
        },
        {
          id: 'anom-cookie-missing',
          label:
            'The browser profile lacked persistent cookies for ExampleSearch, proving the workstation was restored from a snapshot.',
        },
      ],
      answerKey: { chosen: 'anom-id-telemetry' },
      pointValue: 25,
      partialCreditAllowed: false,
    },

    // Step 3: Reconstructing Exfiltration Sequence (25 pts, ordering, partial credit)
    {
      id: 'step-exfiltration-sequence',
      prompt:
        'Reconstruct the sequence of verified events surrounding the suspected data staging and corroborated upload in chronological order from earliest to latest.',
      interaction: 'ordering',
      items: [
        {
          id: 'seq-export',
          label:
            '13:42 UTC — Export confidential route valuation spreadsheet (route-valuation-confidential.xlsx) from internal documentation portal',
        },
        {
          id: 'seq-search',
          label:
            '14:10 UTC — Search for anonymous file drop services on ExampleSearch (query: "free anonymous file drop")',
        },
        {
          id: 'seq-upload',
          label:
            '14:22 UTC — Upload 18.4 MB payload to DropVault (POST https://drop-vault.example.net/upload) — Corroborated upload (confidential exfiltration remains provisional pending payload identification)',
        },
        {
          id: 'seq-confirm',
          label:
            '14:24 UTC — Access DropVault share confirmation page (share/confirm?id=dv-99201) to obtain the download link',
        },
      ],
      answerKey: {
        order: ['seq-export', 'seq-search', 'seq-upload', 'seq-confirm'],
      },
      pointValue: 25,
      partialCreditAllowed: true,
    },

    // Step 4: Evidence Reporting & Preservation Protocol (20 pts, single-choice)
    {
      id: 'step-reporting-preservation',
      prompt:
        'Under SOP FOR-202, how must the forensic investigator document these findings in the investigation report and preserve the database evidence?',
      interaction: 'single-choice',
      items: [
        {
          id: 'pres-defensible',
          label:
            'Report the 18.4 MB DropVault POST as a corroborated outbound upload while keeping confidential-data exfiltration provisional pending payload identification, document off-hours entries as uncorroborated by proxy telemetry, inconsistent with host sleep state, and an anomaly requiring corroboration, and preserve History alongside History-wal and History-shm files.',
        },
        {
          id: 'pres-blame-competitor',
          label:
            'Formally charge Claire with confirmed confidential route exfiltration and intentional database tampering, claiming that the SQLite ID inversion and absence from proxy logs definitively prove malicious backdating.',
        },
        {
          id: 'pres-delete-anomalies',
          label:
            'Execute an SQL DELETE statement to strip rows #23–#25 from the SQLite database before hashing to prevent confusion in the evidence exhibit.',
        },
        {
          id: 'pres-discard-journals',
          label:
            'Preserve only the main History database file while deleting WAL and SHM files to reduce forensic storage requirements.',
        },
      ],
      answerKey: { chosen: 'pres-defensible' },
      pointValue: 20,
      partialCreditAllowed: false,
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Cross-reference each disputed browser entry with the forward proxy logs (proxy01-access.log). Remember the core forensic rule: an entry in browser history alone only proves text exists in a local database file, not that data was actually transmitted across the network.',
    'Examine the SQLite primary key id values for the off-hours entries (#23, #24, #25). Higher auto-increment keys with older timestamps indicate an anomaly requiring corroboration; consider possible benign causes (delayed sync/import) alongside telemetry showing ws-ops-14 in S3 sleep and missing from proxy logs.',
    'Distinguish deliberate navigation from passive background scripts (auto_subframe). The corroborated sequence connects the 13:42 UTC spreadsheet export, search queries, and 18.4 MB DropVault upload; keep content exfiltration provisional unless independent evidence verifies the uploaded payload.',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'browser-history-forensics',
    'timeline-reconstruction',
    'proxy-log-correlation',
    'anti-forensics-tampering-detection',
    'evidence-preservation',
  ],

  // ── Scoring ───────────────────────────────────────────────────────────────
  passThreshold: 70,

  // ── Explanations ─────────────────────────────────────────────────────────
  successExplanation:
    'Outstanding digital forensics investigation! You distinguished confirmed facts from provisional hypotheses: you correlated local browser history against independent proxy telemetry, recognized the SQLite auto-increment sequencing anomaly while evaluating telemetry inconsistencies and coverage limits, reconstructed the corroborated upload timeline, and adhered to defensible evidence standards.\n\nInvestigation Breakdown:\n1. Cross-Source Corroboration & Logging Limits:\n- Corroborating with independent proxy logs demonstrated that the alleged off-hours visits to global-competitor-freight.example.com and dark-broker.example.com at 23:45 UTC on 2026-10-01 have zero proxy records. While absence from a single log is not universal proof that an event never occurred, it leaves the alleged browsing uncorroborated by network telemetry.\n- Conversely, the visits to search.example.org (14:10 UTC) and drop-vault.example.net (14:22 UTC with an 18.4 MB POST upload) were fully corroborated by authenticated forward proxy logs matching Claire\'s IP (198.51.100.42).\n\n2. SQLite ID Sequencing Anomaly & Telemetry Inconsistency:\n- Entries 23–25 have higher auto-increment IDs with earlier timestamps than entries 1–22. Rather than jumping to an assumption of tampering, sound forensics treats this as an anomaly requiring corroboration, acknowledging potential benign causes (delayed sync, profile import, or clock adjustments).\n- Workstation power telemetry provides crucial context: ws-ops-14 was recorded in S3 ACPI sleep from 17:15 UTC on Oct 1 until 08:22 UTC on Oct 2, making local interactive browsing inconsistent with available host state.\n\n3. Corroborated Upload vs Provisional Exfiltration:\n- The 18.4 MB POST request to DropVault at 14:22 UTC is a corroborated upload. While circumstantial timing (following the 13:42 UTC export of route-valuation-confidential.xlsx) strongly supports the exfiltration hypothesis, the finding remains provisional until independent evidence directly inspects or confirms the uploaded payload content.\n\n4. Passive Assets vs User Navigation:\n- The entry for analytics.ad-tracker.example.com had an auto_subframe transition, reflecting an automated third-party tracking asset loaded passively rather than intentional user browsing.\n\n5. Forensic Integrity & Evidence Preservation:\n- Defensible reporting notes confirmed facts, articulates hypotheses with appropriate confidence levels, and preserves SQLite databases along with their -wal and -shm journal files.',

  failureExplanation:
    'In digital forensics, a local browser history entry or isolated timestamp is NEVER definitive proof of external web activity, nor does an anomaly alone prove malice.\n\nKey Principles to Remember:\n- Confirmed Facts vs Hypotheses (Local vs Network Reality): Distinguish what is directly verified (e.g. corroborated network uploads) from provisional hypotheses (e.g. attributing specific file contents without payload inspection).\n- Host Telemetry Correlation & Limits: Absence from proxy logs and sleep state conflicts show that alleged browsing is uncorroborated and inconsistent with telemetry, but examiners must state coverage limits—absence from one log is not universal negative proof.\n- SQLite Auto-Increment Sequencing: Higher row IDs with earlier timestamps indicate an anomaly requiring corroboration; always consider benign explanations like delayed recording, synchronization, or import before concluding tampering.\n- Transition Types: Distinguish user-typed visits from passive iframe subframes (auto_subframe).\n- Preservation: Always preserve WAL (-wal) and SHM (-shm) journal files alongside SQLite databases on verified working copies.',

  shuffleItems: false,
};
