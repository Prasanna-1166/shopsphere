import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.token) {
        localStorage.setItem('shopsphere_customer_token', res.data.token);
      }
      setUser(res.data.user);
      showToast('Welcome back to ShopSphere!', 'success');
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data.token) {
        localStorage.setItem('shopsphere_customer_token', res.data.token);
      }
      setUser(res.data.user);
      showToast('Account created successfully! Welcome to ShopSphere.', 'success');
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore network error on logout
    } finally {
      localStorage.removeItem('shopsphere_customer_token');
      setUser(null);
      showToast('You have been logged out.', 'info');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
