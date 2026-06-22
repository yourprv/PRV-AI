import { useCallback, useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/chat';

function mapUser(supabaseUser: SupabaseUser | null): User | null {
  if (!supabaseUser || !supabaseUser.email) return null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name:
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      supabaseUser.email.split('@')[0],
    avatar: supabaseUser.user_metadata?.avatar_url || undefined,
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setUser(mapUser(data.session?.user ?? null));
      setIsInitializing(false);
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setUser(mapUser(session?.user ?? null));
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getInitials = useCallback((name: string) => {
    return name.charAt(0).toUpperCase();
  }, []);

  return {
    user,
    isLoading,
    isAuthReady: !isInitializing,
    isAuthenticated: !!user,
    loginWithGoogle,
    loginWithEmail,
    logout,
    getInitials,
  };
}
