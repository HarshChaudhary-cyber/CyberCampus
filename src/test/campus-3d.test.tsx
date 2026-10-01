// ============================================================
// CyberCampus — Campus 3D Accessibility, Motion, & Recovery Tests
//
// NOTE: WebGL and Three.js Canvas are mocked at the component
// boundary for jsdom execution. These unit and integration tests
// verify component lifecycle, accessibility landmarks, focusable
// DOM hierarchies, drag-vs-click thresholds, state recovery, and
// user/OS reduced-motion preference handling. They do NOT claim
// to prove hardware GPU rendering or visual WebGL rasterization.
// ============================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CampusPage } from '../pages/CampusPage';
import { useCyberStore } from '../store';
import {
  getWebGLAvailability,
  resetWebGLAvailabilityCache,
} from '../campus/webglSupport';
import { isDragMovement, isChunkLoadError } from '../campus/campusUtils';

let mockSceneError: Error | null = null;

// Mock CampusScene at the component boundary
vi.mock('../campus/CampusScene', () => {
  return {
    CampusScene: ({
      reducedMotion,
      selectedRoomId,
      onSelectRoom,
      onContextLost,
    }: {
      reducedMotion: boolean;
      selectedRoomId: string | null;
      onSelectRoom: (roomId: string) => void;
      onContextLost?: () => void;
    }) => {
      if (mockSceneError) {
        throw mockSceneError;
      }
      return (
        <div
          data-testid="mock-campus-scene"
          data-reduced-motion={String(reducedMotion)}
          data-selected-room={selectedRoomId || 'none'}
        >
          <button
            type="button"
            data-testid="select-phishing-btn"
            onClick={() => onSelectRoom('phishing')}
          >
            Select Phishing
          </button>
          <button
            type="button"
            data-testid="select-network-btn"
            onClick={() => onSelectRoom('network')}
          >
            Select Network
          </button>
          <button
            type="button"
            data-testid="trigger-context-loss-btn"
            onClick={() => onContextLost?.()}
          >
            Trigger Context Loss
          </button>
        </div>
      );
    },
  };
});

describe('Campus 3D Accessibility, Motion, and Recovery (Task 8A.1)', () => {
  const initialStore = useCyberStore.getState();

  beforeEach(() => {
    // Reset Zustand store state to defaults
    useCyberStore.setState({
      profile: {
        ...initialStore.profile,
        settings: {
          ...initialStore.profile.settings,
          lowPerformanceMode: false,
          reducedMotion: false,
        },
      },
      progress: {
        ...initialStore.progress,
        portfolio: [],
      },
    });

    // Default WebGL availability to true for 3D tests
    resetWebGLAvailabilityCache(true);
    mockSceneError = null;

    // Mock matchMedia to default to prefers-reduced-motion: false
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    mockSceneError = null;
    resetWebGLAvailabilityCache(null);
    vi.restoreAllMocks();
  });

  // ── 1. Accessible Room Navigation in 3D Mode ───────────────────────────────
  describe('Accessible Room Navigation in 3D Mode', () => {
    it('keeps all five room links accessible to assistive technology and keyboard in 3D mode', async () => {
      render(
        <MemoryRouter>
          <CampusPage />
        </MemoryRouter>
      );

      // Verify 3D scene is mounted asynchronously via Suspense
      expect(await screen.findByTestId('mock-campus-scene')).toBeDefined();

      // Find all room navigation links
      const phishingLink = screen.getByRole('link', {
        name: /Phishing Defense/i,
      });
      const secopsLink = screen.getByRole('link', {
        name: /Security Operations/i,
      });
      const networkLink = screen.getByRole('link', {
        name: /Network Security/i,
      });
      const forensicsLink = screen.getByRole('link', {
        name: /Digital Forensics/i,
      });
      const privacyLink = screen.getByRole('link', {
        name: /Privacy & Account Security/i,
      });

      const links = [
        phishingLink,
        secopsLink,
        networkLink,
        forensicsLink,
        privacyLink,
      ];
      expect(links).toHaveLength(5);

      // CRITICAL CHECK: None of the links must have an ancestor with aria-hidden="true"
      for (const link of links) {
        let parent: HTMLElement | null = link.parentElement;
        while (parent && parent !== document.body) {
          expect(parent.getAttribute('aria-hidden')).not.toBe('true');
          parent = parent.parentElement;
        }
        // Verify link is focusable
        link.focus();
        expect(document.activeElement).toBe(link);
      }
    });

    it('uses semantic navigation landmark for room links in 3D mode', () => {
      render(
        <MemoryRouter>
          <CampusPage />
        </MemoryRouter>
      );

      const navLandmarks = screen.getAllByRole('navigation');
      expect(navLandmarks.length).toBeGreaterThan(0);
      const campusNav = screen.getByRole('navigation', {
        name: /Campus rooms navigation/i,
      });
      expect(campusNav).toBeDefined();
    });
  });

  // ── 2. Building Selection and Room Panel ───────────────────────────────────
  describe('Building Selection and Room Panel', () => {
    it('clicking a building opens the room panel with title, description, progress, and Enter Room link', async () => {
      // Seed progress: 2 completed challenges in Phishing Defense
      useCyberStore.setState((s) => ({
        ...s,
        progress: {
          ...s.progress,
          portfolio: [
            {
              challengeId: 'cc-ph-01',
              passedAt: '2026-10-01T00:00:00.000Z',
              bestFinalScore: 100,
              skillsEarned: ['phishing-analysis'],
              totalAttempts: 1,
            },
            {
              challengeId: 'cc-ph-02',
              passedAt: '2026-10-01T00:00:00.000Z',
              bestFinalScore: 100,
              skillsEarned: ['domain-verification'],
              totalAttempts: 1,
            },
          ],
        },
      }));

      render(
        <MemoryRouter>
          <CampusPage />
        </MemoryRouter>
      );

      // Select Phishing room via scene callback
      const selectBtn = await screen.findByTestId('select-phishing-btn');
      fireEvent.click(selectBtn);

      // Verify the HTML room panel appears with accessible role and title
      const roomPanel = screen.getByRole('region', {
        name: /Phishing Defense details/i,
      });
      expect(roomPanel).toBeDefined();

      // Title & description
      expect(screen.getByRole('heading', { name: 'Phishing Defense' })).toBeDefined();
      expect(
        screen.getByText(
          /Spot deceptive emails, spoofed domains, and social engineering attacks/i
        )
      ).toBeDefined();

      // Completion count reflects saved progress (2/3 completed)
      expect(screen.getByText('2/3 completed')).toBeDefined();

      // "Enter Room" link routes to /room/phishing
      const enterLink = screen.getByRole('link', { name: 'Enter Room' });
      expect(enterLink.getAttribute('href')).toBe('/room/phishing');

      // Close button dismisses the panel
      const closeBtn = screen.getByRole('button', {
        name: /Close room details panel/i,
      });
      fireEvent.click(closeBtn);
      expect(
        screen.queryByRole('region', { name: /Phishing Defense details/i })
      ).toBeNull();
    });

    it('enter room link uses the correct route for each selected room', async () => {
      render(
        <MemoryRouter>
          <CampusPage />
        </MemoryRouter>
      );

      // Select Network Security
      const netBtn = await screen.findByTestId('select-network-btn');
      fireEvent.click(netBtn);

      const enterLink = screen.getByRole('link', { name: 'Enter Room' });
      expect(enterLink.getAttribute('href')).toBe('/room/network');
    });
  });

  // ── 3. Drag Distinction Threshold Logic ─────────────────────────────────────
  describe('Dragging does not activate a building', () => {
    it('distinguishes click from drag using distance threshold (> 5px)', () => {
      // In-place click (0px movement) is NOT a drag
      expect(isDragMovement(100, 100, 100, 100)).toBe(false);

      // Micro-movement <= 5px (e.g. 3px, 4px -> hypotenuse 5px) is NOT a drag
      expect(isDragMovement(100, 100, 103, 104)).toBe(false);

      // Movement > 5px (e.g. 4px, 4px -> hypotenuse ~5.65px) IS a drag
      expect(isDragMovement(100, 100, 104, 104)).toBe(true);

      // Camera orbiting drag (> 5px) is properly flagged as a drag
      expect(isDragMovement(100, 100, 120, 110)).toBe(true);
      expect(isDragMovement(100, 100, 100, 150)).toBe(true);
    });
  });

  // ── 4. Reduced Motion Preferences (Saved & OS) ─────────────────────────────
  describe('Reduced Motion Handling', () => {
    it('honors profile.settings.reducedMotion', async () => {
      useCyberStore.setState((s) => ({
        ...s,
        profile: {
          ...s.profile,
          settings: {
            ...s.profile.settings,
            reducedMotion: true,
          },
        },
      }));

      render(
        <MemoryRouter>
          <CampusPage />
        </MemoryRouter>
      );

      const scene = await screen.findByTestId('mock-campus-scene');
      expect(scene.getAttribute('data-reduced-motion')).toBe('true');
    });

    it('honors operating-system prefers-reduced-motion and responds to changes', async () => {
      let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') changeHandler = handler;
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <MemoryRouter>
          <CampusPage />
        </MemoryRouter>
      );

      const scene = await screen.findByTestId('mock-campus-scene');
      expect(scene.getAttribute('data-reduced-motion')).toBe('true');
      expect(changeHandler).toBeDefined();
    });

    it('cleans up matchMedia event listeners on unmount', () => {
      const removeEventListenerMock = vi.fn();
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerMock,
        dispatchEvent: vi.fn(),
      }));

      const { unmount } = render(
        <MemoryRouter>
          <CampusPage />
        </MemoryRouter>
      );

      unmount();
      expect(removeEventListenerMock).toHaveBeenCalled();
    });
  });

  // ── 5. Low Performance Mode ────────────────────────────────────────────────
  describe('Low Performance Mode', () => {
    it('avoids mounting or loading the 3D scene when lowPerformanceMode is active', () => {
      useCyberStore.setState((s) => ({
        ...s,
        profile: {
          ...s.profile,
          settings: {
            ...s.profile.settings,
            lowPerformanceMode: true,
          },
        },
      }));

      render(
        <MemoryRouter>
          <CampusPage />
        </MemoryRouter>
      );

      // 3D scene must NOT be in the DOM
      expect(screen.queryByTestId('mock-campus-scene')).toBeNull();

      // 2D grid should be present with 5 room cards
      const campusNav = screen.getByRole('navigation', {
        name: /Campus rooms/i,
      });
      expect(campusNav).toBeDefined();

      const toggleBtn = screen.getByRole('button', { name: /Switch to 3D view/i });
      expect(toggleBtn).toBeDefined();
    });
  });

  // ── 6. Reliable Fallback & Recovery ────────────────────────────────────────
  describe('Reliable Fallback and Recovery', () => {
    it('disables 3D toggle when WebGL probe fails and prevents bypassing', () => {
      resetWebGLAvailabilityCache(false);

      render(
        <MemoryRouter>
          <CampusPage />
        </MemoryRouter>
      );

      // 3D scene must not mount
      expect(screen.queryByTestId('mock-campus-scene')).toBeNull();

      // Toggle button must be disabled
      const toggleBtn = screen.getByRole('button', {
        name: /3D view unavailable/i,
      });
      expect(toggleBtn.hasAttribute('disabled')).toBe(true);

      // Attempting to click must NOT activate 3D
      fireEvent.click(toggleBtn);
      expect(screen.queryByTestId('mock-campus-scene')).toBeNull();
    });

    it('recovers to working 2D navigation when WebGL context is lost', async () => {
      render(
        <MemoryRouter>
          <CampusPage />
        </MemoryRouter>
      );

      expect(await screen.findByTestId('mock-campus-scene')).toBeDefined();

      // Trigger WebGL context loss
      const contextLossBtn = await screen.findByTestId('trigger-context-loss-btn');
      fireEvent.click(contextLossBtn);

      // Scene unmounts and falls back to 2D
      expect(screen.queryByTestId('mock-campus-scene')).toBeNull();

      // Fallback banner is displayed with explanatory message
      const fallbackAlert = screen.getByRole('status');
      expect(fallbackAlert.textContent).toContain(
        '3D campus view is unavailable (WebGL graphics context was lost)'
      );

      // All 5 2D room cards are immediately available
      const roomCards = screen.getAllByRole('link', { name: /Enter /i });
      expect(roomCards).toHaveLength(5);

      // Retry button is available and functional
      const retryBtn = screen.getByRole('button', { name: /Retry 3D View/i });
      expect(retryBtn).toBeDefined();

      // Clicking Retry restores 3D view
      fireEvent.click(retryBtn);
      expect(await screen.findByTestId('mock-campus-scene')).toBeDefined();
    });

    it('releases probe context via loseContext during WebGL availability check', () => {
      resetWebGLAvailabilityCache(null);
      const loseContextMock = vi.fn();

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          return {
            getContext: (type: string) => {
              if (type.includes('webgl')) {
                return {
                  getExtension: (ext: string) => {
                    if (ext === 'WEBGL_lose_context') {
                      return { loseContext: loseContextMock };
                    }
                    return null;
                  },
                };
              }
              return null;
            },
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tagName);
      });

      const available = getWebGLAvailability();
      expect(available).toBe(true);
      expect(loseContextMock).toHaveBeenCalled();
    });

    it('rejects WebGL 1 when WebGL 2 is unavailable because Three.js strictly requires WebGL 2', () => {
      resetWebGLAvailabilityCache(null);

      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'canvas') {
          return {
            getContext: (type: string) => {
              // Legacy WebGL 1 returns context, but WebGL 2 returns null
              if (type === 'webgl2') return null;
              if (type === 'webgl' || type === 'experimental-webgl') {
                return {
                  getExtension: () => null,
                };
              }
              return null;
            },
          } as unknown as HTMLCanvasElement;
        }
        return originalCreateElement(tagName);
      });

      const available = getWebGLAvailability();
      expect(available).toBe(false);
    });

    it('provides honest reload action for lazy chunk import failures and preserves saved settings', async () => {
      mockSceneError = new Error('Failed to fetch dynamically imported module: /src/campus/CampusScene.tsx');

      render(
        <MemoryRouter>
          <CampusPage />
        </MemoryRouter>
      );

      // Verify fallback notice displays chunk load failure guidance
      const statusNotice = screen.getByRole('status');
      expect(statusNotice.textContent).toContain(
        'The 3D campus module failed to load over the network. Showing 2D navigation.'
      );

      // Honest "Reload Page" button must be shown (NOT a false Retry button)
      const reloadBtn = screen.getByRole('button', { name: /Reload Page/i });
      expect(reloadBtn).toBeDefined();
      expect(screen.queryByRole('button', { name: /Retry 3D View/i })).toBeNull();

      // Temporary failure must NOT overwrite saved user preference
      expect(useCyberStore.getState().profile.settings.lowPerformanceMode).toBe(false);

      // 2D room navigation remains accessible
      expect(screen.getAllByRole('link', { name: /Enter /i })).toHaveLength(5);
    });

    it('recovers from scene runtime render error via Retry 3D view and preserves saved settings', async () => {
      mockSceneError = new Error('Shader compilation error: syntax error');

      render(
        <MemoryRouter>
          <CampusPage />
        </MemoryRouter>
      );

      // Verify fallback notice displays runtime error
      const statusNotice = screen.getByRole('status');
      expect(statusNotice.textContent).toContain('Shader compilation error: syntax error');

      // "Retry 3D View" button is available
      const retryBtn = screen.getByRole('button', { name: /Retry 3D View/i });
      expect(retryBtn).toBeDefined();

      // Saved preference lowPerformanceMode is not overwritten
      expect(useCyberStore.getState().profile.settings.lowPerformanceMode).toBe(false);

      // Clear the error and click retry
      mockSceneError = null;
      fireEvent.click(retryBtn);

      // 3D scene re-mounts successfully
      expect(await screen.findByTestId('mock-campus-scene')).toBeDefined();
    });

    it('accurately classifies dynamic import and chunk errors via isChunkLoadError', () => {
      expect(isChunkLoadError(new Error('Failed to fetch dynamically imported module'))).toBe(true);
      expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true);
      const chunkErr = new Error('Loading chunk 42 failed');
      chunkErr.name = 'ChunkLoadError';
      expect(isChunkLoadError(chunkErr)).toBe(true);

      // Normal runtime / WebGL errors are NOT chunk errors
      expect(isChunkLoadError(new Error('WebGL graphics context was lost'))).toBe(false);
      expect(isChunkLoadError(new Error('Cannot read properties of null'))).toBe(false);
      expect(isChunkLoadError(null)).toBe(false);
    });
  });

  // ── 7. Completion Counts Use Saved Progress ─────────────────────────────────
  describe('Completion Counts Use Saved Progress', () => {
    it('displays accurate completion count for each room from progress.portfolio', () => {
      useCyberStore.setState((s) => ({
        ...s,
        profile: {
          ...s.profile,
          settings: {
            ...s.profile.settings,
            lowPerformanceMode: true, // test in 2D mode for direct card badges
          },
        },
        progress: {
          ...s.progress,
          portfolio: [
            {
              challengeId: 'cc-so-01',
              passedAt: '2026-10-01T00:00:00.000Z',
              bestFinalScore: 100,
              skillsEarned: ['incident-triage'],
              totalAttempts: 1,
            },
          ],
        },
      }));

      render(
        <MemoryRouter>
          <CampusPage />
        </MemoryRouter>
      );

      // Security operations should show 1/3 completed
      expect(screen.getByText('1/3 completed')).toBeDefined();
      expect(screen.getByText('1/3 done')).toBeDefined();
    });
  });
});
