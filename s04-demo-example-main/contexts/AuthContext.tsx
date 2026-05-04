'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { getUserByEmail, verifyPassword, seedIfEmpty } from '@/lib/db';

const SESSION_KEY = 'petdaycare_session';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedIfEmpty().then(() => {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        try {
          setUser(JSON.parse(raw) as User);
        } catch {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }
      setLoading(false);
    });
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const found = getUserByEmail(email);
    if (!found) throw new Error('Invalid email or password.');
    const valid = await verifyPassword(found, password);
    if (!valid) throw new Error('Invalid email or password.');
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(found));
    setUser(found);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
