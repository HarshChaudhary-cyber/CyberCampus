// ============================================================
// CyberCampus — Challenge Data: cc-nw-03
// Room: Network Security | Difficulty: Advanced
// Title: "Packet Trace Analysis"
//
// All domains use RFC 2606 reserved example names (.example).
// All IPs use RFC 5737 documentation addresses or RFC 1918 private subnets.
// All organizations and personas are entirely fictional.
// ============================================================

import type { Challenge } from '../../types';

export interface PacketTraceRow {
  packetNum: number;
  timestamp: string;
  sourceIp: string;
  sourcePort: number;
  destIp: string;
  destPort: number;
  protocol: 'DNS' | 'TLS' | 'NTP' | 'HTTP';
  lengthBytes: number;
  summary: string;
  isTunnelingQuery?: boolean;
  encodedPayloadLength?: number;
  subdomainLabel?: string;
  dnsDetails?: {
    queryType: string;
    queryName: string;
    transactionId: string;
    flags: string;
    responseCode?: string;
  };
}

export interface PacketTraceContent {
  isPacketTrace: boolean;
  captureFile: string;
  captureInterface: string;
  captureDuration: string;
  totalPackets: number;
  appliance: string;
  methodologyNote: {
    title: string;
    formula: string;
    chunkDefinition: string;
    distinctions: string[];
  };
  packets: PacketTraceRow[];
}

export const challengeCC_NW_03: Challenge = {
  id: 'cc-nw-03',
  roomId: 'network',
  difficulty: 'advanced',
  title: 'Packet Trace Analysis',
  briefing:
    'Security Operations detected suspicious outbound volume spikes originating from the Corporate LAN subnet. You are assigned to inspect a 36-packet capture recorded on core switch sw-core-01. Review network protocols, query patterns, and host behaviors to identify the compromised machine, determine the exfiltration technique, and calculate the volume of data exfiltrated through covert channels.',

  // ── Evidence ──────────────────────────────────────────────────────────────
  evidence: [
    {
      id: 'ev-packet-trace',
      type: 'network',
      label: 'Network Packet Capture (trace-core-20260928.pcap)',
      content: {
        isPacketTrace: true,
        captureFile: 'trace-core-20260928.pcap',
        captureInterface: 'eth1 (Internal LAN Trunk SPAN Mirror)',
        captureDuration: '16:30:00 - 16:32:45 UTC (165 seconds)',
        totalPackets: 36,
        appliance: 'Zeek / Wireshark Analyzer on sw-core-01.veridian-logistics.example',
        methodologyNote: {
          title: 'Exfiltration Volume Calculation & Metric Methodology',
          formula: 'Estimated Encoded Payload Size = [Count of Outbound Tunneling Queries] × [Encoded Label Length in Bytes]',
          chunkDefinition:
            'Each DNS tunneling query carries a distinct 32-character hexadecimal data chunk in its initial subdomain label (32 ASCII characters = 32 bytes).',
          distinctions: [
            'Encoded Payload Size: Measures the actual exfiltrated data string carried inside DNS request labels (32 bytes per query).',
            'Decoded Raw Binary Size: Because 2 hexadecimal characters represent 1 byte of raw binary data, 32 hex chars decode to 16 raw bytes.',
            'Total Network Traffic: Measures the full physical Ethernet/IP/UDP frame length (102 bytes per query), which includes protocol headers and checksums.',
          ],
        },
        packets: [
          // Normal background web traffic (Packets 1-4)
          {
            packetNum: 1,
            timestamp: '16:30:01.120',
            sourceIp: '10.0.2.15',
            sourcePort: 52311,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 78,
            summary: 'Standard query 0x1101 A portal.veridian-logistics.example',
            dnsDetails: {
              queryType: 'A',
              queryName: 'portal.veridian-logistics.example',
              transactionId: '0x1101',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 2,
            timestamp: '16:30:01.122',
            sourceIp: '10.0.1.2',
            sourcePort: 53,
            destIp: '10.0.2.15',
            destPort: 52311,
            protocol: 'DNS',
            lengthBytes: 94,
            summary: 'Standard query response 0x1101 A 10.0.1.10',
            dnsDetails: {
              queryType: 'A',
              queryName: 'portal.veridian-logistics.example',
              transactionId: '0x1101',
              flags: '0x8180 (Standard query response, No error)',
              responseCode: 'NOERROR',
            },
          },
          {
            packetNum: 3,
            timestamp: '16:30:01.135',
            sourceIp: '10.0.2.15',
            sourcePort: 52312,
            destIp: '10.0.1.10',
            destPort: 443,
            protocol: 'TLS',
            lengthBytes: 517,
            summary: 'Client Hello (TLS 1.3, SNI: portal.veridian-logistics.example)',
          },
          {
            packetNum: 4,
            timestamp: '16:30:01.138',
            sourceIp: '10.0.1.10',
            sourcePort: 443,
            destIp: '10.0.2.15',
            destPort: 52312,
            protocol: 'TLS',
            lengthBytes: 1420,
            summary: 'Server Hello, Change Cipher Spec, Application Data',
          },
          // Normal background NTP traffic (Packets 5-6)
          {
            packetNum: 5,
            timestamp: '16:30:04.250',
            sourceIp: '10.0.2.40',
            sourcePort: 49182,
            destIp: '10.0.1.5',
            destPort: 123,
            protocol: 'NTP',
            lengthBytes: 90,
            summary: 'NTP Version 4, client request (time offset synchronization)',
          },
          {
            packetNum: 6,
            timestamp: '16:30:04.252',
            sourceIp: '10.0.1.5',
            sourcePort: 123,
            destIp: '10.0.2.40',
            destPort: 49182,
            protocol: 'NTP',
            lengthBytes: 90,
            summary: 'NTP Version 4, server response (stratum 2 clock source)',
          },
          // Benign service verification DNS TXT query (Packets 7-8)
          {
            packetNum: 7,
            timestamp: '16:30:08.510',
            sourceIp: '10.0.2.15',
            sourcePort: 52340,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 82,
            summary: 'Standard query 0x2201 TXT _spf.cloudvendor.example',
            dnsDetails: {
              queryType: 'TXT',
              queryName: '_spf.cloudvendor.example',
              transactionId: '0x2201',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 8,
            timestamp: '16:30:08.525',
            sourceIp: '10.0.1.2',
            sourcePort: 53,
            destIp: '10.0.2.15',
            destPort: 52340,
            protocol: 'DNS',
            lengthBytes: 134,
            summary: 'Standard query response 0x2201 TXT "v=spf1 include:_spf.cloudvendor.example ~all"',
            dnsDetails: {
              queryType: 'TXT',
              queryName: '_spf.cloudvendor.example',
              transactionId: '0x2201',
              flags: '0x8180 (Standard query response, No error)',
              responseCode: 'NOERROR',
            },
          },
          // Normal background Developer API traffic (Packets 9-11)
          {
            packetNum: 9,
            timestamp: '16:30:12.800',
            sourceIp: '10.0.2.40',
            sourcePort: 53120,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 74,
            summary: 'Standard query 0x3301 A docs.internal.example',
            dnsDetails: {
              queryType: 'A',
              queryName: 'docs.internal.example',
              transactionId: '0x3301',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 10,
            timestamp: '16:30:12.802',
            sourceIp: '10.0.1.2',
            sourcePort: 53,
            destIp: '10.0.2.40',
            destPort: 53120,
            protocol: 'DNS',
            lengthBytes: 90,
            summary: 'Standard query response 0x3301 A 10.0.1.20',
            dnsDetails: {
              queryType: 'A',
              queryName: 'docs.internal.example',
              transactionId: '0x3301',
              flags: '0x8180 (Standard query response, No error)',
              responseCode: 'NOERROR',
            },
          },
          {
            packetNum: 11,
            timestamp: '16:30:13.010',
            sourceIp: '10.0.2.40',
            sourcePort: 53122,
            destIp: '10.0.1.20',
            destPort: 443,
            protocol: 'TLS',
            lengthBytes: 517,
            summary: 'Client Hello (TLS 1.3, SNI: docs.internal.example)',
          },
          // Suspicious continuous burst of 24 DNS Tunneling Queries from 10.0.2.84 (Packets 12-35)
          {
            packetNum: 12,
            timestamp: '16:31:02.100',
            sourceIp: '10.0.2.84',
            sourcePort: 61001,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a01 A 4a8f1b9c3e7d02a58b6c4f1e9d3a7b5c.c01.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: '4a8f1b9c3e7d02a58b6c4f1e9d3a7b5c',
            dnsDetails: {
              queryType: 'A',
              queryName: '4a8f1b9c3e7d02a58b6c4f1e9d3a7b5c.c01.s88.sync-telemetry.example',
              transactionId: '0x7a01',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 13,
            timestamp: '16:31:02.350',
            sourceIp: '10.0.2.84',
            sourcePort: 61002,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a02 A 8d2e4f0a1c9b3a5e7f2d4b60a8c1e3f5.c02.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: '8d2e4f0a1c9b3a5e7f2d4b60a8c1e3f5',
            dnsDetails: {
              queryType: 'A',
              queryName: '8d2e4f0a1c9b3a5e7f2d4b60a8c1e3f5.c02.s88.sync-telemetry.example',
              transactionId: '0x7a02',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 14,
            timestamp: '16:31:02.600',
            sourceIp: '10.0.2.84',
            sourcePort: 61003,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a03 A c5e7f1d2b4a6c8e0a2d4f6b8013579bd.c03.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: 'c5e7f1d2b4a6c8e0a2d4f6b8013579bd',
            dnsDetails: {
              queryType: 'A',
              queryName: 'c5e7f1d2b4a6c8e0a2d4f6b8013579bd.c03.s88.sync-telemetry.example',
              transactionId: '0x7a03',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 15,
            timestamp: '16:31:02.850',
            sourceIp: '10.0.2.84',
            sourcePort: 61004,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a04 A e1b3d5f7a9c1e3052749688a0c2e4f61.c04.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: 'e1b3d5f7a9c1e3052749688a0c2e4f61',
            dnsDetails: {
              queryType: 'A',
              queryName: 'e1b3d5f7a9c1e3052749688a0c2e4f61.c04.s88.sync-telemetry.example',
              transactionId: '0x7a04',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 16,
            timestamp: '16:31:03.100',
            sourceIp: '10.0.2.84',
            sourcePort: 61005,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a05 A 7294b6d8f0a2c4e6183a5c7e9b1d3f50.c05.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: '7294b6d8f0a2c4e6183a5c7e9b1d3f50',
            dnsDetails: {
              queryType: 'A',
              queryName: '7294b6d8f0a2c4e6183a5c7e9b1d3f50.c05.s88.sync-telemetry.example',
              transactionId: '0x7a05',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 17,
            timestamp: '16:31:03.350',
            sourceIp: '10.0.2.84',
            sourcePort: 61006,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a06 A 3f5a7c9e1b3d5f7024688ace0124689b.c06.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: '3f5a7c9e1b3d5f7024688ace0124689b',
            dnsDetails: {
              queryType: 'A',
              queryName: '3f5a7c9e1b3d5f7024688ace0124689b.c06.s88.sync-telemetry.example',
              transactionId: '0x7a06',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 18,
            timestamp: '16:31:03.600',
            sourceIp: '10.0.2.84',
            sourcePort: 61007,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a07 A b0d2f4a6c8e0a2c417395b7d9f1e3a5c.c07.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: 'b0d2f4a6c8e0a2c417395b7d9f1e3a5c',
            dnsDetails: {
              queryType: 'A',
              queryName: 'b0d2f4a6c8e0a2c417395b7d9f1e3a5c.c07.s88.sync-telemetry.example',
              transactionId: '0x7a07',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 19,
            timestamp: '16:31:03.850',
            sourceIp: '10.0.2.84',
            sourcePort: 61008,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a08 A f2a4c6e8013579bdf1d3b59775533110.c08.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: 'f2a4c6e8013579bdf1d3b59775533110',
            dnsDetails: {
              queryType: 'A',
              queryName: 'f2a4c6e8013579bdf1d3b59775533110.c08.s88.sync-telemetry.example',
              transactionId: '0x7a08',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 20,
            timestamp: '16:31:04.100',
            sourceIp: '10.0.2.84',
            sourcePort: 61009,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a09 A 6e80a2c4e6183a5c7b9d1f3e5a7c9b0d.c09.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: '6e80a2c4e6183a5c7b9d1f3e5a7c9b0d',
            dnsDetails: {
              queryType: 'A',
              queryName: '6e80a2c4e6183a5c7b9d1f3e5a7c9b0d.c09.s88.sync-telemetry.example',
              transactionId: '0x7a09',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 21,
            timestamp: '16:31:04.350',
            sourceIp: '10.0.2.84',
            sourcePort: 61010,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a0a A a4c6e8013579bdf02468ace13579bdf0.c10.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: 'a4c6e8013579bdf02468ace13579bdf0',
            dnsDetails: {
              queryType: 'A',
              queryName: 'a4c6e8013579bdf02468ace13579bdf0.c10.s88.sync-telemetry.example',
              transactionId: '0x7a0a',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 22,
            timestamp: '16:31:04.600',
            sourceIp: '10.0.2.84',
            sourcePort: 61011,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a0b A d6f80a2c4e6183a5b7d9f1e3c5e7b9a1.c11.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: 'd6f80a2c4e6183a5b7d9f1e3c5e7b9a1',
            dnsDetails: {
              queryType: 'A',
              queryName: 'd6f80a2c4e6183a5b7d9f1e3c5e7b9a1.c11.s88.sync-telemetry.example',
              transactionId: '0x7a0b',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 23,
            timestamp: '16:31:04.850',
            sourceIp: '10.0.2.84',
            sourcePort: 61012,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a0c A 183a5c7e9b1d3f502468ace03579bdf1.c12.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: '183a5c7e9b1d3f502468ace03579bdf1',
            dnsDetails: {
              queryType: 'A',
              queryName: '183a5c7e9b1d3f502468ace03579bdf1.c12.s88.sync-telemetry.example',
              transactionId: '0x7a0c',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 24,
            timestamp: '16:31:05.100',
            sourceIp: '10.0.2.84',
            sourcePort: 61013,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a0d A 4a6c8e0a2c4e618395b7d9f1a3c5e7b9.c13.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: '4a6c8e0a2c4e618395b7d9f1a3c5e7b9',
            dnsDetails: {
              queryType: 'A',
              queryName: '4a6c8e0a2c4e618395b7d9f1a3c5e7b9.c13.s88.sync-telemetry.example',
              transactionId: '0x7a0d',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 25,
            timestamp: '16:31:05.350',
            sourceIp: '10.0.2.84',
            sourcePort: 61014,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a0e A 7c9e1b3d5f702468ace013572468ace0.c14.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: '7c9e1b3d5f702468ace013572468ace0',
            dnsDetails: {
              queryType: 'A',
              queryName: '7c9e1b3d5f702468ace013572468ace0.c14.s88.sync-telemetry.example',
              transactionId: '0x7a0e',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 26,
            timestamp: '16:31:05.600',
            sourceIp: '10.0.2.84',
            sourcePort: 61015,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a0f A ae013579bdf0246813579bdf468ace02.c15.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: 'ae013579bdf0246813579bdf468ace02',
            dnsDetails: {
              queryType: 'A',
              queryName: 'ae013579bdf0246813579bdf468ace02.c15.s88.sync-telemetry.example',
              transactionId: '0x7a0f',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 27,
            timestamp: '16:31:05.850',
            sourceIp: '10.0.2.84',
            sourcePort: 61016,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a10 A e0a2c4e6183a5c7e80a2c4e63579bdf1.c16.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: 'e0a2c4e6183a5c7e80a2c4e63579bdf1',
            dnsDetails: {
              queryType: 'A',
              queryName: 'e0a2c4e6183a5c7e80a2c4e63579bdf1.c16.s88.sync-telemetry.example',
              transactionId: '0x7a10',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 28,
            timestamp: '16:31:06.100',
            sourceIp: '10.0.2.84',
            sourcePort: 61017,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a11 A 123456789abcdef0123456789abcdef0.c17.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: '123456789abcdef0123456789abcdef0',
            dnsDetails: {
              queryType: 'A',
              queryName: '123456789abcdef0123456789abcdef0.c17.s88.sync-telemetry.example',
              transactionId: '0x7a11',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 29,
            timestamp: '16:31:06.350',
            sourceIp: '10.0.2.84',
            sourcePort: 61018,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a12 A fedcba9876543210fedcba9876543210.c18.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: 'fedcba9876543210fedcba9876543210',
            dnsDetails: {
              queryType: 'A',
              queryName: 'fedcba9876543210fedcba9876543210.c18.s88.sync-telemetry.example',
              transactionId: '0x7a12',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 30,
            timestamp: '16:31:06.600',
            sourceIp: '10.0.2.84',
            sourcePort: 61019,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a13 A 0f1e2d3c4b5a69788796a5b4c3d2e1f0.c19.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: '0f1e2d3c4b5a69788796a5b4c3d2e1f0',
            dnsDetails: {
              queryType: 'A',
              queryName: '0f1e2d3c4b5a69788796a5b4c3d2e1f0.c19.s88.sync-telemetry.example',
              transactionId: '0x7a13',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 31,
            timestamp: '16:31:06.850',
            sourceIp: '10.0.2.84',
            sourcePort: 61020,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a14 A a1b2c3d4e5f60718293a4b5c6d7e8f90.c20.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
            dnsDetails: {
              queryType: 'A',
              queryName: 'a1b2c3d4e5f60718293a4b5c6d7e8f90.c20.s88.sync-telemetry.example',
              transactionId: '0x7a14',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 32,
            timestamp: '16:31:07.100',
            sourceIp: '10.0.2.84',
            sourcePort: 61021,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a15 A f0e1d2c3b4a5968778695a4b3c2d1e0f.c21.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: 'f0e1d2c3b4a5968778695a4b3c2d1e0f',
            dnsDetails: {
              queryType: 'A',
              queryName: 'f0e1d2c3b4a5968778695a4b3c2d1e0f.c21.s88.sync-telemetry.example',
              transactionId: '0x7a15',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 33,
            timestamp: '16:31:07.350',
            sourceIp: '10.0.2.84',
            sourcePort: 61022,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a16 A 5566778899aabbccddeeff0011223344.c22.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: '5566778899aabbccddeeff0011223344',
            dnsDetails: {
              queryType: 'A',
              queryName: '5566778899aabbccddeeff0011223344.c22.s88.sync-telemetry.example',
              transactionId: '0x7a16',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 34,
            timestamp: '16:31:07.600',
            sourceIp: '10.0.2.84',
            sourcePort: 61023,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a17 A 99887766554433221100ffeeddccbbaa.c23.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: '99887766554433221100ffeeddccbbaa',
            dnsDetails: {
              queryType: 'A',
              queryName: '99887766554433221100ffeeddccbbaa.c23.s88.sync-telemetry.example',
              transactionId: '0x7a17',
              flags: '0x0100 (Standard query)',
            },
          },
          {
            packetNum: 35,
            timestamp: '16:31:07.850',
            sourceIp: '10.0.2.84',
            sourcePort: 61024,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 102,
            summary: 'Standard query 0x7a18 A c3b2a10f9e8d7c6b5a4938271605f4e3.c24.s88.sync-telemetry.example',
            isTunnelingQuery: true,
            encodedPayloadLength: 32,
            subdomainLabel: 'c3b2a10f9e8d7c6b5a4938271605f4e3',
            dnsDetails: {
              queryType: 'A',
              queryName: 'c3b2a10f9e8d7c6b5a4938271605f4e3.c24.s88.sync-telemetry.example',
              transactionId: '0x7a18',
              flags: '0x0100 (Standard query)',
            },
          },
          // Normal background web authentication traffic (Packet 36)
          {
            packetNum: 36,
            timestamp: '16:32:01.400',
            sourceIp: '10.0.2.15',
            sourcePort: 52399,
            destIp: '10.0.1.2',
            destPort: 53,
            protocol: 'DNS',
            lengthBytes: 76,
            summary: 'Standard query 0x9901 A auth.veridian-logistics.example',
            dnsDetails: {
              queryType: 'A',
              queryName: 'auth.veridian-logistics.example',
              transactionId: '0x9901',
              flags: '0x0100 (Standard query)',
            },
          },
        ],
      },
    },
    {
      id: 'ev-pcap-standards',
      type: 'policy',
      label: 'Network Forensic & Covert Channel Analysis Standard (SOP NET-301)',
      content: {
        title: 'Network Forensic Investigation & DNS Covert Channel Standard',
        code: 'SOP NET-301',
        category: 'Network Incident Response Policy',
        effectiveDate: '2026-03-01',
        classification: 'Internal Use Only',
        rules: [
          'Rule 1 (DNS Covert Channel Detection): Attackers use DNS tunneling (MITRE ATT&CK T1071.004) to bypass perimeter firewalls by encoding outbound data into the subdomain labels of queries directed to attacker-controlled authoritative nameservers. Key indicators include high-frequency sequential query bursts, non-dictionary high-entropy alphanumeric labels (e.g. 32-character hexadecimal chunks), and non-existent domain NXDOMAIN responses.',
          'Rule 2 (Contextual Verification vs False Positives): A single DNS TXT lookup (such as for SPF records, DKIM public keys, or cloud tenant domain validation) is standard operational behavior and must NOT be treated as proof of compromise. Analysts must evaluate query volume, timing frequency, entropy, and repetition.',
          'Rule 3 (Exfiltration Volume Calculation): When calculating exfiltration volume from DNS packet traces, analysts must distinguish between Encoded Payload Size and Total Network Traffic. Encoded Payload Size measures only the data characters transferred in the exfiltration labels ([Query Count] × [Label Byte Length]). Total Network Traffic includes the full Ethernet, IP, and UDP protocol overhead.',
          'Rule 4 (Immediate Containment Protocol): When active DNS exfiltration is detected, the compromised host must immediately be isolated at the network switch layer (port isolation or 802.1X quarantine VLAN), the malicious domain sinkholed at internal DNS resolvers, and volatile system memory captured. Live hosts must never be prematurely shut down or wiped, as shutdown destroys volatile in-memory malware artifacts and network sockets.',
        ],
      },
    },
  ],

  // ── Steps ─────────────────────────────────────────────────────────────────
  //
  // Step 1 (30 pts): Identify compromised host & anomalous activity signature (single-choice)
  // Step 2 (35 pts): Infer tunneling technique & delivery mechanism (single-choice)
  // Step 3 (35 pts): Exfiltration volume calculation & containment action (guided-form, 3 fields)
  //
  // Total: 100 pts. Pass threshold: 70.
  steps: [
    {
      id: 'step-compromised-host',
      prompt:
        'Analyze the 36-packet capture trace. Identify the compromised internal host exhibiting malicious communication patterns and specify the anomalous activity signature.',
      interaction: 'single-choice',
      partialCreditAllowed: false,
      pointValue: 30,
      items: [
        {
          id: 'host-fin-84',
          label:
            'Host 10.0.2.84 (ws-fin-exec-84) generating a continuous, rapid-burst sequence of 24 DNS queries with high-entropy 32-character hexadecimal labels to external domain *.sync-telemetry.example.',
        },
        {
          id: 'host-mktg-15',
          label:
            'Host 10.0.2.15 (ws-mktg-15) because it generated a DNS TXT request for _spf.cloudvendor.example, which indicates an active SPF-based command injection exploit.',
        },
        {
          id: 'host-eng-40',
          label:
            'Host 10.0.2.40 (ws-eng-40) performing UDP port 123 synchronization to internal server 10.0.1.5, indicating an ongoing NTP amplification DDoS attack.',
        },
        {
          id: 'host-resolver-02',
          label:
            'Internal DNS resolver 10.0.1.2 because it handles incoming UDP port 53 traffic from multiple internal endpoints across different departments.',
        },
      ],
      answerKey: { chosen: 'host-fin-84' },
    },
    {
      id: 'step-attack-technique',
      prompt:
        'Based on the packet structure, query frequency, and destination domain in the trace, which network attack and data exfiltration technique is being executed?',
      interaction: 'single-choice',
      partialCreditAllowed: false,
      pointValue: 35,
      items: [
        {
          id: 'tech-dns-tunneling',
          label:
            'DNS Tunneling & Data Exfiltration (MITRE ATT&CK T1071.004 / T1048.003): Outbound data chunks are encoded into subdomain labels of queries directed to an attacker-controlled authoritative nameserver, bypassing perimeter firewalls that permit port 53.',
        },
        {
          id: 'tech-cache-poisoning',
          label:
            'DNS Cache Poisoning (Kaminsky Attack): Attempting to corrupt recursive resolver 10.0.1.2 with forged transaction IDs and malicious authoritative glue records.',
        },
        {
          id: 'tech-syn-flood',
          label:
            'SYN Flood Denial of Service: Flooding the internal resolver with half-open TCP handshakes to exhaust server socket connection pools.',
        },
        {
          id: 'tech-fast-flux',
          label:
            'Fast Flux Hosting: Rapidly rotating DNS A records of legitimate domains to obscure the IP addresses of an external phishing reverse proxy.',
        },
      ],
      answerKey: { chosen: 'tech-dns-tunneling' },
    },
    {
      id: 'step-volume-containment',
      prompt:
        'Using the calculation methodology defined in the evidence, calculate the exfiltration volume from the trace and establish the immediate containment and forensic response plan.',
      interaction: 'guided-form',
      partialCreditAllowed: true,
      pointValue: 35,
      items: [
        {
          id: 'encodedPayloadVolume',
          label: 'Estimated Encoded Payload Volume',
          options: [
            '768 bytes (24 tunneling queries × 32 bytes encoded label)',
            '2,448 bytes (Total network frame traffic of all tunneling queries)',
            '384 bytes (Decoded binary equivalent assuming 2 hex chars per byte)',
            '1,152 bytes (All 36 packets in trace × 32 bytes)',
          ],
        },
        {
          id: 'metricDistinction',
          label: 'Payload vs Network Traffic Distinction',
          options: [
            'Encoded payload size measures the actual exfiltrated data string in query labels, whereas total network traffic includes Ethernet, IP, and UDP protocol overhead.',
            'Encoded payload size and total network traffic are identical because DNS uses UDP with zero protocol headers.',
            'Total network traffic is smaller than payload size due to gzip compression performed by DNS resolvers.',
            'Payload size is measured exclusively from DNS answer records, ignoring request labels.',
          ],
        },
        {
          id: 'containmentAction',
          label: 'Immediate Incident Response Action',
          options: [
            'Isolate 10.0.2.84 at switch/network layer, sinkhole sync-telemetry.example on internal DNS resolvers, and preserve RAM memory for volatile forensics.',
            'Immediately power off and wipe 10.0.2.84 to destroy any malware files on disk.',
            'Add an allow rule on the firewall for sync-telemetry.example to monitor where the attacker connects next.',
            'Block UDP port 53 enterprise-wide on the core switch, disabling DNS resolution for all company systems.',
          ],
        },
      ],
      answerKey: {
        encodedPayloadVolume: '768 bytes (24 tunneling queries × 32 bytes encoded label)',
        metricDistinction:
          'Encoded payload size measures the actual exfiltrated data string in query labels, whereas total network traffic includes Ethernet, IP, and UDP protocol overhead.',
        containmentAction:
          'Isolate 10.0.2.84 at switch/network layer, sinkhole sync-telemetry.example on internal DNS resolvers, and preserve RAM memory for volatile forensics.',
      },
    },
  ],

  // ── Hints ─────────────────────────────────────────────────────────────────
  hints: [
    'Filter the packet trace by protocol and destination. Notice how host 10.0.2.84 sends a continuous sequence of queries to *.sync-telemetry.example with long random-looking 32-character hexadecimal prefixes. Normal DNS queries do not look like this.',
    'Do not mistake the single TXT query for _spf.cloudvendor.example as malicious. An isolated TXT lookup is standard for email and cloud service verification. The true anomaly is the repeated burst of 24 queries with high-entropy labels.',
    'To calculate the encoded payload volume: count the tunneling queries from 10.0.2.84 (24 queries) and multiply by the 32 bytes of encoded hexadecimal payload per query (24 × 32 = 768 bytes). Note that total network frame traffic (2,448 bytes) includes 102 bytes of frame overhead per packet.',
  ],

  // ── Skills ────────────────────────────────────────────────────────────────
  skills: [
    'packet-trace-investigation',
    'dns-tunneling-detection',
    'covert-channel-analysis',
    'exfiltration-volume-calculation',
    'network-containment-protocol',
  ],

  // ── Scoring ───────────────────────────────────────────────────────────────
  passThreshold: 70,

  // ── Explanations ─────────────────────────────────────────────────────────
  successExplanation:
    'Superb packet trace investigation! You accurately identified the covert DNS tunneling channel, differentiated legitimate single TXT lookups from malicious exfiltration bursts, performed an exact payload volume calculation, and established the correct forensic containment protocol.\n\nInvestigation Summary:\n1. Threat Actor Activity:\n- Host 10.0.2.84 (ws-fin-exec-84) was compromised by malware that established a covert DNS tunneling channel (MITRE ATT&CK T1071.004).\n- The malware broke sensitive corporate data into 32-character hexadecimal chunks and prepended them as subdomain labels under attacker-controlled domain *.sync-telemetry.example.\n\n2. Differentiating Normal vs Malicious Traffic:\n- Host 10.0.2.15 performed standard web browsing and a single legitimate DNS TXT query for _spf.cloudvendor.example to verify email SPF records. An isolated TXT lookup is normal operational behavior.\n- Host 10.0.2.40 engaged in standard NTP clock synchronization with internal server 10.0.1.5.\n- Host 10.0.2.84 generated 24 queries within 6 seconds, each containing high-entropy hexadecimal strings, matching the signature of active data exfiltration.\n\n3. Volume Calculation & Distinction:\n- Encoded Payload Size = 24 queries × 32 bytes/label = 768 bytes.\n- Decoded Raw Binary Data = 24 queries × 16 bytes = 384 bytes (2 hex characters = 1 raw byte).\n- Total Network Frame Traffic = 24 queries × 102 bytes frame size = 2,448 bytes. Understanding this distinction is vital for incident response disclosure.\n\n4. Containment Action:\n- Immediate network isolation of 10.0.2.84 stops the data leak without destroying volatile memory artifacts.\n- Sinkholing sync-telemetry.example on internal DNS resolvers neutralizes any remaining beaconing attempts across the entire enterprise.',

  failureExplanation:
    'Effective packet trace analysis requires recognizing covert channel signatures, calculating exfiltration volumes, and avoiding common false positives.\n\nKey Analysis Takeaways:\n- DNS Tunneling Signature: Attackers encode data into DNS query labels because firewalls typically allow outbound port 53. Look for rapid bursts of queries with long, randomized subdomain prefixes to unregistered or anomalous external domains.\n- Avoid False Positives: A single DNS TXT lookup (e.g. for SPF or DKIM) is standard operational practice. Compromise is indicated by repeated patterns, high volume, and abnormal label entropy.\n- Volume Calculations: The encoded payload size is calculated by multiplying the number of tunneling queries by the chunk length in the label (24 × 32 = 768 bytes). This differs from total network traffic (2,448 bytes), which includes protocol headers.\n- Forensic Response: Never shut down or wipe a compromised host immediately; isolate it at the network layer and sinkhole the destination domain to preserve volatile evidence.',

  shuffleItems: false,
};
