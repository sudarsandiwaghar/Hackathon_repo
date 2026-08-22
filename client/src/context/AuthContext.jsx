import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('dayflow_token');
      const storedUser = localStorage.getItem('dayflow_user');

      if (token && storedUser) {
        try {
          // Verify token is still valid by calling /me
          const response = await api.get('/auth/me');
          setUser(response.data.data.user);
          setEmployee(response.data.data.employee);
        } catch (err) {
          // Token invalid — clear everything
          localStorage.removeItem('dayflow_token');
          localStorage.removeItem('dayflow_user');
          setUser(null);
          setEmployee(null);
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const signin = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/auth/signin', { email, password });
      const { token, user: userData, employee: empData } = response.data.data;

      localStorage.setItem('dayflow_token', token);
      localStorage.setItem('dayflow_user', JSON.stringify(userData));

      setUser(userData);
      setEmployee(empData);

      return { success: true, user: userData };
    } catch (err) {
      const message =
        err.response?.data?.message || 'Sign in failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  }, []);

  const signup = useCallback(async (formData) => {
    setError(null);
    try {
      const response = await api.post('/auth/signup', formData);
      const { token, user: userData, employee: empData, verificationUrl } =
        response.data.data;

      localStorage.setItem('dayflow_token', token);
      localStorage.setItem('dayflow_user', JSON.stringify(userData));

      setUser(userData);
      setEmployee(empData);

      return { success: true, user: userData, verificationUrl };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        'Sign up failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  }, []);

  const signout = useCallback(() => {
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_user');
    setUser(null);
    setEmployee(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    employee,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    signin,
    signup,
    signout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
