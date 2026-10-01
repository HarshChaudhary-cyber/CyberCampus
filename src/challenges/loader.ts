// ============================================================
// CyberCampus — Explicit Challenge Dynamic Loader
// Loads full challenge evidence and step definitions on demand
// using explicit Vite import mappings.
// ============================================================

import type { Challenge } from '../types';

export type ChallengeModuleLoader = () => Promise<{
  default?: Challenge;
  [key: string]: unknown;
}>;

export const CHALLENGE_LOADERS: Record<string, ChallengeModuleLoader> = {
  'cc-ph-01': () => import('./data/cc-ph-01'),
  'cc-ph-02': () => import('./data/cc-ph-02'),
  'cc-ph-03': () => import('./data/cc-ph-03'),
  'cc-so-01': () => import('./data/cc-so-01'),
  'cc-so-02': () => import('./data/cc-so-02'),
  'cc-so-03': () => import('./data/cc-so-03'),
  'cc-nw-01': () => import('./data/cc-nw-01'),
  'cc-nw-02': () => import('./data/cc-nw-02'),
  'cc-nw-03': () => import('./data/cc-nw-03'),
  'cc-df-01': () => import('./data/cc-df-01'),
  'cc-df-02': () => import('./data/cc-df-02'),
  'cc-df-03': () => import('./data/cc-df-03'),
  'cc-pr-01': () => import('./data/cc-pr-01'),
  'cc-pr-02': () => import('./data/cc-pr-02'),
  'cc-pr-03': () => import('./data/cc-pr-03'),
};

const loadedChallengeCache = new Map<string, Challenge>();

/**
 * Returns a previously loaded challenge from cache, if available synchronously.
 */
export function getLoadedChallenge(id: string): Challenge | undefined {
  return loadedChallengeCache.get(id);
}

/**
 * Registers a full challenge definition directly in the in-memory cache.
 * Used for preloading, test suites, or explicit initialization.
 */
export function registerLoadedChallenge(challenge: Challenge): void {
  loadedChallengeCache.set(challenge.id, challenge);
}

/**
 * Asynchronously loads the full challenge definition including evidence,
 * steps, hints, and explanations via its explicit Vite chunk loader.
 */
export async function loadChallenge(id: string): Promise<Challenge | undefined> {
  const cached = loadedChallengeCache.get(id);
  if (cached) return cached;

  const loader = CHALLENGE_LOADERS[id];
  if (!loader) return undefined;

  const mod = await loader();
  const challenge =
    mod.default ||
    (Object.values(mod).find(
      (v): v is Challenge =>
        Boolean(v && typeof v === 'object' && 'id' in v && (v as { id?: string }).id === id)
    ) as Challenge | undefined);

  if (challenge) {
    loadedChallengeCache.set(id, challenge);
  }

  return challenge;
}

/**
 * Triggers preloading of a challenge bundle without blocking.
 */
export function preloadChallenge(id: string): void {
  if (!loadedChallengeCache.has(id)) {
    loadChallenge(id).catch(() => {});
  }
}
