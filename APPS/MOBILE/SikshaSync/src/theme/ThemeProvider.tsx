import React, { useState, useMemo, createContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

export const QUBES_COLORS = {
  dark: {
    background: '#0A0A0A',
    surface: '#1A1A1A',
    surfaceVariant: '#2A2A2A',
    text: '#FFFFFF',
    textSecondary: '#888888',
    primary: '#00FFCC',
    error: '#FF6B6B',
    success: '#51CF66',
  },
  light: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F0F0',
    text: '#000000',
    textSecondary: '#666666',
    primary: '#00CCAA',
    error: '#D63031',
    success: '#27AE60',
  },
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: typeof QUBES_COLORS.dark;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    systemColorScheme === 'dark'
  );

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const colors = isDarkMode ? QUBES_COLORS.dark : QUBES_COLORS.light;
  const paperTheme = useMemo(
    () => ({
      ...(isDarkMode ? MD3DarkTheme : MD3LightTheme),
      colors: {
        ...(isDarkMode ? MD3DarkTheme.colors : MD3LightTheme.colors),
        primary: colors.primary,
        background: colors.background,
        surface: colors.surface,
        surfaceVariant: colors.surfaceVariant,
        onSurfaceVariant: colors.textSecondary,
        onSurface: colors.text,
        error: colors.error,
      },
    }),
    [colors, isDarkMode]
  );

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      <PaperProvider theme={paperTheme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return context;
};
