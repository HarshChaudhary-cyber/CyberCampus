// ============================================================
// CyberCampus — Challenge Registry & Metadata Facade
// Lightweight exports for navigation, dashboard, and portfolio.
// Heavy definitions are loaded dynamically via loader.ts.
// ============================================================

export * from './metadata';
export * from './loader';

import {
  ALL_CHALLENGES_METADATA,
  CHALLENGE_METADATA_MAP,
  type ChallengeMetadata,
} from './metadata';
import { getLoadedChallenge } from './loader';
import type { Challenge } from '../types';

/**
 * All live challenges metadata in curriculum order.
 */
export const ALL_CHALLENGES: ChallengeMetadata[] = ALL_CHALLENGES_METADATA;

/**
 * Dynamic map that returns full Challenge if loaded in memory,
 * or lightweight ChallengeMetadata if not yet loaded.
 */
export const CHALLENGE_MAP: Record<string, ChallengeMetadata | Challenge> = new Proxy(
  CHALLENGE_METADATA_MAP as Record<string, ChallengeMetadata | Challenge>,
  {
    get(target, prop: string) {
      if (typeof prop === 'string') {
        const full = getLoadedChallenge(prop);
        if (full) return full;
      }
      return target[prop];
    },
  }
);

/**
 * Returns full Challenge if loaded in memory, or metadata cast as Challenge fallback.
 */
export function getChallenge(id: string): Challenge | undefined {
  const full = getLoadedChallenge(id);
  if (full) return full;
  return CHALLENGE_METADATA_MAP[id] as unknown as Challenge | undefined;
}
