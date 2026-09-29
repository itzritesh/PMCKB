/**
 * Validate and sanitize redirect paths to protect against Open Redirect vulnerabilities.
 * Strictly requires internal relative paths starting with a single '/'
 * and forbids '//', '\', and protocol schemes ('javascript:', 'data:', 'http:', etc.).
 *
 * @param {string|null|undefined} redirectPath - Raw redirect parameter
 * @param {string} [fallback='/dashboard'] - Safe fallback route
 * @returns {string} Safe internal route path
 */
export function sanitizeInternalRedirect(redirectPath, fallback = '/dashboard') {
  if (!redirectPath || typeof redirectPath !== 'string') {
    return fallback;
  }

  const trimmed = redirectPath.trim();

  // Must start with '/' and must NOT start with '//' (protocol-relative URL)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  // Must not contain backslashes
  if (trimmed.includes('\\')) {
    return fallback;
  }

  // Must not contain scheme colon before query/hash (e.g. '/javascript:...', '/http:...')
  const firstSeparator = trimmed.search(/[?#]/);
  const pathPart = firstSeparator === -1 ? trimmed : trimmed.slice(0, firstSeparator);
  if (pathPart.includes(':')) {
    return fallback;
  }

  return trimmed;
}
