import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Briefcase,
  ShieldCheck,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { invitationService } from '../services/invitationService';

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { refreshTeams, setCurrentTeam } = useTeam();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await invitationService.getInvitationByToken(token);
        setInvitation(res.data?.invitation);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired invitation token.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvite();
    }
  }, [token]);

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      setError('');
      const res = await invitationService.acceptInvitation(token);
      setActionSuccess('Successfully joined the workspace!');
      await refreshTeams();
      setTimeout(() => {
        navigate(`/teams/${res.data?.teamId || ''}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      setError('');
      await invitationService.rejectInvitation(token);
      setActionSuccess('Invitation declined.');
      setTimeout(() => {
        navigate('/teams');
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to decline invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Validating workspace invitation...</p>
        </div>
      </div>
    );
  }

  const isExpired =
    invitation?.status === 'expired' ||
    invitation?.isExpired ||
    (invitation?.expires_at && new Date(invitation.expires_at) <= new Date());
  const isAccepted = invitation?.status === 'accepted';
  const isRejected = invitation?.status === 'rejected';
  const emailMismatch =
    isAuthenticated &&
    user?.email &&
    invitation?.email &&
    user.email.toLowerCase() !== invitation.email.toLowerCase();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xs space-y-6">
        {/* Header Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
            <Mail className="w-8 h-8" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Workspace Invitation
          </h1>
          <p className="text-xs text-slate-500">
            You have been invited to collaborate on PMCKB
          </p>
        </div>

        {/* Status / Feedback alerts */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Invitation Card Info */}
        {invitation && (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-slate-900 truncate">
                  {invitation.team_name}
                </h2>
                <p className="text-xs text-slate-500 truncate">
                  {invitation.team_description || 'Workspace collaboration'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Invited by:</span>
                <span className="font-medium text-slate-800">
                  {invitation.invited_by_name} ({invitation.invited_by_email})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Email:</span>
                <span className="font-mono text-[11px] font-medium text-slate-700">
                  {invitation.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Expires:</span>
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(invitation.expires_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* State 1: Expired / Already accepted / Already rejected */}
        {isExpired && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-3">
            <Clock className="w-6 h-6 text-amber-600 mx-auto" />
            <div>
              <p className="text-xs font-bold text-amber-900">This invitation has expired</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Please contact the workspace leader to request a fresh invitation link.
              </p>
            </div>
            <Link
              to="/teams"
              className="inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Go to Workspaces
            </Link>
          </div>
        )}

        {isAccepted && !actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
            <div>
              <p className="text-xs font-bold text-emerald-900">Invitation already accepted</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                You are already enrolled as a member of this workspace.
              </p>
            </div>
            <Link
              to={`/teams/${invitation.team_id}`}
              className="inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Open Workspace
            </Link>
          </div>
        )}

        {isRejected && (
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-center space-y-2">
            <XCircle className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">This invitation was declined</p>
            <Link
              to="/teams"
              className="inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Go to Workspaces
            </Link>
          </div>
        )}

        {/* State 2: Not authenticated */}
        {!isAuthenticated && !isExpired && !isAccepted && !isRejected && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-center text-slate-500">
              Please sign in or create an account with{' '}
              <span className="font-semibold text-slate-800">{invitation?.email}</span> to accept.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to={`/login?redirect=/invite/${token}`}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to={`/register?redirect=/invite/${token}`}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-colors"
              >
                <span>Create Account</span>
              </Link>
            </div>
          </div>
        )}

        {/* State 3: Email mismatch */}
        {emailMismatch && !isExpired && !isAccepted && !isRejected && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
            <div className="flex items-center gap-2 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Email Mismatch</span>
            </div>
            <p className="text-[11px] text-rose-700">
              You are signed in as <span className="font-semibold">{user?.email}</span>, but this
              invitation was issued for{' '}
              <span className="font-semibold">{invitation?.email}</span>. Please sign in with the
              matching email.
            </p>
          </div>
        )}

        {/* State 4: Logged in with matching email -> Accept / Reject buttons */}
        {isAuthenticated && !emailMismatch && !isExpired && !isAccepted && !isRejected && (
          <div className="space-y-3 pt-2">
            <button
              onClick={handleAccept}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Invitation & Join Team</span>
                </>
              )}
            </button>

            <button
              onClick={handleReject}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 border border-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>Decline Invitation</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
