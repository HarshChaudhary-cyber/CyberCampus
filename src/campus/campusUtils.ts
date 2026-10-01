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
