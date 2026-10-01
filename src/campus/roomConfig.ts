// ============================================================
// CyberCampus — Shared Room Configuration
// Single source of truth for room colours, positions, and icons
// used by both the 3D CampusScene and the accessible 2D list.
// ============================================================

import type { RoomId } from '../types';

export interface RoomConfig {
  id: RoomId;
  title: string;
  description: string;
  icon: string;          // Lucide icon name (used by 2D map)
  accent: string;        // CSS hex colour
  accentDim: string;     // Low-opacity variant for backgrounds
  challengeIds: [string, string, string];
  /** Three.js world-space XZ position for the 3D building */
  position3d: [number, number, number];
  /** Building height in Three.js units */
  buildingHeight: number;
}

export const ROOM_CONFIGS: RoomConfig[] = [
  {
    id: 'phishing',
    title: 'Phishing Defense',
    description: 'Spot deceptive emails, spoofed domains, and social engineering attacks.',
    icon: 'Mail',
    accent: '#f59e0b',
    accentDim: 'rgba(245,158,11,0.12)',
    challengeIds: ['cc-ph-01', 'cc-ph-02', 'cc-ph-03'],
    position3d: [-7, 0, -5],
    buildingHeight: 3.2,
  },
  {
    id: 'secops',
    title: 'Security Operations',
    description: 'Triage alerts, investigate suspicious logins, and reconstruct incident timelines.',
    icon: 'Monitor',
    accent: '#818cf8',
    accentDim: 'rgba(129,140,248,0.12)',
    challengeIds: ['cc-so-01', 'cc-so-02', 'cc-so-03'],
    position3d: [7, 0, -5],
    buildingHeight: 4.0,
  },
  {
    id: 'network',
    title: 'Network Security',
    description: 'Audit firewall rules, identify risky ports, and detect hidden exfiltration.',
    icon: 'Network',
    accent: '#00d4ff',
    accentDim: 'rgba(0,212,255,0.12)',
    challengeIds: ['cc-nw-01', 'cc-nw-02', 'cc-nw-03'],
    position3d: [0, 0, -10],
    buildingHeight: 4.8,
  },
  {
    id: 'forensics',
    title: 'Digital Forensics',
    description: 'Recover deleted files, reconstruct browser history, and find data hidden in plain sight.',
    icon: 'Search',
    accent: '#22c55e',
    accentDim: 'rgba(34,197,94,0.12)',
    challengeIds: ['cc-df-01', 'cc-df-02', 'cc-df-03'],
    position3d: [-7, 0, 3],
    buildingHeight: 3.6,
  },
  {
    id: 'privacy',
    title: 'Privacy & Account Security',
    description: 'Audit passwords, detect MFA attacks, and identify apps collecting excessive data.',
    icon: 'Lock',
    accent: '#f472b6',
    accentDim: 'rgba(244,114,182,0.12)',
    challengeIds: ['cc-pr-01', 'cc-pr-02', 'cc-pr-03'],
    position3d: [7, 0, 3],
    buildingHeight: 3.4,
  },
];

export const ROOM_CONFIG_MAP: Record<string, RoomConfig> = Object.fromEntries(
  ROOM_CONFIGS.map((r) => [r.id, r])
);
