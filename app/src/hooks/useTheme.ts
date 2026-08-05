import { useState, useEffect, useCallback } from 'react';

export function useTheme(isDarkModeForced = false) {
  const [isDark, setIsDark] = useState(() => {
    // Check if dark mode preference is stored
    const stored = localStorage.getItem('prv_theme');
    if (stored) {
      return stored === 'dark';
    }
    // Default to light mode
    return false;
  });

  // Apply theme to document
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDark || isDarkModeForced) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    localStorage.setItem('prv_theme', isDark ? 'dark' : 'light');
  }, [isDark, isDarkModeForced]);

  const toggleTheme = useCallback(() => {
    if (isDarkModeForced) return;
    setIsDark((prev) => !prev);
  }, [isDarkModeForced]);

  return { isDark, toggleTheme };
}
