import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { makeType, palettes, stripeOf, type Palette, type Scheme } from './theme';

export type ThemePreference = 'system' | Scheme;

const STORAGE_KEY = 'spark-love.theme';

const build = (scheme: Scheme) => {
  const colors = palettes[scheme];
  return { scheme, colors, type: makeType(colors), stripe: stripeOf(colors) };
};
const themes = { light: build('light'), dark: build('dark') };

type Theme = (typeof themes)[Scheme] & {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<Theme>({ ...themes.light, preference: 'system', setPreference: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPref] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => (v === 'light' || v === 'dark') && setPref(v))
      .catch(() => {});
  }, []);

  const value = useMemo<Theme>(() => {
    const scheme: Scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
    return {
      ...themes[scheme],
      preference,
      setPreference: (p) => {
        setPref(p);
        (p === 'system' ? AsyncStorage.removeItem(STORAGE_KEY) : AsyncStorage.setItem(STORAGE_KEY, p)).catch(() => {});
      },
    };
  }, [preference, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

type Styles = Parameters<typeof StyleSheet.create>[0];

/** StyleSheet bound to the active palette; built once per scheme. */
export function makeStyles<S extends Styles>(factory: (colors: Palette) => S & Styles) {
  const cache = new Map<Palette, Readonly<S>>();
  return function useStyles(): Readonly<S> {
    const { colors } = useTheme();
    let styles = cache.get(colors);
    if (!styles) {
      styles = StyleSheet.create(factory(colors));
      cache.set(colors, styles);
    }
    return styles;
  };
}
