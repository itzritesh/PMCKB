import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { teamService } from '../services/teamService';

const TeamContext = createContext(null);

export const TeamProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [currentTeam, setCurrentTeamState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Switch current team and persist in localStorage
  const setCurrentTeam = useCallback((team) => {
    if (!team) {
      setCurrentTeamState(null);
      localStorage.removeItem('current_team_id');
      return;
    }
    setCurrentTeamState(team);
    localStorage.setItem('current_team_id', String(team.id));
  }, []);

  // Fetch teams from backend
  const refreshTeams = useCallback(async () => {
    if (!isAuthenticated) {
      setTeams([]);
      setCurrentTeamState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await teamService.getTeams();
      const userTeams = res.data?.teams || [];
      setTeams(userTeams);

      const savedTeamId = localStorage.getItem('current_team_id');
      if (savedTeamId && userTeams.some((t) => String(t.id) === savedTeamId)) {
        const found = userTeams.find((t) => String(t.id) === savedTeamId);
        setCurrentTeamState(found);
      } else if (userTeams.length > 0) {
        setCurrentTeamState(userTeams[0]);
        localStorage.setItem('current_team_id', String(userTeams[0].id));
      } else {
        setCurrentTeamState(null);
        localStorage.removeItem('current_team_id');
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshTeams();
  }, [refreshTeams, user]);

  const isLeader = currentTeam?.user_role === 'leader';

  const value = {
    teams,
    currentTeam,
    setCurrentTeam,
    loading,
    refreshTeams,
    isLeader,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
};

export default TeamContext;
