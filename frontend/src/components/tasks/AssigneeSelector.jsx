import React from 'react';
import TeamMemberSelect from '../common/TeamMemberSelect';

/**
 * AssigneeSelector Adapter
 * Delegates to TeamMemberSelect for unified team-scoped member selection.
 */
export default function AssigneeSelector({
  teamId,
  users = [],
  value = null,
  onChange,
  multiple = false,
  disabled = false,
  className = '',
  placeholder,
}) {
  return (
    <TeamMemberSelect
      teamId={teamId}
      initialMembers={users && users.length > 0 ? users : null}
      value={value}
      onChange={onChange}
      multiple={multiple}
      disabled={disabled}
      className={className}
      placeholder={placeholder}
    />
  );
}
