import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
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
    if (isDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    localStorage.setItem('prv_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return { isDark, toggleTheme };
}
