import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const THEME_STORAGE_KEY = 'aicrypto_admin_theme';

export type ThemeMode = 'light' | 'dark';

export type ThemePalette = {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  card: string;
  cardForeground: string;
  success: string;
  warning: string;
  danger: string;
};

export interface ThemeState {
  mode: ThemeMode;
  palette: ThemePalette;
  paletteName: keyof typeof PRESET_PALETTES | 'custom';
}

const PRESET_PALETTES = {
  ocean: {
    primary: '#0EA5E9',
    primaryForeground: '#F0F9FF',
    accent: '#6366F1',
    accentForeground: '#EEF2FF',
    background: '#0F172A',
    foreground: '#F8FAFC',
    muted: '#1E293B',
    mutedForeground: '#CBD5F5',
    border: '#1E3A8A',
    card: '#111C35',
    cardForeground: '#E2E8F0',
    success: '#22C55E',
    warning: '#FACC15',
    danger: '#F87171',
  },
  sunset: {
    primary: '#FB923C',
    primaryForeground: '#431407',
    accent: '#F43F5E',
    accentForeground: '#FFF1F2',
    background: '#0A0A0A',
    foreground: '#F5F5F5',
    muted: '#1C1917',
    mutedForeground: '#FED7AA',
    border: '#78350F',
    card: '#111827',
    cardForeground: '#FDE68A',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
  },
  emerald: {
    primary: '#10B981',
    primaryForeground: '#ECFDF5',
    accent: '#14B8A6',
    accentForeground: '#CCFBF1',
    background: '#021B17',
    foreground: '#ECFDF5',
    muted: '#06261F',
    mutedForeground: '#A7F3D0',
    border: '#064E3B',
    card: '#062925',
    cardForeground: '#D1FAE5',
    success: '#34D399',
    warning: '#F97316',
    danger: '#DC2626',
  },
} satisfies Record<string, ThemePalette>;

const defaultTheme: ThemeState = {
  mode: 'dark',
  palette: PRESET_PALETTES.ocean,
  paletteName: 'ocean',
};

const loadTheme = (): ThemeState => {
  if (typeof window === 'undefined') return defaultTheme;
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (!stored) return defaultTheme;
    const parsed = JSON.parse(stored) as ThemeState;
    const presetPalette =
      parsed.paletteName !== 'custom'
        ? PRESET_PALETTES[parsed.paletteName]
        : undefined;
    return {
      ...defaultTheme,
      ...parsed,
      palette: parsed.palette || presetPalette || defaultTheme.palette,
    };
  } catch (error) {
    console.warn('Failed to parse theme from storage', error);
    return defaultTheme;
  }
};

const persistTheme = (state: ThemeState) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    THEME_STORAGE_KEY,
    JSON.stringify({
      mode: state.mode,
      paletteName: state.paletteName,
      palette: state.palette,
    })
  );
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: defaultTheme,
  reducers: {
    hydrateTheme() {
      return loadTheme();
    },
    setMode(state, action: PayloadAction<ThemeMode>) {
      state.mode = action.payload;
      persistTheme(state);
    },
    setPalette(state, action: PayloadAction<keyof typeof PRESET_PALETTES>) {
      state.paletteName = action.payload;
      state.palette = PRESET_PALETTES[action.payload];
      persistTheme(state);
    },
    updatePaletteColor(
      state,
      action: PayloadAction<{ key: keyof ThemePalette; value: string }>
    ) {
      state.palette = { ...state.palette, [action.payload.key]: action.payload.value };
      state.paletteName = 'custom';
      persistTheme(state);
    },
    setCustomPalette(state, action: PayloadAction<ThemePalette>) {
      state.palette = action.payload;
      state.paletteName = 'custom';
      persistTheme(state);
    },
  },
});

export const { hydrateTheme, setMode, setPalette, updatePaletteColor, setCustomPalette } =
  themeSlice.actions;
export const THEME_PRESETS = PRESET_PALETTES;
export default themeSlice.reducer;


