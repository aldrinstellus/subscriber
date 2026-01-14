import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { userApi } from '../services/api';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  currency: string;
  timezone: string;
  onboardingCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await userApi.getMe();
      if (response.data?.data) {
        setProfile(response.data.data);
      }
    } catch {
      // Profile fetch failed - user may not exist yet
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchProfile();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchProfile();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, signIn, signUp, signOut, signInWithGoogle, refreshProfile: fetchProfile }}>
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

// Compatibility hooks for components expecting Clerk-like API
export function useUser() {
  const { user, loading, profile } = useAuth();
  return {
    user: user ? {
      id: user.id,
      fullName: profile?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
      firstName: (profile?.name || user.user_metadata?.full_name)?.split(' ')[0] || user.email?.split('@')[0],
      primaryEmailAddress: { emailAddress: user.email },
      imageUrl: profile?.avatar || user.user_metadata?.avatar_url,
    } : null,
    isLoaded: !loading,
    isSignedIn: !!user,
  };
}

export function useClerk() {
  const { signOut } = useAuth();
  return {
    signOut,
    openUserProfile: () => {
      // Supabase doesn't have a built-in profile UI
      // Could navigate to a settings page instead
    },
  };
}
