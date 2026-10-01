import { describe, it, expect } from 'vitest';
import {
  ALL_CHALLENGES_METADATA,
  CHALLENGE_METADATA_MAP,
  assertMetadataMatchesDefinition,
  LIVE_CHALLENGE_IDS,
} from '../challenges/metadata';
import { loadChallenge } from '../challenges/loader';
import { challengeCC_PH_01 } from '../challenges/data/cc-ph-01';
import { challengeCC_PH_02 } from '../challenges/data/cc-ph-02';
import { challengeCC_PH_03 } from '../challenges/data/cc-ph-03';
import { challengeCC_SO_01 } from '../challenges/data/cc-so-01';
import { challengeCC_SO_02 } from '../challenges/data/cc-so-02';
import { challengeCC_SO_03 } from '../challenges/data/cc-so-03';
import { challengeCC_NW_01 } from '../challenges/data/cc-nw-01';
import { challengeCC_NW_02 } from '../challenges/data/cc-nw-02';
import { challengeCC_NW_03 } from '../challenges/data/cc-nw-03';
import { challengeCC_DF_01 } from '../challenges/data/cc-df-01';
import { challengeCC_DF_02 } from '../challenges/data/cc-df-02';
import { challengeCC_DF_03 } from '../challenges/data/cc-df-03';
import { challengeCC_PR_01 } from '../challenges/data/cc-pr-01';
import { challengeCC_PR_02 } from '../challenges/data/cc-pr-02';
import { challengeCC_PR_03 } from '../challenges/data/cc-pr-03';

const FULL_CHALLENGES = [
  challengeCC_PH_01,
  challengeCC_PH_02,
  challengeCC_PH_03,
  challengeCC_SO_01,
  challengeCC_SO_02,
  challengeCC_SO_03,
  challengeCC_NW_01,
  challengeCC_NW_02,
  challengeCC_NW_03,
  challengeCC_DF_01,
  challengeCC_DF_02,
  challengeCC_DF_03,
  challengeCC_PR_01,
  challengeCC_PR_02,
  challengeCC_PR_03,
];

describe('Metadata & Definition Consistency (Task 9B)', () => {
  it('contains exactly 15 challenges in curriculum order in metadata registry', () => {
    expect(ALL_CHALLENGES_METADATA.length).toBe(15);
    expect(LIVE_CHALLENGE_IDS.size).toBe(15);
    expect(ALL_CHALLENGES_METADATA.map((m) => m.id)).toEqual(
      FULL_CHALLENGES.map((c) => c.id)
    );
  });

  it('every full challenge definition exactly matches its metadata entry', () => {
    for (const definition of FULL_CHALLENGES) {
      const metadata = CHALLENGE_METADATA_MAP[definition.id];
      expect(metadata).toBeDefined();
      expect(() =>
        assertMetadataMatchesDefinition(metadata, definition)
      ).not.toThrow();
    }
  });

  it('async loadChallenge resolves all 15 challenge definitions', async () => {
    for (const definition of FULL_CHALLENGES) {
      const loaded = await loadChallenge(definition.id);
      expect(loaded).toBeDefined();
      expect(loaded?.id).toBe(definition.id);
      expect(loaded?.steps.length).toBeGreaterThan(0);
      expect(loaded?.evidence.length).toBeGreaterThan(0);
    }
  });
});
