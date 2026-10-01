import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useCyberStore } from '../store';
import {
  calculateProgressStats,
  getDeterministicRecommendation,
  getBestAttemptForChallenge,
} from '../utils/progress';
import { formatScore, formatDate } from '../utils/format';
import { SettingsPage } from '../pages/SettingsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { PortfolioPage } from '../pages/PortfolioPage';
import { ALL_CHALLENGES, LIVE_CHALLENGE_IDS } from '../challenges';
import type { Attempt, PortfolioEntry } from '../types';

describe('Task 9A — Progress, Portfolio, and Settings', () => {
  beforeEach(() => {
    // Reset store to fresh state before each test
    const { resetAllProgress, setDisplayName, updateSettings } = useCyberStore.getState();
    resetAllProgress();
    setDisplayName('CyberCadet');
    updateSettings({
      reducedMotion: false,
      lowPerformanceMode: false,
      soundEnabled: true,
    });
  });

  // ── 1. Registry-derived totals and completion ─────────────────────────────

  describe('calculateProgressStats', () => {
    const liveChallenges = ALL_CHALLENGES.filter((c) => LIVE_CHALLENGE_IDS.has(c.id));

    it('safely handles an empty challenge registry without dividing by zero', () => {
      const stats = calculateProgressStats([], []);
      expect(stats.totalChallenges).toBe(0);
      expect(stats.totalPassed).toBe(0);
      expect(stats.completionPercent).toBe(0);
      expect(stats.isCampusComplete).toBe(false);
      expect(stats.completedIds.size).toBe(0);
    });

    it('correctly calculates zero completion for fresh progress', () => {
      const stats = calculateProgressStats([], liveChallenges);
      expect(stats.totalChallenges).toBe(15);
      expect(stats.totalPassed).toBe(0);
      expect(stats.completionPercent).toBe(0);
      expect(stats.isCampusComplete).toBe(false);
    });

    it('counts unique completed live challenges only', () => {
      const portfolio: PortfolioEntry[] = [
        {
          challengeId: 'cc-ph-01',
          bestFinalScore: 90,
          passedAt: '2026-10-01T10:00:00.000Z',
          skillsEarned: ['Phishing'],
          totalAttempts: 2,
        },
        {
          challengeId: 'cc-ph-02',
          bestFinalScore: 85,
          passedAt: '2026-10-01T11:00:00.000Z',
          skillsEarned: ['Domain Analysis'],
          totalAttempts: 1,
        },
        {
          // In progress (not passed)
          challengeId: 'cc-ph-03',
          bestFinalScore: 50,
          passedAt: null,
          skillsEarned: [],
          totalAttempts: 1,
        },
        {
          // Non-live or unknown challenge ID shouldn't inflate live counts
          challengeId: 'cc-unknown-99',
          bestFinalScore: 100,
          passedAt: '2026-10-01T12:00:00.000Z',
          skillsEarned: [],
          totalAttempts: 1,
        },
      ];

      const stats = calculateProgressStats(portfolio, liveChallenges);
      expect(stats.totalChallenges).toBe(15);
      expect(stats.totalPassed).toBe(2);
      expect(stats.completionPercent).toBe(Math.round((2 / 15) * 100)); // 13%
      expect(stats.isCampusComplete).toBe(false);
    });

    it('detects fully completed campus state when all 15 live challenges pass', () => {
      const fullPortfolio: PortfolioEntry[] = liveChallenges.map((c) => ({
        challengeId: c.id,
        bestFinalScore: 100,
        passedAt: '2026-10-01T12:00:00.000Z',
        skillsEarned: c.skills,
        totalAttempts: 1,
      }));

      const stats = calculateProgressStats(fullPortfolio, liveChallenges);
      expect(stats.totalPassed).toBe(15);
      expect(stats.completionPercent).toBe(100);
      expect(stats.isCampusComplete).toBe(true);
    });
  });

  // ── 2. Deterministic "Continue Learning" recommendation ───────────────────

  describe('getDeterministicRecommendation', () => {
    const liveChallenges = ALL_CHALLENGES.filter((c) => LIVE_CHALLENGE_IDS.has(c.id));

    it('returns first live challenge in curriculum order on clean state', () => {
      const rec = getDeterministicRecommendation([], [], liveChallenges);
      expect(rec.recommendedChallenge?.id).toBe(liveChallenges[0].id);
      expect(rec.isResume).toBe(false);
    });

    it('prefers a previously attempted, uncompleted challenge over next in curriculum', () => {
      // User passed challenge 1 (cc-ph-01) and attempted challenge 4 (cc-so-01) but did not pass
      const portfolio: PortfolioEntry[] = [
        {
          challengeId: 'cc-ph-01',
          bestFinalScore: 100,
          passedAt: '2026-10-01T10:00:00.000Z',
          skillsEarned: [],
          totalAttempts: 1,
        },
        {
          challengeId: 'cc-so-01',
          bestFinalScore: 40,
          passedAt: null,
          skillsEarned: [],
          totalAttempts: 1,
        },
      ];

      const attempts: Attempt[] = [
        {
          id: 'att-1',
          challengeId: 'cc-ph-01',
          startedAt: '2026-10-01T10:00:00.000Z',
          completedAt: '2026-10-01T10:05:00.000Z',
          hintsUsed: 0,
          stepResponses: [],
          earnedScore: 100,
          finalScore: 100,
          passed: true,
          retryNumber: 0,
        },
        {
          id: 'att-2',
          challengeId: 'cc-so-01',
          startedAt: '2026-10-01T10:10:00.000Z',
          completedAt: '2026-10-01T10:15:00.000Z',
          hintsUsed: 1,
          stepResponses: [],
          earnedScore: 50,
          finalScore: 40,
          passed: false,
          retryNumber: 0,
        },
      ];

      const rec = getDeterministicRecommendation(attempts, portfolio, liveChallenges);
      // Even though cc-ph-02 is next in curriculum, cc-so-01 was attempted and uncompleted
      expect(rec.recommendedChallenge?.id).toBe('cc-so-01');
      expect(rec.isResume).toBe(true);
    });

    it('recommends the latest attempted uncompleted challenge when multiple exist', () => {
      const attempts: Attempt[] = [
        {
          id: 'att-1',
          challengeId: 'cc-so-01',
          startedAt: '2026-10-01T10:00:00.000Z',
          completedAt: '2026-10-01T10:05:00.000Z',
          hintsUsed: 0,
          stepResponses: [],
          earnedScore: 50,
          finalScore: 50,
          passed: false,
          retryNumber: 0,
        },
        {
          id: 'att-2',
          challengeId: 'cc-nw-01',
          startedAt: '2026-10-01T11:00:00.000Z',
          completedAt: '2026-10-01T11:05:00.000Z',
          hintsUsed: 0,
          stepResponses: [],
          earnedScore: 40,
          finalScore: 40,
          passed: false,
          retryNumber: 0,
        },
      ];

      const portfolio: PortfolioEntry[] = [
        {
          challengeId: 'cc-so-01',
          bestFinalScore: 50,
          passedAt: null,
          skillsEarned: [],
          totalAttempts: 1,
        },
        {
          challengeId: 'cc-nw-01',
          bestFinalScore: 40,
          passedAt: null,
          skillsEarned: [],
          totalAttempts: 1,
        },
      ];

      const rec = getDeterministicRecommendation(attempts, portfolio, liveChallenges);
      // cc-nw-01 was attempted more recently
      expect(rec.recommendedChallenge?.id).toBe('cc-nw-01');
      expect(rec.isResume).toBe(true);
    });

    it('recommends next curriculum challenge when there are no uncompleted attempts', () => {
      const portfolio: PortfolioEntry[] = [
        {
          challengeId: 'cc-ph-01',
          bestFinalScore: 90,
          passedAt: '2026-10-01T10:00:00.000Z',
          skillsEarned: [],
          totalAttempts: 1,
        },
      ];

      const rec = getDeterministicRecommendation([], portfolio, liveChallenges);
      expect(rec.recommendedChallenge?.id).toBe('cc-ph-02');
      expect(rec.isResume).toBe(false);
    });

    it('returns null when all live challenges are completed', () => {
      const fullPortfolio: PortfolioEntry[] = liveChallenges.map((c) => ({
        challengeId: c.id,
        bestFinalScore: 100,
        passedAt: '2026-10-01T12:00:00.000Z',
        skillsEarned: c.skills,
        totalAttempts: 1,
      }));

      const rec = getDeterministicRecommendation([], fullPortfolio, liveChallenges);
      expect(rec.recommendedChallenge).toBeNull();
      expect(rec.isResume).toBe(false);
    });
  });

  // ── 3. Best-attempt result links and tie handling ─────────────────────────

  describe('getBestAttemptForChallenge', () => {
    it('returns undefined if no attempts exist for challenge', () => {
      expect(getBestAttemptForChallenge([], 'cc-ph-01')).toBeUndefined();
    });

    it('selects highest-scoring attempt', () => {
      const attempts: Attempt[] = [
        {
          id: 'att-low',
          challengeId: 'cc-ph-01',
          startedAt: '2026-10-01T10:00:00.000Z',
          completedAt: '2026-10-01T10:05:00.000Z',
          hintsUsed: 2,
          stepResponses: [],
          earnedScore: 80,
          finalScore: 60,
          passed: false,
          retryNumber: 0,
        },
        {
          id: 'att-high',
          challengeId: 'cc-ph-01',
          startedAt: '2026-10-01T10:10:00.000Z',
          completedAt: '2026-10-01T10:15:00.000Z',
          hintsUsed: 0,
          stepResponses: [],
          earnedScore: 90,
          finalScore: 90,
          passed: true,
          retryNumber: 1,
        },
      ];

      const best = getBestAttemptForChallenge(attempts, 'cc-ph-01');
      expect(best?.id).toBe('att-high');
    });

    it('breaks score ties by choosing the latest attempt', () => {
      const attempts: Attempt[] = [
        {
          id: 'att-tie-earlier',
          challengeId: 'cc-ph-01',
          startedAt: '2026-10-01T10:00:00.000Z',
          completedAt: '2026-10-01T10:05:00.000Z',
          hintsUsed: 0,
          stepResponses: [],
          earnedScore: 85,
          finalScore: 85,
          passed: true,
          retryNumber: 0,
        },
        {
          id: 'att-tie-later',
          challengeId: 'cc-ph-01',
          startedAt: '2026-10-01T12:00:00.000Z',
          completedAt: '2026-10-01T12:05:00.000Z',
          hintsUsed: 0,
          stepResponses: [],
          earnedScore: 85,
          finalScore: 85,
          passed: true,
          retryNumber: 1,
        },
      ];

      const best = getBestAttemptForChallenge(attempts, 'cc-ph-01');
      expect(best?.id).toBe('att-tie-later');
    });
  });

  // ── 4. Formatting Utilities ───────────────────────────────────────────────

  describe('formatScore & formatDate', () => {
    it('formats integer scores without decimals', () => {
      expect(formatScore(100)).toBe('100');
      expect(formatScore(0)).toBe('0');
      expect(formatScore(70)).toBe('70');
    });

    it('formats fractional scores with at most 1 decimal place', () => {
      expect(formatScore(72.5)).toBe('72.5');
      expect(formatScore(33.3333)).toBe('33.3');
      expect(formatScore(66.6666)).toBe('66.7');
    });

    it('handles non-numeric scores gracefully', () => {
      expect(formatScore(NaN)).toBe('0');
    });

    it('formats valid ISO dates and handles empty strings', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('invalid-date')).toBe('');
      expect(formatDate('2026-10-01T10:00:00.000Z')).toMatch(/2026/);
    });
  });

  // ── 5. Settings: Labels, save status, toggles, and reset preservation ─────

  describe('SettingsPage component', () => {
    it('renders a visible label for the display name input', () => {
      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      const label = screen.getByText('Display Name');
      expect(label.tagName.toLowerCase()).toBe('label');
      expect(label.getAttribute('for')).toBe('settings-display-name');

      const input = screen.getByRole('textbox', { name: /display name/i });
      expect(input).toBeDefined();
      expect(input.id).toBe('settings-display-name');
    });

    it('shows accessible save status feedback when saving display name', async () => {
      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      const input = screen.getByRole('textbox', { name: /display name/i });
      fireEvent.change(input, { target: { value: 'AgentZero' } });

      const saveBtn = screen.getByRole('button', { name: /save display name/i });
      fireEvent.click(saveBtn);

      const feedback = await screen.findByRole('status');
      expect(feedback.textContent).toContain('Display name saved');
      expect(useCyberStore.getState().profile.displayName).toBe('AgentZero');
    });

    it('does not display an unimplemented sound toggle control', () => {
      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      // reduced motion and low performance checkboxes exist
      expect(screen.getByLabelText(/reduced motion/i)).toBeDefined();
      expect(screen.getByLabelText(/low performance mode/i)).toBeDefined();

      // sound effects toggle should NOT be in user toggles
      expect(screen.queryByLabelText(/sound effects/i)).toBeNull();
    });

    it('cancel reset modal preserves progress', async () => {
      // Simulate existing attempt and portfolio in store
      const store = useCyberStore.getState();
      const mockChallenge = ALL_CHALLENGES[0];
      store.recordAttempt(mockChallenge, [{ stepId: 's1', submitted: true, pointsEarned: 100 }], 0, 0);

      expect(useCyberStore.getState().progress.attempts.length).toBe(1);

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      // Click "Reset All Progress"
      const resetBtn = screen.getByRole('button', { name: /reset all progress/i });
      fireEvent.click(resetBtn);

      // Verify modal is open
      expect(screen.getByText('Reset All Progress?')).toBeDefined();

      // Click "Cancel"
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);

      // Progress should remain intact
      expect(useCyberStore.getState().progress.attempts.length).toBe(1);
    });

    it('confirm reset modal clears progress while preserving display name and settings', async () => {
      const store = useCyberStore.getState();
      store.setDisplayName('SecResearcher');
      store.updateSettings({ reducedMotion: true, lowPerformanceMode: true, soundEnabled: false });

      const mockChallenge = ALL_CHALLENGES[0];
      store.recordAttempt(mockChallenge, [{ stepId: 's1', submitted: true, pointsEarned: 100 }], 0, 0);
      expect(useCyberStore.getState().progress.attempts.length).toBe(1);

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      const resetBtn = screen.getByRole('button', { name: /reset all progress/i });
      fireEvent.click(resetBtn);

      const confirmBtn = screen.getByRole('button', { name: /yes, reset everything/i });
      fireEvent.click(confirmBtn);

      // Progress is cleared
      const updatedState = useCyberStore.getState();
      expect(updatedState.progress.attempts.length).toBe(0);
      expect(updatedState.progress.portfolio.length).toBe(0);
      expect(Object.keys(updatedState.progress.skillTags).length).toBe(0);

      // Display name and preferences are preserved
      expect(updatedState.profile.displayName).toBe('SecResearcher');
      expect(updatedState.profile.settings.reducedMotion).toBe(true);
      expect(updatedState.profile.settings.lowPerformanceMode).toBe(true);
      expect(updatedState.profile.settings.soundEnabled).toBe(false);
    });
  });

  // ── 6. Dashboard & Portfolio Empty and Populated States ────────────────────

  describe('DashboardPage & PortfolioPage integration', () => {
    it('renders empty states with clear action links', () => {
      const { unmount } = render(
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/begin your cybersecurity training/i)).toBeDefined();
      expect(screen.getByRole('link', { name: /start first challenge/i })).toBeDefined();
      unmount();

      render(
        <MemoryRouter>
          <PortfolioPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/no challenges attempted yet/i)).toBeDefined();
      expect(screen.getByRole('link', { name: /enter campus/i })).toBeDefined();
    });

    it('renders completed challenge with Review Results linking to best attempt in Portfolio', () => {
      const store = useCyberStore.getState();
      const mockChallenge = ALL_CHALLENGES[0];
      const attempt = store.recordAttempt(
        mockChallenge,
        [{ stepId: 's1', submitted: true, pointsEarned: 100 }],
        0,
        0
      );

      render(
        <MemoryRouter>
          <PortfolioPage />
        </MemoryRouter>
      );

      expect(screen.getByText(/completed \(1\)/i)).toBeDefined();
      const reviewLink = screen.getByRole('link', { name: new RegExp(`review results for ${mockChallenge.title}`, 'i') });
      expect(reviewLink.getAttribute('href')).toBe(`/results/${attempt.id}`);
    });
  });
});
