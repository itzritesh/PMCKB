import React from 'react';

export default function AssigneeSelector({
  users = [],
  value = null,
  onChange,
  disabled = false,
  className = '',
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value === null || value === undefined ? '' : value}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? null : parseInt(val, 10));
        }}
        disabled={disabled}
        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer disabled:opacity-50"
      >
        <option value="" className="text-slate-500">
          ⚪ Unassigned
        </option>
        {users.map((user) => (
          <option key={user.id} value={user.id} className="text-slate-900">
            👤 {user.name} ({user.email})
          </option>
        ))}
      </select>
    </div>
  );
}
