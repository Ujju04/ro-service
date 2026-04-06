import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGetUserProfile, useGetTechnicianProfile } from '@workspace/api-client-react';

type UserRole = 'user' | 'technician' | null;

interface AuthContextType {
  token: string | null;
  role: UserRole;
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('ro_token'));
  const [role, setRole] = useState<UserRole>(localStorage.getItem('ro_role') as UserRole);
  const [, setLocation] = useLocation();

  const isUser = role === 'user';
  const isTech = role === 'technician';

  // Fetch profiles based on role if token exists
  const { data: userProfile, isLoading: userLoading } = useGetUserProfile({
    query: { enabled: !!token && isUser, retry: false }
  });

  const { data: techProfile, isLoading: techLoading } = useGetTechnicianProfile({
    query: { enabled: !!token && isTech, retry: false }
  });

  const isLoading = (isUser && userLoading) || (isTech && techLoading);
  const user = isUser ? userProfile : (isTech ? techProfile : null);

  const login = (newToken: string, newRole: UserRole) => {
    localStorage.setItem('ro_token', newToken);
    localStorage.setItem('ro_role', newRole || '');
    setToken(newToken);
    setRole(newRole);
  };

  const logout = () => {
    localStorage.removeItem('ro_token');
    localStorage.removeItem('ro_role');
    setToken(null);
    setRole(null);
    setLocation('/auth');
  };

  // If token exists but profile fetch fails (e.g. invalid token), logout
  useEffect(() => {
    if (token && !isLoading && !user && ((isUser && !userLoading) || (isTech && !techLoading))) {
       // logout(); // Disabled auto-logout on fail to prevent render loops if backend missing
    }
  }, [token, isLoading, user, isUser, isTech, userLoading, techLoading]);

  return (
    <AuthContext.Provider value={{
      token,
      role,
      user,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
