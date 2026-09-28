// ============================================================
// CyberCampus — Zustand Store
// All app state in one store with localStorage persistence.
// Storage key: 'cybercampus_v1'
// ============================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  UserProfile,
  UserSettings,
  UserProgress,
  Attempt,
  PortfolioEntry,
  Challenge,
  StepResponse,
} from '../types';

// ── Scoring helpers ───────────────────────────────────────────────────────────

/**
 * Compute earnedScore and finalScore for a completed attempt.
 *
 *   earnedScore = Σ pointsEarned across all stepResponses      (0–100)
 *   finalScore  = max(0, earnedScore − hintsUsed × 10)
 *   passed      = finalScore >= challenge.passThreshold
 */
export function computeScore(
  stepResponses: StepResponse[],
  hintsUsed: number,
  passThreshold: number
): { earnedScore: number; finalScore: number; passed: boolean } {
  const earnedScore = stepResponses.reduce((sum, r) => sum + r.pointsEarned, 0);
  const finalScore = Math.max(0, earnedScore - hintsUsed * 10);
  return { earnedScore, finalScore, passed: finalScore >= passThreshold };
}

// ── Default values ────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: UserSettings = {
  reducedMotion: false,
  lowPerformanceMode: false,
  soundEnabled: false,
};

function createDefaultProfile(): UserProfile {
  return {
    id: uuidv4(),
    displayName: '',
    createdAt: new Date().toISOString(),
    settings: { ...DEFAULT_SETTINGS },
  };
}

function createDefaultProgress(userId: string): UserProgress {
  return {
    userId,
    attempts: [],
    portfolio: [],
    skillTags: {},
  };
}

// ── Store shape ───────────────────────────────────────────────────────────────

interface CyberCampusState {
  profile: UserProfile;
  progress: UserProgress;

  // Profile actions
  setDisplayName: (name: string) => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  resetAllProgress: () => void;

  // Challenge actions
  recordAttempt: (challenge: Challenge, stepResponses: StepResponse[], hintsUsed: number, retryNumber: number) => Attempt;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCyberStore = create<CyberCampusState>()(
  persist(
    (set, get) => {
      const defaultProfile = createDefaultProfile();

      return {
        profile: defaultProfile,
        progress: createDefaultProgress(defaultProfile.id),

        // ── Profile actions ────────────────────────────────────────────────

        setDisplayName(name) {
          set((s) => ({
            profile: { ...s.profile, displayName: name },
          }));
        },

        updateSettings(patch) {
          set((s) => ({
            profile: {
              ...s.profile,
              settings: { ...s.profile.settings, ...patch },
            },
          }));
        },

        resetAllProgress() {
          const { profile } = get();
          set({
            progress: createDefaultProgress(profile.id),
          });
        },

        // ── Challenge actions ──────────────────────────────────────────────

        recordAttempt(challenge, stepResponses, hintsUsed, retryNumber) {
          const { earnedScore, finalScore, passed } = computeScore(
            stepResponses,
            hintsUsed,
            challenge.passThreshold
          );

          const attempt: Attempt = {
            id: uuidv4(),
            challengeId: challenge.id,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            hintsUsed,
            stepResponses,
            earnedScore,
            finalScore,
            passed,
            retryNumber,
          };

          set((s) => {
            const newAttempts = [...s.progress.attempts, attempt];

            // Update or create portfolio entry
            const existingIdx = s.progress.portfolio.findIndex(
              (e) => e.challengeId === challenge.id
            );

            let newPortfolio: PortfolioEntry[];
            if (existingIdx === -1) {
              // First attempt at this challenge
              const entry: PortfolioEntry = {
                challengeId: challenge.id,
                bestFinalScore: finalScore,
                passedAt: passed ? attempt.completedAt : null,
                skillsEarned: passed ? [...challenge.skills] : [],
                totalAttempts: 1,
              };
              newPortfolio = [...s.progress.portfolio, entry];
            } else {
              newPortfolio = s.progress.portfolio.map((e, i) => {
                if (i !== existingIdx) return e;
                return {
                  ...e,
                  bestFinalScore: Math.max(e.bestFinalScore, finalScore),
                  passedAt: e.passedAt ?? (passed ? attempt.completedAt : null),
                  skillsEarned: e.passedAt
                    ? e.skillsEarned
                    : passed
                      ? [...challenge.skills]
                      : e.skillsEarned,
                  totalAttempts: e.totalAttempts + 1,
                };
              });
            }

            // Update skill tags (on any attempt, not just passes)
            const newSkillTags = { ...s.progress.skillTags };
            for (const skill of challenge.skills) {
              newSkillTags[skill] = (newSkillTags[skill] ?? 0) + 1;
            }

            return {
              progress: {
                ...s.progress,
                attempts: newAttempts,
                portfolio: newPortfolio,
                skillTags: newSkillTags,
              },
            };
          });

          return attempt;
        },
      };
    },
    {
      name: 'cybercampus_v1',
      storage: createJSONStorage(() => localStorage),
      // Only persist profile + progress, not transient UI state
      partialize: (s) => ({ profile: s.profile, progress: s.progress }),
    }
  )
);
