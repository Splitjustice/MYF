import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, attachToken } from '../api/client';
import { clearToken, getToken, saveToken } from '../services/authStorage';
import { UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = async () => {
    try {
      const token = await getToken();
      attachToken(token);
      if (token) {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      }
    } catch {
      await clearToken();
      attachToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrate();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    await saveToken(response.data.token);
    attachToken(response.data.token);
    setUser(response.data.user);
  };

  const signUp = async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    await saveToken(response.data.token);
    attachToken(response.data.token);
    setUser(response.data.user);
  };

  const signOut = async () => {
    await clearToken();
    attachToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
