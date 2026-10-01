import '@testing-library/jest-dom';
import { registerLoadedChallenge } from '../challenges/loader';
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

// Pre-register all challenges for the Vitest test environment
const ALL_TEST_CHALLENGES = [
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

for (const ch of ALL_TEST_CHALLENGES) {
  registerLoadedChallenge(ch);
}
