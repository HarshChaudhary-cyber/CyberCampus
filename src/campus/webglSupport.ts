// ============================================================
// CyberCampus — WebGL Availability Probe
// Probes WebGL once, releases the temporary probe context via
// WEBGL_lose_context, and caches the result to avoid re-probing.
// ============================================================

let cachedAvailability: boolean | null = null;

export function getWebGLAvailability(): boolean {
  if (cachedAvailability !== null) {
    return cachedAvailability;
  }

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    cachedAvailability = false;
    return false;
  }

  try {
    const canvas = document.createElement('canvas');
    // Modern Three.js requires WebGL 2. Check strictly for webgl2 context.
    const gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;

    if (!gl) {
      cachedAvailability = false;
      return false;
    }

    // Release the temporary probe context immediately
    const loseContextExt = gl.getExtension?.('WEBGL_lose_context');
    if (loseContextExt && typeof loseContextExt.loseContext === 'function') {
      loseContextExt.loseContext();
    }

    cachedAvailability = true;
    return true;
  } catch {
    cachedAvailability = false;
    return false;
  }
}

/**
 * Resets the cached availability value.
 * Used exclusively for testing fallback behaviors.
 */
export function resetWebGLAvailabilityCache(forceValue?: boolean | null): void {
  cachedAvailability = forceValue !== undefined ? forceValue : null;
}
