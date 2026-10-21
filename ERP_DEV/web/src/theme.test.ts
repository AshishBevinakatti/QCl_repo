import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyTheme,
  currentTheme,
  storedTheme,
  THEME_KEY,
  toggleTheme,
} from './theme';

describe('theme preference', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('reads only valid stored preferences', () => {
    expect(storedTheme()).toBeNull();

    localStorage.setItem(THEME_KEY, 'sepia');
    expect(storedTheme()).toBeNull();

    localStorage.setItem(THEME_KEY, 'dark');
    expect(storedTheme()).toBe('dark');
  });

  it('applies and persists a theme', () => {
    applyTheme('dark');

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(currentTheme()).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');

    applyTheme('light');
    expect(currentTheme()).toBe('light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
  });

  it('toggles from the current document theme', () => {
    expect(toggleTheme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    expect(toggleTheme()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
