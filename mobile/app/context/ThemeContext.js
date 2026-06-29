import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, lightTheme } from '../constants/themes';

const THEME_KEY = 'biogen_theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // 'dark' | 'light' | 'system'
  const [theme, setThemeState] = useState('dark');
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || 'dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved) setThemeState(saved);
    });
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme || 'dark');
    });
    return () => sub.remove();
  }, []);

  const setTheme = useCallback(async (value) => {
    setThemeState(value);
    await AsyncStorage.setItem(THEME_KEY, value);
  }, []);

  const resolved = theme === 'system' ? systemScheme : theme;
  const colors = resolved === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors, isDark: resolved === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
