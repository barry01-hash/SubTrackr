// Theme type definitions

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  danger: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  overlay: string;
  onPrimary: string;
  onSecondary: string;
  onSurface: string;
  onSurfaceVariant: string;
  warningBackground: string;
}

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  id: string;
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
}

export interface BrandConfig {
  primary: string;
  secondary: string;
  accent: string;
}
