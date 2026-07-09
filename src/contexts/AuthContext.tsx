import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';

interface User {
  id: string;
  email: string | null;
  role: 'donor' | 'hospital' | 'admin' | null;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) fetchUserProfile(data.session.user.id);
      else setLoading(false);
    });

    // Listen to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchUserProfile(session.user.id);
      else setUser(null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId: string) {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, email, role, name')
      .eq('id', userId)
      .single();

    if (data) {
      setUser({
        id: data.id,
        email: data.email,
        role: data.role,
        name: data.name,
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
