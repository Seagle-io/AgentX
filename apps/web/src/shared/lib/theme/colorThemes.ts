export const COLOR_THEMES = ["main"] as const
export type ColorTheme = (typeof COLOR_THEMES)[number]
export const THEME_MODES = ["light", "dark", "system"] as const
export type ThemeMode = (typeof THEME_MODES)[number]
export const DEFAULT_COLOR_THEME: ColorTheme = "main"
export const DEFAULT_THEME_MODE: ThemeMode = "dark"
