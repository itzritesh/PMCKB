import React from 'react';
import { ExternalLink, Link2, MapPin } from 'lucide-react';
import { parseLocationTokens, isPureUrl } from '../../utils/urlHelper';

/**
 * Reusable Location / Link Display Component for PMCKB
 *
 * Intelligently handles:
 * 1. Pure URLs (e.g. www.youtube.com, https://meet.google.com/xyz) -> Clickable anchor opening in new tab
 * 2. Physical locations (e.g. "Conference Room 2") -> Normal styled text
 * 3. Mixed text (e.g. "Room 101 or join at https://meet.google.com/abc") -> URL parts clickable, text parts normal
 * 4. Safety: Prevents unsafe protocols (javascript:, data:) and injection (zero dangerouslySetInnerHTML)
 * 5. Responsive / Mobile: Prevents overflow with word-break: break-all / break-words
 */
export default function LocationDisplay({
  location,
  fallback = 'No location set',
  className = '',
  linkClassName = '',
  showExternalIcon = true,
  showLinkIcon = false,
  compact = false,
}) {
  if (!location || !location.trim()) {
    return (
      <span className={`text-slate-400 italic ${compact ? 'text-xs' : 'text-xs sm:text-sm'} ${className}`}>
        {fallback}
      </span>
    );
  }

  const tokens = parseLocationTokens(location);

  // If entire location is plain text (no URLs detected)
  if (tokens.length === 1 && tokens[0].type === 'text') {
    return (
      <span className={`text-slate-800 font-medium ${compact ? 'text-xs truncate block' : 'text-xs sm:text-sm break-words'} ${className}`}>
        {tokens[0].text}
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${compact ? 'max-w-full truncate' : 'break-words'} ${className}`}>
      {tokens.map((token, idx) => {
        if (token.type === 'url') {
          return (
            <a
              key={idx}
              href={token.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 hover:underline font-semibold transition-colors cursor-pointer break-all ${
                compact ? 'text-xs' : 'text-xs sm:text-sm'
              } ${linkClassName}`}
              title={`Open ${token.href} in new tab`}
            >
              {showLinkIcon && <Link2 className="w-3.5 h-3.5 shrink-0 opacity-80" />}
              <span className="break-all">{token.text}</span>
              {showExternalIcon && (
                <ExternalLink className="w-3 h-3 shrink-0 opacity-70 hover:opacity-100" />
              )}
            </a>
          );
        }

        return (
          <span key={idx} className="text-slate-800 font-medium break-words">
            {token.text}
          </span>
        );
      })}
    </span>
  );
}

export { isPureUrl };
