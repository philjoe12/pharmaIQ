/**
 * Date manipulation utilities
 */

/**
 * Format date to ISO string
 */
export function toISOString(date: Date | string): string {
  return new Date(date).toISOString();
}

/**
 * Format date for display (e.g., "Jan 15, 2024")
 */
export function formatDate(date: Date | string): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return new Date(date).toLocaleDateString('en-US', options);
}

/**
 * Get time ago string (e.g., "2 hours ago")
 */
export function timeAgo(date: Date | string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
}

/**
 * Check if date is expired
 */
export function isExpired(expirationDate: Date | string): boolean {
  return new Date(expirationDate) < new Date();
}