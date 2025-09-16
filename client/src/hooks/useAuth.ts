import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, createContext, useContext } from 'react';
import type { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthQuery() {
  const queryClient = useQueryClient();
  
  const {
    data: user,
    isLoading,
    error,
    refetch: refetchUser
  } = useQuery<User | null>({
    queryKey: ['/api/auth/user'],
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isAuthenticated = !!user && !error;

  const login = () => {
    window.location.href = '/api/login';
  };

  const logout = () => {
    queryClient.clear();
    window.location.href = '/api/logout';
  };

  return {
    user: user || null,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refetchUser,
  };
}

export { AuthContext };
export type { AuthContextType };