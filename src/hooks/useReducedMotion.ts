// ============================================================
// CyberCampus — Global Reduced Motion Hook
// Combines user preference from settings with OS prefers-reduced-motion.
// ============================================================

import { useState, useEffect } from 'react';
import { useCyberStore } from '../store';

/**
 * Returns true if either the user has enabled "Reduced Motion" in CyberCampus settings
 * or the operating system / browser requests prefers-reduced-motion: reduce.
 * Responds to system media query changes dynamically and cleans up listeners.
 */
export function useEffectiveReducedMotion(): boolean {
  const profileReducedMotion = useCyberStore((s) => s.profile.settings.reducedMotion);

  const [osPrefersReduced, setOsPrefersReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      setOsPrefersReduced(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else if ('addListener' in mediaQuery) {
      (mediaQuery as unknown as { addListener: (cb: (e: MediaQueryListEvent) => void) => void }).addListener(handler);
      return () => {
        (mediaQuery as unknown as { removeListener: (cb: (e: MediaQueryListEvent) => void) => void }).removeListener(handler);
      };
    }
  }, []);

  return Boolean(profileReducedMotion || osPrefersReduced);
}
