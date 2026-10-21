export type Theme = 'light' | 'dark';

export const THEME_KEY = 'gh-theme';

export function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage can be unavailable in private/embedded contexts */
  }
}

export function toggleTheme(): Theme {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
