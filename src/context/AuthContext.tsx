import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios.ts';
import { User, Employee } from '../types.ts';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ user: User; employee: Employee }>;
  signup: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
    designation?: string;
    phone?: string;
  }) => Promise<{ user: User; employee: Employee; verificationUrl?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateEmployeeProfile: (updates: Partial<Employee>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('dayflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('dayflow_token');
    if (!savedToken) {
      setUser(null);
      setEmployee(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      setEmployee(res.data.employee);
    } catch (err) {
      console.error('Failed to restore authentication session:', err);
      localStorage.removeItem('dayflow_token');
      setUser(null);
      setEmployee(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/signin', { email, password });
      const { token: receivedToken, user: loggedUser, employee: empProfile } = res.data;
      localStorage.setItem('dayflow_token', receivedToken);
      setToken(receivedToken);
      setUser(loggedUser);
      setEmployee(empProfile);
      return { user: loggedUser, employee: empProfile };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    department?: string;
    designation?: string;
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/signup', payload);
      const { token: receivedToken, user: newUser, employee: newEmp, verificationUrl } = res.data;
      localStorage.setItem('dayflow_token', receivedToken);
      setToken(receivedToken);
      setUser(newUser);
      setEmployee(newEmp);
      return { user: newUser, employee: newEmp, verificationUrl };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('dayflow_token');
    setToken(null);
    setUser(null);
    setEmployee(null);
  };

  const updateEmployeeProfile = async (updates: Partial<Employee>) => {
    const res = await api.put('/employees/me', updates);
    if (res.data.employee) {
      setEmployee(res.data.employee);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
        updateEmployeeProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
