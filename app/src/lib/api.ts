const DEFAULT_API_BASE_URL = 'http://localhost:5000';
const AUTH_SESSION_STORAGE_KEY = 'prv_auth_session';

export interface StoredAuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export function getApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  return (configured || DEFAULT_API_BASE_URL).replace(/\/$/, '');
}

export function getStoredAuthSession(): StoredAuthSession | null {
  const session = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!session) {
    return null;
  }

  try {
    return JSON.parse(session) as StoredAuthSession;
  } catch {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
  }
}

export function setStoredAuthSession(session: StoredAuthSession | null): void {
  if (session) {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  }
}

export function getStoredAuthToken(): string | null {
  return getStoredAuthSession()?.accessToken ?? null;
}

export function setStoredAuthToken(token: string | null): void {
  if (token) {
    const existingSession = getStoredAuthSession();
    setStoredAuthSession({
      accessToken: token,
      refreshToken: existingSession?.refreshToken,
      expiresAt: existingSession?.expiresAt,
    });
  } else {
    setStoredAuthSession(null);
  }
}

export async function refreshAuthSession(): Promise<StoredAuthSession | null> {
  const session = getStoredAuthSession();
  if (!session?.refreshToken) {
    return null;
  }

  const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json() as { accessToken: string; refreshToken?: string; expiresIn?: number };
  const refreshedSession: StoredAuthSession = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? session.refreshToken,
    expiresAt: typeof data.expiresIn === 'number' ? Date.now() + data.expiresIn * 1000 - 10000 : undefined,
  };

  setStoredAuthSession(refreshedSession);
  return refreshedSession;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    signal,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiRequestText(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<string> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    signal,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return response.text();
}

export async function getAuthSession(signal?: AbortSignal): Promise<{ user: { id: string; email: string; name?: string } | null }> {
  let session = getStoredAuthSession();
  if (!session?.accessToken) {
    return { user: null };
  }

  const now = Date.now();
  if (session.expiresAt && now >= session.expiresAt) {
    const refreshed = await refreshAuthSession();
    if (!refreshed) {
      setStoredAuthSession(null);
      return { user: null };
    }
    session = refreshed;
  }

  const response = await fetch(`${getApiBaseUrl()}/api/auth/session`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    if (response.status === 401 && session.refreshToken) {
      const refreshed = await refreshAuthSession();
      if (refreshed) {
        const retryResponse = await fetch(`${getApiBaseUrl()}/api/auth/session`, {
          headers: {
            Authorization: `Bearer ${refreshed.accessToken}`,
            'Content-Type': 'application/json',
          },
          signal,
        });

        if (retryResponse.ok) {
          const retryData = await retryResponse.json() as { user?: { id: string; email: string; name?: string } | null };
          return { user: retryData.user ?? null };
        }
      }
      setStoredAuthSession(null);
      return { user: null };
    }

    if (response.status === 401) {
      setStoredAuthSession(null);
      return { user: null };
    }

    const detail = await response.text();
    throw new Error(detail || 'Failed to load auth session');
  }

  const data = await response.json() as { user?: { id: string; email: string; name?: string } | null };
  return { user: data.user ?? null };
}

export async function signInWithOAuthBackend(redirectTo: string): Promise<{ url: string }> {
  return apiRequest<{ url: string }>('/api/auth/sign-in/oauth', {
    method: 'POST',
    body: JSON.stringify({ provider: 'google', redirectTo }),
  });
}

export async function signInWithOtpBackend(email: string, redirectTo: string): Promise<void> {
  await apiRequest('/api/auth/sign-in/otp', {
    method: 'POST',
    body: JSON.stringify({ email, redirectTo }),
  });
}

export async function signOutBackend(): Promise<void> {
  await apiRequest('/api/auth/logout', {
    method: 'POST',
  });
}
