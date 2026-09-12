import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  // Initialize and verify stored token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const profileRes = await authService.getProfile();
        setUser(profileRes.data.user);
        setToken(storedToken);
      } catch (err) {
        console.warn('Stored session invalid or expired, resetting auth.');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Handle user login
   */
  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { user: authUser, token: authToken } = res.data;

    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(authUser);
    return res;
  };

  /**
   * Handle user registration
   */
  const register = async (name, email, password) => {
    const res = await authService.register({ name, email, password });
    const { user: authUser, token: authToken } = res.data;

    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(authUser);
    return res;
  };

  /**
   * Handle user logout
   */
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
