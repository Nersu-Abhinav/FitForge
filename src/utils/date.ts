// ============================================================================
// FitForge Calendar & Local Date Utilities
// Treats dates as local calendar dates (YYYY-MM-DD) to prevent midnight UTC drift
// ============================================================================

/**
 * Formats a Date object as a local calendar date string (YYYY-MM-DD)
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's calendar date in local timezone (evaluated at runtime call)
 */
export function getToday(): string {
  return getLocalDateString(new Date());
}

/**
 * Returns yesterday's calendar date in local timezone
 */
export function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

/**
 * Safely parses a YYYY-MM-DD string into a local Date instance without UTC shifts
 */
export function parseLocalDateString(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number);
  return new Date(parts[0] || new Date().getFullYear(), (parts[1] || 1) - 1, parts[2] || 1);
}

/**
 * Offsets a date string by a number of days (+ / -)
 */
export function offsetDateString(dateStr: string, daysOffset: number): string {
  const d = parseLocalDateString(dateStr);
  d.setDate(d.getDate() + daysOffset);
  return getLocalDateString(d);
}

/**
 * Formats a YYYY-MM-DD string into a friendly user display string
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const today = getToday();
  const yesterday = getYesterday();
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const d = parseLocalDateString(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

