/**
 * Silk Value – shared formatting utilities
 */

/**
 * Format a number as Indian-locale currency (INR by default).
 * Falls back gracefully if Intl is unavailable.
 */
export function formatCurrency(
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format a weight in kilograms to a human-readable string.
 * e.g. 12.5  → "12.50 kg"
 */
export function formatWeight(kg: number, decimals: number = 2): string {
  return `${kg.toFixed(decimals)} kg`;
}

/**
 * Format a Date (or ISO string) to a short locale date.
 * e.g. "09 Apr 2026"
 */
export function formatDate(value: Date | string, locale: string = 'en-IN'): string {
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(value);
  }
}

/**
 * Format a Date to a short time string.
 * e.g. "14:35"
 */
export function formatTime(value: Date | string, locale: string = 'en-IN'): string {
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

/**
 * Return a human-readable "X mins ago" / "X hrs ago" relative label.
 */
export function formatRelativeTime(value: Date | string): string {
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    const diffMs = Date.now() - d.getTime();
    if (diffMs < 60_000) return 'just now';
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } catch {
    return '—';
  }
}
