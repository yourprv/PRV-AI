import { useCallback, useEffect, useState } from 'react';
import type { User } from '@/types/chat';
import { getAuthSession, signInWithOAuthBackend, signInWithOtpBackend, signOutBackend, setStoredAuthToken } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const session = await getAuthSession();
        if (!mounted) return;
        setUser(session.user ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
        } : null);
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { url } = await signInWithOAuthBackend(redirectTo);
      window.location.assign(url);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      await signInWithOtpBackend(email, redirectTo);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOutBackend();
      setStoredAuthToken(null);
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
