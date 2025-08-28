import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseAvailable } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(isSupabaseAvailable());

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!isSupabaseAvailable()) {
          console.warn('Supabase not available, running in offline mode');
          setLoading(false);
          setIsOnline(false);
          return;
        }

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setIsOnline(false);
        } else {
          setUser(session?.user ?? null);
          setIsAdmin(session?.user?.email === 'admin@robux.com');
          setIsOnline(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsOnline(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes only if Supabase is available
    if (isSupabaseAvailable()) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user ?? null);
          setIsAdmin(session?.user?.email === 'admin@robux.com');
        });

        return () => {
          if (subscription?.unsubscribe) {
            subscription.unsubscribe();
          }
        };
      } catch (error) {
        console.error('Error setting up auth listener:', error);
      }
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseAvailable()) {
      throw new Error('เซิร์ฟเวอร์ไม่พร้อมใช้งานในขณะนี้');
    }
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!isSupabaseAvailable()) {
      return; // Silently succeed in offline mode
    }
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    isAdmin,
    loading,
    signIn,
    signOut,
    isOnline,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};