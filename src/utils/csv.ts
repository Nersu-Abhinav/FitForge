/**
 * Utility functions for generating valid RFC 4180-compliant CSV files.
 */

/**
 * Escapes a field value for CSV:
 * - Wraps the value in double quotes.
 * - Replaces any existing double quotes with two double quotes ("").
 * - Handles null and undefined by returning empty quoted string or empty string.
 */
export function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
}
