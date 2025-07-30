'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface IUser {
  _id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  signedIn: boolean;
  userInfo: IUser | null;
  setSignedIn: (value: boolean) => void;
  setUser: (user: IUser | null) => void;
  checkSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [userInfo, setUser] = useState<IUser | null>(null);

  const checkSession = async () => {
    if (signedIn) return;

    try {
      const res = await fetch('/api/auth-session');
      if (res.ok) {
        const data: IUser = await res.json();
        setSignedIn(true);
        setUser(data);
      } else {
        setSignedIn(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setSignedIn(false);
      setUser(null);
    }
  };

  const refreshSession = async () => {
    try {
      const res = await fetch('/api/auth-session');
      if (res.ok) {
        const data: IUser = await res.json();
        setSignedIn(true);
        setUser(data);
      } else {
        setSignedIn(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      setSignedIn(false);
      setUser(null);
    }
  };

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <AuthContext.Provider value={{ signedIn, userInfo, setSignedIn, setUser, checkSession, refreshSession }}>
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