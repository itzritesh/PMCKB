import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  User,
  Users,
  Search,
  Check,
  X,
  ChevronDown,
  Loader2,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { teamService } from '../../services/teamService';

/**
 * Reusable helper to safely extract and format user display name
 */
export const getUserDisplayName = (user) => {
  if (!user) return '';
  if (typeof user === 'string') return user;
  if (user.name && typeof user.name === 'string' && user.name.trim()) {
    return user.name.trim();
  }
  if (user.full_name && typeof user.full_name === 'string' && user.full_name.trim()) {
    return user.full_name.trim();
  }
  if (user.first_name || user.last_name) {
    const combined = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    if (combined) return combined;
  }
  if (user.user_name && typeof user.user_name === 'string' && user.user_name.trim()) {
    return user.user_name.trim();
  }
  return user.email || 'Team Member';
};

/**
 * Reusable helper to extract initials
 */
export const getUserInitials = (name) => {
  if (!name) return '?';
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

// Global in-memory cache by teamId
const memberCache = new Map();

/**
 * TeamMemberSelect Component
 * 
 * Strict team-scoped member selection supporting:
 * - Single select or Multi-select (with chips and X remove buttons)
 * - Full name display as primary label with email secondary
 * - Filtered by current team members only
 * - Exclude specific user IDs (e.g. already-invited meeting attendees)
 * - Live search inside dropdown (team-scoped)
 * - Loading, Error + Retry, and Empty states
 * - Mobile responsive light-theme styling
 */
export default function TeamMemberSelect({
  teamId,
  initialMembers = null,
  value, // Array of IDs if multiple, single ID if not
  onChange,
  multiple = false,
  excludeUserIds = [],
  placeholder,
  disabled = false,
  className = '',
  allowClear = true,
}) {
  const [members, setMembers] = useState(() => {
    if (initialMembers && initialMembers.length > 0) return initialMembers;
    if (teamId && memberCache.has(String(teamId))) {
      return memberCache.get(String(teamId));
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize excluded IDs into a Set of strings
  const excludedSet = useMemo(() => {
    const s = new Set();
    if (Array.isArray(excludeUserIds)) {
      excludeUserIds.forEach((id) => {
        if (id !== null && id !== undefined) s.add(String(id));
      });
    }
    return s;
  }, [excludeUserIds]);

  // Normalize current selected value(s) into array of string IDs
  const selectedIds = useMemo(() => {
    if (multiple) {
      if (!Array.isArray(value)) return [];
      return value.map((v) => (typeof v === 'object' && v !== null ? String(v.id || v.user_id) : String(v)));
    } else {
      if (value === null || value === undefined || value === '') return [];
      const id = typeof value === 'object' ? value.id || value.user_id : value;
      return [String(id)];
    }
  }, [value, multiple]);

  // Fetch team members when teamId changes or on retry
  const fetchMembers = async (force = false) => {
    if (!teamId) {
      if (initialMembers) setMembers(initialMembers);
      return;
    }

    const cacheKey = String(teamId);
    if (!force && memberCache.has(cacheKey)) {
      setMembers(memberCache.get(cacheKey));
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await teamService.getTeamMembers(teamId);
      const rawList = res?.data?.members || res?.members || [];
      const normalized = (Array.isArray(rawList) ? rawList : []).map((m) => ({
        id: m.id ?? m.user_id,
        user_id: m.user_id ?? m.id,
        name: getUserDisplayName(m),
        email: m.email || '',
        role: m.role || 'member',
      }));

      memberCache.set(cacheKey, normalized);
      setMembers(normalized);
    } catch (err) {
      console.error('Failed to load team members:', err);
      setError(err?.response?.data?.message || err?.message || 'Unable to load team members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialMembers && initialMembers.length > 0) {
      setMembers(initialMembers);
    } else if (teamId) {
      fetchMembers();
    }
  }, [teamId, initialMembers]);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
      // Focus search input on open
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Filtered members for dropdown display:
  // 1. Exclude already excluded IDs (e.g. already invited attendees)
  // 2. Filter by search query (matching name or email)
  const availableMembers = useMemo(() => {
    return members.filter((m) => {
      const idStr = String(m.id);
      // If single select or multi select, only exclude if it's in excludedSet
      if (excludedSet.has(idStr)) return false;
      return true;
    });
  }, [members, excludedSet]);

  const searchedMembers = useMemo(() => {
    if (!searchQuery.trim()) return availableMembers;
    const q = searchQuery.toLowerCase().trim();
    return availableMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q))
    );
  }, [availableMembers, searchQuery]);

  // Map of all members by id for quick chip rendering
  const memberMap = useMemo(() => {
    const map = new Map();
    members.forEach((m) => map.set(String(m.id), m));
    return map;
  }, [members]);

  // Toggle selection for multiple
  const handleToggleMember = (userId) => {
    const strId = String(userId);
    const numId = typeof userId === 'number' ? userId : parseInt(userId, 10);
    const currentList = [...selectedIds];

    let nextList;
    if (currentList.includes(strId)) {
      nextList = currentList.filter((id) => id !== strId);
    } else {
      nextList = [...currentList, strId];
    }

    // Convert back to numbers if original values were numbers
    const finalVal = nextList.map((id) => {
      const n = parseInt(id, 10);
      return isNaN(n) ? id : n;
    });

    onChange(finalVal);
  };

  // Remove individual member from multiple chips
  const handleRemoveMember = (e, userId) => {
    e.stopPropagation();
    const strId = String(userId);
    const nextList = selectedIds
      .filter((id) => id !== strId)
      .map((id) => {
        const n = parseInt(id, 10);
        return isNaN(n) ? id : n;
      });
    onChange(nextList);
  };

  // Select member for single select
  const handleSelectSingle = (userId) => {
    const num = parseInt(userId, 10);
    onChange(isNaN(num) ? userId : num);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Clear single selection
  const handleClearSingle = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const defaultPlaceholder = multiple
    ? 'Select team members...'
    : 'Select teammate...';

  // Get currently selected member object for single select
  const singleSelectedMember =
    !multiple && selectedIds.length > 0 ? memberMap.get(selectedIds[0]) : null;

  return (
    <div ref={containerRef} className={`relative text-left ${className}`}>
      {/* Trigger Area */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full min-h-[42px] px-3 py-2 bg-white border rounded-xl text-xs sm:text-sm transition-all flex items-center justify-between gap-2 cursor-pointer ${
          disabled
            ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
            : isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/10 shadow-xs'
            : 'border-slate-200 hover:border-slate-300 shadow-2xs'
        }`}
      >
        {/* Content area: Chips or Single label or Placeholder */}
        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
          {multiple ? (
            selectedIds.length > 0 ? (
              selectedIds.map((id) => {
                const mem = memberMap.get(id);
                const displayName = mem ? mem.name : `Member #${id}`;
                const initials = getUserInitials(displayName);

                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 pl-1.5 pr-1 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs font-medium max-w-full truncate shadow-2xs animate-in fade-in"
                  >
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      {initials}
                    </span>
                    <span className="truncate max-w-[140px] sm:max-w-[200px]">
                      {displayName}
                    </span>
                    {!disabled && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveMember(e, id)}
                        title={`Remove ${displayName}`}
                        className="p-0.5 rounded-md hover:bg-indigo-200/60 text-indigo-500 hover:text-indigo-800 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })
            ) : (
              <span className="text-slate-400 select-none">
                {placeholder || defaultPlaceholder}
              </span>
            )
          ) : singleSelectedMember ? (
            <div className="flex items-center gap-2 min-w-0 truncate">
              <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {getUserInitials(singleSelectedMember.name)}
              </div>
              <span className="font-medium text-slate-800 truncate">
                {singleSelectedMember.name}
              </span>
              {singleSelectedMember.email && (
                <span className="text-slate-400 text-xs truncate hidden sm:inline">
                  ({singleSelectedMember.email})
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 select-none">
              {placeholder || defaultPlaceholder}
            </span>
          )}
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {!multiple && allowClear && singleSelectedMember && !disabled && (
            <button
              type="button"
              onClick={handleClearSingle}
              title="Clear selection"
              className="p-1 rounded-md hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Input Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teammate by name or email..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Members List Container */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {/* Loading State */}
            {loading && (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="text-xs font-medium">Loading team members...</span>
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="p-3 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-rose-600 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Unable to load team members.</span>
                </div>
                <button
                  type="button"
                  onClick={() => fetchMembers(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Empty States */}
            {!loading && !error && members.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">
                No team members available.
              </div>
            )}

            {!loading && !error && members.length > 0 && availableMembers.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">
                No other team members available.
              </div>
            )}

            {!loading && !error && availableMembers.length > 0 && searchedMembers.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">
                No teammates match "{searchQuery}"
              </div>
            )}

            {/* Unassign option for single-select if allowClear */}
            {!loading && !error && !multiple && allowClear && (
              <button
                type="button"
                onClick={() => handleSelectSingle(null)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                  selectedIds.length === 0
                    ? 'bg-indigo-50/70 text-indigo-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center text-[10px]">
                    ⚪
                  </div>
                  <span>Unassigned</span>
                </div>
                {selectedIds.length === 0 && (
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                )}
              </button>
            )}

            {/* Teammate Items */}
            {!loading &&
              !error &&
              searchedMembers.map((member) => {
                const strId = String(member.id);
                const isSelected = selectedIds.includes(strId);
                const initials = getUserInitials(member.name);

                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      if (multiple) {
                        handleToggleMember(member.id);
                      } else {
                        handleSelectSingle(member.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition-all cursor-pointer group ${
                      isSelected
                        ? 'bg-indigo-50/70 text-indigo-900 font-medium'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {/* Checkbox for multiple */}
                      {multiple && (
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white group-hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      )}

                      {/* Avatar */}
                      <div className="w-6 h-6 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {initials}
                      </div>

                      {/* Name and secondary email */}
                      <div className="min-w-0 truncate">
                        <span className="block truncate font-semibold text-slate-900">
                          {member.name}
                        </span>
                        {member.email && (
                          <span className="block truncate text-[11px] text-slate-400 font-normal">
                            {member.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Single select check indicator */}
                    {!multiple && isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                  </button>
                );
              })}
          </div>

          {/* Footer showing member count */}
          {!loading && !error && members.length > 0 && (
            <div className="px-3 py-1.5 border-t border-slate-100 bg-slate-50/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Current Workspace Members</span>
              <span>{members.length} total</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
