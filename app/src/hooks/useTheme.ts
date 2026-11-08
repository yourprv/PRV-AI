import { useState, useEffect, useCallback } from 'react';

const colorSchemeQuery = '(prefers-color-scheme: dark)';
const sessionThemeKey = 'prv_theme_session_override';

function readSystemPreference(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.(colorSchemeQuery).matches === true;
}

function readSessionOverride(): boolean | null {
  try {
    const stored = window.sessionStorage.getItem(sessionThemeKey);
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
  } catch {
    // Fall back to the browser preference when session storage is unavailable.
  }
  return null;
}

export function useTheme(isDarkModeForced = false) {
  const [systemIsDark, setSystemIsDark] = useState(readSystemPreference);
  const [sessionOverride, setSessionOverride] = useState<boolean | null>(readSessionOverride);

  useEffect(() => {
    const mediaQuery = window.matchMedia(colorSchemeQuery);
    const syncWithSystem = (event: MediaQueryListEvent) => {
      setSystemIsDark(event.matches);
      setSessionOverride(null);
      try {
        window.sessionStorage.removeItem(sessionThemeKey);
      } catch {
        // Keep following the system even when session storage is unavailable.
      }
    };

    setSystemIsDark(mediaQuery.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', syncWithSystem);
      return () => mediaQuery.removeEventListener('change', syncWithSystem);
    }

    mediaQuery.addListener(syncWithSystem);
    return () => mediaQuery.removeListener(syncWithSystem);
  }, []);

  const isDark = (sessionOverride ?? systemIsDark) || isDarkModeForced;

  // Apply theme to document
  useEffect(() => {
    const htmlElement = document.documentElement;
    const shouldUseDark = isDark || document.querySelector('[data-theme-force-dark="true"]') !== null;
    if (shouldUseDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
      'content',
      shouldUseDark ? '#1b1a15' : '#faf7ef'
    );
  }, [isDark, systemIsDark]);

  const toggleTheme = useCallback(() => {
    if (isDarkModeForced) return;
    // Manual choices last for this browser session. A system theme change
    // clears the override so the app follows the browser again.
    const next = !isDark;
    setSessionOverride(next);
    try {
      window.sessionStorage.setItem(sessionThemeKey, next ? 'dark' : 'light');
    } catch {
      // The current page still honors the manual choice without storage.
    }
  }, [isDark, isDarkModeForced]);

  return { isDark, toggleTheme };
}
