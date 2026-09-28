// ============================================================
// CyberCampus — Challenge Registry
// Single source of truth for all challenge and room data.
// ============================================================

import type { Challenge, Room } from '../types';
import { challengeCC_PH_01 } from './data/cc-ph-01';
import { challengeCC_PH_02 } from './data/cc-ph-02';

// ── Challenge registry ────────────────────────────────────────────────────────

export const ALL_CHALLENGES: Challenge[] = [
  challengeCC_PH_01,
  challengeCC_PH_02,
];

export const CHALLENGE_MAP: Record<string, Challenge> = Object.fromEntries(
  ALL_CHALLENGES.map((c) => [c.id, c])
);

export function getChallenge(id: string): Challenge | undefined {
  return CHALLENGE_MAP[id];
}

// ── Room registry ─────────────────────────────────────────────────────────────

export const ROOMS: Room[] = [
  {
    id: 'phishing',
    title: 'Phishing Defense',
    description:
      'Identify deceptive emails, spoofed domains, and social engineering tactics before they cause real damage.',
    icon: 'Mail',
    accentClass: 'room-phishing',
    challengeIds: ['cc-ph-01', 'cc-ph-02', 'cc-ph-03'],
  },
  {
    id: 'secops',
    title: 'Security Operations',
    description:
      'Triage alerts, investigate suspicious logins, and piece together incident response timelines.',
    icon: 'Monitor',
    accentClass: 'room-secops',
    challengeIds: ['cc-so-01', 'cc-so-02', 'cc-so-03'],
  },
  {
    id: 'network',
    title: 'Network Security',
    description:
      'Audit firewall rules, analyse open ports, and detect hidden exfiltration in packet traces.',
    icon: 'Network',
    accentClass: 'room-network',
    challengeIds: ['cc-nw-01', 'cc-nw-02', 'cc-nw-03'],
  },
  {
    id: 'forensics',
    title: 'Digital Forensics',
    description:
      'Recover deleted files, reconstruct browser history, and uncover data hidden in plain sight.',
    icon: 'Search',
    accentClass: 'room-forensics',
    challengeIds: ['cc-df-01', 'cc-df-02', 'cc-df-03'],
  },
  {
    id: 'privacy',
    title: 'Privacy & Account Security',
    description:
      'Audit passwords, spot MFA attacks, and identify apps that collect more data than they admit.',
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

/** IDs of challenges that are fully built and playable */
export const LIVE_CHALLENGE_IDS = new Set(['cc-ph-01', 'cc-ph-02']);
