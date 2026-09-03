import React from 'react';
import { User, UserX } from 'lucide-react';

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
        className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer disabled:opacity-50"
      >
        <option value="" className="bg-slate-900 text-slate-400">
          ⚪ Unassigned
        </option>
        {users.map((user) => (
          <option key={user.id} value={user.id} className="bg-slate-900 text-white">
            👤 {user.name} ({user.email})
          </option>
        ))}
      </select>
    </div>
  );
}
