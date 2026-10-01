// ============================================================
// CyberCampus — Progress & Recommendation Utilities
// ============================================================

import type { Attempt, Challenge, PortfolioEntry } from '../types';

/**
 * Returns the highest-scoring attempt for a given challenge.
 * If multiple attempts share the highest score, the latest attempt wins.
 */
export function getBestAttemptForChallenge(
  attempts: Attempt[],
  challengeId: string
): Attempt | undefined {
  const matching = attempts.filter((a) => a.challengeId === challengeId);
  if (matching.length === 0) return undefined;

  return matching.reduce((best, curr) => {
    if (curr.finalScore > best.finalScore) return curr;
    if (curr.finalScore < best.finalScore) return best;

    // Tie-breaker: latest attempt wins
    const bestTime = new Date(best.completedAt || best.startedAt).getTime();
    const currTime = new Date(curr.completedAt || curr.startedAt).getTime();
    return currTime >= bestTime ? curr : best;
  });
}

/**
 * Deterministic "Continue Learning" recommendation:
 * Prefer a previously attempted, uncompleted challenge (latest attempt first).
 * Otherwise recommend the first uncompleted live challenge in curriculum order.
 * Returns null if all live challenges are completed or if the live challenge list is empty.
 */
export function getDeterministicRecommendation(
  attempts: Attempt[],
  portfolio: PortfolioEntry[],
  liveChallenges: Challenge[]
): { recommendedChallenge: Challenge | null; isResume: boolean } {
  if (liveChallenges.length === 0) {
    return { recommendedChallenge: null, isResume: false };
  }

  const liveChallengeIds = new Set(liveChallenges.map((c) => c.id));
  const completedIds = new Set(
    portfolio
      .filter((e) => e.passedAt !== null && liveChallengeIds.has(e.challengeId))
      .map((e) => e.challengeId)
  );

  // If all live challenges are completed, return null
  if (completedIds.size >= liveChallenges.length) {
    return { recommendedChallenge: null, isResume: false };
  }

  // 1. Prefer previously attempted, uncompleted live challenge (most recent attempt first)
  const attemptedUncompletedId =
    [...attempts]
      .reverse()
      .map((a) => a.challengeId)
      .find((id) => liveChallengeIds.has(id) && !completedIds.has(id)) ??
    portfolio
      .map((e) => e.challengeId)
      .find((id) => liveChallengeIds.has(id) && !completedIds.has(id));

  if (attemptedUncompletedId) {
    const found = liveChallenges.find((c) => c.id === attemptedUncompletedId);
    if (found) {
      return { recommendedChallenge: found, isResume: true };
    }
  }

  // 2. Otherwise recommend the first uncompleted live challenge in curriculum order
  const nextInCurriculum = liveChallenges.find((c) => !completedIds.has(c.id)) ?? null;
  return {
    recommendedChallenge: nextInCurriculum,
    isResume: false,
  };
}

/**
 * Calculates progress statistics safely handling empty registries.
 */
export function calculateProgressStats(
  portfolio: PortfolioEntry[],
  liveChallenges: Challenge[]
) {
  const totalChallenges = liveChallenges.length;
  const liveChallengeIds = new Set(liveChallenges.map((c) => c.id));
  const completedIds = new Set(
    portfolio
      .filter((e) => e.passedAt !== null && liveChallengeIds.has(e.challengeId))
      .map((e) => e.challengeId)
  );
  const totalPassed = completedIds.size;
  const completionPercent =
    totalChallenges > 0 ? Math.round((totalPassed / totalChallenges) * 100) : 0;
  const isCampusComplete = totalChallenges > 0 && totalPassed === totalChallenges;

  return {
    totalChallenges,
    totalPassed,
    completionPercent,
    isCampusComplete,
    completedIds,
  };
}
