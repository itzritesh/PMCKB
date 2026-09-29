/**
 * URL Helper Utility for PMCKB
 * Normalizes, validates, and securely detects URLs in meeting and calendar event location fields.
 *
 * Security:
 * - Strictly forbids unsafe schemes: javascript:, data:, vbscript:, file:, blob:
 * - Only navigates via safe web protocols: http:, https:
 * - Pure React rendering (zero dangerouslySetInnerHTML)
 */

// Unsafe protocol schemes that must NEVER be treated as links
const UNSAFE_PROTOCOL_REGEX = /^\s*(javascript|data|vbscript|file|blob):/i;

// Match complete HTTP/HTTPS URLs
const STANDALONE_HTTP_URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

// Match domains without protocol (e.g. www.youtube.com, youtube.com, meet.google.com/xyz, zoom.us/j/123)
const STANDALONE_DOMAIN_URL_REGEX = /^((?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost)(?::\d+)?(?:\/[^\s]*)?$/i;

// Match URLs embedded inside mixed text (e.g. "Room 4 or online at https://meet.google.com/xyz")
const EMBEDDED_URL_REGEX = /(https?:\/\/[^\s<>]+|www\.[^\s<>]+|(?:[a-zA-Z0-9-]+\.)+(?:com|org|net|edu|gov|io|ai|app|co|us|uk|in|me|dev|tv|info|biz|so|xyz|tech|online|site|space|store|live)(?::\d+)?(?:\/[^\s<>]*)?)/gi;

/**
 * Check if input does not contain dangerous protocols like javascript: or data:
 * @param {string} url
 * @returns {boolean}
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return !UNSAFE_PROTOCOL_REGEX.test(url.trim());
}

/**
 * Validates whether an entire string is a safe, actionable web URL
 * (either full http(s):// or domain-based such as www.youtube.com or meet.google.com/xyz).
 *
 * @param {string} input
 * @returns {boolean}
 */
export function isValidUrl(input) {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();
  if (!isSafeUrl(trimmed)) return false;

  // 1. Explicit http:// or https://
  if (STANDALONE_HTTP_URL_REGEX.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }

  // 2. Domain-based URL (without protocol)
  if (STANDALONE_DOMAIN_URL_REGEX.test(trimmed)) {
    try {
      const parsed = new URL('https://' + trimmed);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Normalizes user-entered URL into a safe, navigable web address.
 * If user entered "www.youtube.com" or "youtube.com", prepends "https://".
 * If user already provided "http://" or "https://", preserves it.
 * If input is unsafe or not a valid URL, returns empty string.
 *
 * @param {string} input
 * @returns {string} Normalized URL safe for <a href="...">
 */
export function normalizeUrl(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!isSafeUrl(trimmed)) return '';

  // Already has safe protocol
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Domain or www without protocol -> prepend https://
  if (isValidUrl(trimmed)) {
    return 'https://' + trimmed;
  }

  return '';
}

/**
 * Check if the location string is purely a URL (not mixed with room/location text)
 * @param {string} text
 * @returns {boolean}
 */
export function isPureUrl(text) {
  if (!text || typeof text !== 'string') return false;
  return isValidUrl(text.trim());
}

/**
 * Parses a location field into structured tokens (text segments and clickable URL tokens).
 * Handles standalone URLs, plain text locations ("Conference Room 2"), and mixed descriptions
 * ("Room 101 or join https://meet.google.com/abc").
 *
 * @param {string} text
 * @returns {Array<{type: 'text'|'url', text: string, href?: string}>}
 */
export function parseLocationTokens(text) {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  // 1. If entire string is a standalone valid URL
  if (isValidUrl(trimmed)) {
    return [
      {
        type: 'url',
        text: trimmed,
        href: normalizeUrl(trimmed),
      },
    ];
  }

  // 2. If it contains dangerous scheme, render as safe plain text only
  if (UNSAFE_PROTOCOL_REGEX.test(trimmed)) {
    return [{ type: 'text', text: trimmed }];
  }

  // 3. Scan for embedded URLs within mixed text
  const tokens = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(EMBEDDED_URL_REGEX.source, 'gi');

  while ((match = regex.exec(trimmed)) !== null) {
    const matchStart = match.index;
    const matchStr = match[0];

    // Strip trailing punctuation commonly appended in sentences (e.g. "visit meet.google.com/xyz.")
    let cleanMatchStr = matchStr;
    let trailingPunct = '';
    while (cleanMatchStr.length > 0 && /[.,;:!?)]$/.test(cleanMatchStr)) {
      if (cleanMatchStr.endsWith(')') && cleanMatchStr.includes('(')) {
        break;
      }
      trailingPunct = cleanMatchStr.slice(-1) + trailingPunct;
      cleanMatchStr = cleanMatchStr.slice(0, -1);
    }

    if (!isValidUrl(cleanMatchStr)) {
      continue;
    }

    // Add preceding text before the URL
    if (matchStart > lastIndex) {
      tokens.push({
        type: 'text',
        text: trimmed.slice(lastIndex, matchStart),
      });
    }

    // Add the verified URL token
    tokens.push({
      type: 'url',
      text: cleanMatchStr,
      href: normalizeUrl(cleanMatchStr),
    });

    // Add trailing punctuation if any
    if (trailingPunct) {
      tokens.push({
        type: 'text',
        text: trailingPunct,
      });
    }

    lastIndex = matchStart + matchStr.length;
  }

  // Add remaining text after last match
  if (lastIndex < trimmed.length) {
    tokens.push({
      type: 'text',
      text: trimmed.slice(lastIndex),
    });
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', text: trimmed }];
}
