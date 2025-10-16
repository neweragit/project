import React, { createContext, useContext, useEffect, useState } from 'react';
import { authHelpers, UserProfile, Account } from '@/lib/supabase';

interface CustomUser {
  account: Account;
  user: UserProfile;
  timestamp: number;
}

interface AuthContextType {
  user: Account | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: { full_name: string; field_of_interest?: string; role?: 'Administrator' | 'Member' }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session from localStorage
    const getInitialSession = async () => {
      try {
        console.log('AuthProvider: Initializing...');
        const sessionData = await authHelpers.getCurrentUser();
        
        if (sessionData) {
          console.log('AuthProvider: Found existing session', sessionData);
          setUser(sessionData.account);
          setUserProfile(sessionData.user);
        } else {
          console.log('AuthProvider: No existing session found');
        }
      } catch (error) {
        console.error('AuthProvider: Error during initialization:', error);
      } finally {
        setLoading(false);
        console.log('AuthProvider: Initialization complete');
      }
    };

    getInitialSession();
  }, []);

  const loadUserProfile = async (accountId: string) => {
    try {
      const { data, error } = await authHelpers.getUserProfile(accountId);
      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const signUp = async (email: string, password: string, userData: { full_name: string; field_of_interest?: string; role?: 'Administrator' | 'Member' }) => {
    try {
      setLoading(true);
      const { data, error } = await authHelpers.signUp(email, password, userData);
      
      if (error) {
        return { error };
      }

      // Account and user profile created successfully
      return { error: null };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('AuthContext: Starting sign in for:', email);
      const { data, error } = await authHelpers.signIn(email, password);
      
      if (error) {
        console.log('AuthContext: Sign in error:', error);
        return { error };
      }

      // Set user data from successful login
      if (data) {
        console.log('AuthContext: Setting user data, role:', data.user.role);
        setUser(data.account);
        setUserProfile(data.user);
      }

      return { error: null };
    } catch (error) {
      console.error('AuthContext: Sign in exception:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authHelpers.signOut();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: 'No user logged in' };
    }

    try {
      const { data, error } = await authHelpers.updateUserProfile(user.id, updates);
      
      if (error) {
        return { error };
      }

      setUserProfile(data);
      
      // Update localStorage session with new profile data
      const sessionData = localStorage.getItem('auth_session');
      if (sessionData) {
        const parsedSession = JSON.parse(sessionData);
        parsedSession.user = data;
        localStorage.setItem('auth_session', JSON.stringify(parsedSession));
      }
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth called outside AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
