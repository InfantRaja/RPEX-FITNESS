import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, userApi } from '../lib/api';
import type { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  handleOAuthCallback: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'repx_token';
const USER_KEY = 'repx_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem(TOKEN_KEY),
    isLoading: true,
    isAuthenticated: false,
  });

  const setAuth = useCallback((user: User | null, token: string | null) => {
    if (user && token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setState({ user, token, isLoading: false, isAuthenticated: true });
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  // Initialize auth from stored token
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const cachedUser = localStorage.getItem(USER_KEY);

      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Use cached user immediately for fast UI
      if (cachedUser) {
        try {
          const user = JSON.parse(cachedUser);
          setState({ user, token, isLoading: false, isAuthenticated: true });
        } catch {}
      }

      // Validate token with server
      try {
        const response = await authApi.me();
        const user = response.data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setState({ user, token, isLoading: false, isAuthenticated: true });
      } catch {
        setAuth(null, null);
      }
    };

    initAuth();
  }, [setAuth]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { user, token } = response.data;
    setAuth(user, token);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authApi.register({ name, email, password });
    const { user, token } = response.data;
    setAuth(user, token);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    setAuth(null, null);
  };

  const refreshUser = async () => {
    try {
      const response = await userApi.getProfile();
      const user = response.data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      setState(prev => ({ ...prev, user }));
    } catch {}
  };

  const updateUser = (updates: Partial<User>) => {
    setState(prev => {
      if (!prev.user) return prev;
      const updated = { ...prev.user, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      return { ...prev, user: updated };
    });
  };

  const handleOAuthCallback = async (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    const response = await authApi.me();
    const user = response.data.user;
    setAuth(user, token);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser, updateUser, handleOAuthCallback }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
