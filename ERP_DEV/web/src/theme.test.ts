import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyTheme,
  currentTheme,
  initialTheme,
  storedTheme,
  THEME_KEY,
  toggleTheme,
} from './theme';

/** jsdom has no real matchMedia, so the device preference is stubbed. */
function stubPrefersDark(dark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

describe('theme preference', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('falls back to the device preference until the user chooses', () => {
    stubPrefersDark(true);
    expect(initialTheme()).toBe('dark');

    stubPrefersDark(false);
    expect(initialTheme()).toBe('light');
  });

  it('prefers an explicit choice over the device preference', () => {
    stubPrefersDark(true);
    localStorage.setItem(THEME_KEY, 'light');
    expect(initialTheme()).toBe('light');
  });

  it('toggles from the current document theme', () => {
    expect(toggleTheme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    expect(toggleTheme()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
