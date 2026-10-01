// ============================================================
// CyberCampus — Formatting Utilities
// ============================================================

/**
 * Formats a score for consistent UI display without altering stored numerical values.
 * Whole numbers are formatted without decimals (e.g., 100 -> "100", 0 -> "0").
 * Fractional numbers are rounded to at most 1 decimal place (e.g., 72.5 -> "72.5", 33.333 -> "33.3").
 */
export function formatScore(score: number): string {
  if (typeof score !== 'number' || isNaN(score)) return '0';
  if (Number.isInteger(score)) return String(score);
  return (Math.round(score * 10) / 10).toString();
}

/**
 * Formats an ISO timestamp into a user-friendly localized date string.
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
