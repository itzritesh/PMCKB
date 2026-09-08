import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Users,
  Shield,
  Search,
  ExternalLink,
  Crown,
  UserCheck,
  Calendar,
  AlertCircle,
  X,
  Layers,
  Mail,
  Clock,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { useTeam } from '../context/TeamContext';
import { teamService } from '../services/teamService';
import { invitationService } from '../services/invitationService';

export default function TeamsPage() {
  const { teams, currentTeam, setCurrentTeam, refreshTeams, loading } = useTeam();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Pending Invitations state (Phase 6)
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [inviteActionToken, setInviteActionToken] = useState(null);
  const [inviteNotice, setInviteNotice] = useState({ text: '', type: '' });

  const fetchPendingInvitations = useCallback(async () => {
    try {
      setInvitesLoading(true);
      const res = await invitationService.getUserInvitations();
      setPendingInvitations(res.data?.invitations || []);
    } catch (err) {
      console.warn('Could not load user invitations:', err);
    } finally {
      setInvitesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingInvitations();
  }, [fetchPendingInvitations]);

  const handleAcceptInvite = async (token) => {
    try {
      setInviteActionToken(token);
      const res = await invitationService.acceptInvitation(token);
      setInviteNotice({
        text: `Invitation accepted! You joined ${res.data?.teamName || 'the workspace'}.`,
        type: 'success',
      });
      await refreshTeams();
      await fetchPendingInvitations();
      setTimeout(() => setInviteNotice({ text: '', type: '' }), 4000);
    } catch (err) {
      setInviteNotice({
        text: err.response?.data?.message || 'Failed to accept invitation.',
        type: 'error',
      });
    } finally {
      setInviteActionToken(null);
    }
  };

  const handleRejectInvite = async (token) => {
    try {
      setInviteActionToken(token);
      await invitationService.rejectInvitation(token);
      setInviteNotice({
        text: 'Invitation declined.',
        type: 'info',
      });
      await fetchPendingInvitations();
      setTimeout(() => setInviteNotice({ text: '', type: '' }), 4000);
    } catch (err) {
      setInviteNotice({
        text: err.response?.data?.message || 'Failed to decline invitation.',
        type: 'error',
      });
    } finally {
      setInviteActionToken(null);
    }
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const leaderCount = teams.filter((t) => t.user_role === 'leader').length;
  const memberCount = teams.filter((t) => t.user_role === 'member').length;

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setCreateError('');

    if (!createForm.name.trim()) {
      setCreateError('Team name is required.');
      return;
    }

    try {
      setCreateLoading(true);
      const res = await teamService.createTeam(createForm);
      await refreshTeams();
      if (res.data?.team) {
        setCurrentTeam(res.data.team);
      }
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '' });
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create team. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Workspaces & Teams
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage your collaborative teams, assign leader roles, and organize shared workspace deliverables.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Notice Banner */}
      {inviteNotice.text && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            inviteNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : inviteNotice.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {inviteNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{inviteNotice.text}</span>
          </div>
          <button
            onClick={() => setInviteNotice({ text: '', type: '' })}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Member/User UI: Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white border border-indigo-100 rounded-3xl p-6 sm:p-7 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-2xs">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Pending Invitations</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
                    {pendingInvitations.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  You have been invited to collaborate in these workspaces.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{inv.team_name}</h3>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {inv.team_description || 'Collaborative workspace'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Invited by:</span>
                      <span className="font-semibold text-slate-800">
                        {inv.invited_by_name}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({inv.invited_by_email})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>
                        Expires: {new Date(inv.expires_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleAcceptInvite(inv.token)}
                    disabled={inviteActionToken === inv.token}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {inviteActionToken === inv.token ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleRejectInvite(inv.token)}
                    disabled={inviteActionToken === inv.token}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Workspaces
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{teams.length}</span>
            <span className="text-xs text-slate-500">enrolled</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Workspaces Led
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{leaderCount}</span>
            <span className="text-xs text-purple-600 font-medium">Leader privileges</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Member In
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{memberCount}</span>
            <span className="text-xs text-emerald-600 font-medium">Active member</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search teams by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
          />
        </div>

        <span className="text-xs text-slate-500 self-end sm:self-center">
          Showing {filteredTeams.length} of {teams.length} workspaces
        </span>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent"></div>
          <p className="text-xs text-slate-500 mt-2">Loading workspaces...</p>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">
            {searchTerm ? 'No matching workspaces found' : 'No workspaces yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchTerm
              ? 'Try refining your search query to find your desired team.'
              : 'Create your first workspace to collaborate with teammates, organize projects, and assign roles.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Workspace</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => {
            const isActive = currentTeam?.id === team.id;
            const isLeader = team.user_role === 'leader';

            return (
              <div
                key={team.id}
                className={`flex flex-col justify-between bg-white rounded-2xl border transition-all shadow-2xs hover:shadow-md ${
                  isActive
                    ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="p-6 space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        isLeader
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isLeader ? (
                        <Crown className="w-3 h-3 text-purple-600" />
                      ) : (
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>{isLeader ? 'Leader' : 'Member'}</span>
                    </span>

                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Team Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {team.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px]">
                      {team.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Meta Stats */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {team.member_count} {team.member_count === 1 ? 'member' : 'members'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Joined {new Date(team.joined_at || team.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-3">
                  {!isActive ? (
                    <button
                      onClick={() => setCurrentTeam(team)}
                      className="text-xs text-slate-600 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
                    >
                      Set as active
                    </button>
                  ) : (
                    <span className="text-xs text-indigo-600 font-medium">Currently Selected</span>
                  )}

                  <Link
                    to={`/teams/${team.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-2xs"
                  >
                    <span>Manage</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Create New Workspace</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workspace Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering Core, Marketing Team, Design Pod"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="What is the objective or focus area of this workspace?"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>You will automatically become the <strong>Leader</strong> of this workspace.</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {createLoading && <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />}
                  <span>Create Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
