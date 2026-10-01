// ============================================================
// CyberCampus — Campus Scene Utilities
// ============================================================

/**
 * Distinguishes clicks from camera drags.
 * A pointer movement greater than the threshold (default 5px) is classified as a drag.
 */
export function isDragMovement(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  threshold = 5
): boolean {
  return Math.hypot(endX - startX, endY - startY) > threshold;
}

/**
 * Checks whether an error stems from a failed dynamic lazy import or chunk fetch.
 * When dynamic imports fail, browsers cache the rejected promise in the module map;
 * simple state-reset retries cannot recover without a page reload.
 */
export function isChunkLoadError(
  error: Error | string | null | undefined
): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : error.message || '';
  const name = typeof error === 'string' ? '' : error.name || '';
  return (
    name === 'ChunkLoadError' ||
    /failed to fetch dynamically imported module|error loading dynamically imported module|loading chunk/i.test(
      msg
    )
  );
}
