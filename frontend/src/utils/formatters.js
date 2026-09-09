// utils/formatters.js — Utility helpers

/**
 * Returns a time-of-day greeting string.
 */
export function getGreeting(name = '') {
  const hour = new Date().getHours()
  let greeting
  if (hour < 12)      greeting = 'Good Morning'
  else if (hour < 17) greeting = 'Good Afternoon'
  else                greeting = 'Good Evening'
  return name ? `${greeting}, ${name}!` : `${greeting}!`
}

/**
 * Format a number of seconds into human-readable time.
 * e.g. 3670 → "1h 1m"
 */
export function formatDuration(seconds) {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/**
 * Format an ISO date string to a readable short date.
 * e.g. "2024-06-01T10:30:00" → "Jun 1"
 */
export function formatDate(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert a snake_case or kebab-case string to Title Case.
 * e.g. "concept_tag" → "Concept Tag"
 */
export function toTitleCase(str) {
  if (!str) return ''
  return str
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Truncate a string to maxLength characters.
 */
export function truncate(str, maxLength = 80) {
  if (!str) return ''
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str
}

/**
 * Get the difficulty color classes.
 */
export function difficultyClasses(level) {
  switch (level?.toLowerCase()) {
    case 'advanced':     return 'badge-danger'
    case 'intermediate': return 'badge-warning'
    default:             return 'badge-success'
  }
}
