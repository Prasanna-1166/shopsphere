import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { useToast } from './ToastContext';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchCurrentAdmin = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data && res.data.user) {
        const u = res.data.user;
        if (u.role === 'ADMIN' || u.role === 'SUPER_ADMIN') {
          setAdminUser(u);
        } else {
          setAdminUser(null);
        }
      } else {
        setAdminUser(null);
      }
    } catch (err) {
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentAdmin();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/admin-login', { email, password });
      setAdminUser(res.data.user);
      showToast(`Welcome, ${res.data.user.name}`, 'success');
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Administrative login failed.';
      showToast(msg, 'error');
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      setAdminUser(null);
      showToast('Signed out of admin console.', 'info');
    } catch (err) {
      setAdminUser(null);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        loading,
        isAuthenticated: Boolean(adminUser),
        isSuperAdmin: adminUser?.role === 'SUPER_ADMIN',
        login,
        logout,
        refreshAdmin: fetchCurrentAdmin,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return context;
};
