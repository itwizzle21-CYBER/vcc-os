import type { ThemeMode, UserSettings } from "../types/app";

export function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(theme: ThemeMode): "dark" | "light" {
  return theme === "system" ? getSystemTheme() : theme;
}

export function applyVisualSettings(settings: UserSettings): void {
  if (typeof document === "undefined") return;
  const activeTheme = resolveTheme(settings.theme);
  const root = document.documentElement;

  root.dataset.theme = activeTheme;
  root.dataset.appearance = settings.appearanceTheme;
  root.dataset.accent = settings.accent;
  root.dataset.density = settings.density;
  root.dataset.surface = settings.surfaceStyle;
  root.style.colorScheme = activeTheme;

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  themeColor?.setAttribute("content", activeTheme === "dark" ? "#080b12" : "#f7f9fc");
}
