import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold } from '@expo-google-fonts/barlow';
import { BarlowCondensed_600SemiBold, BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from './src/context/session';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Loading, palettes, ThemeProvider, useTheme } from './src/ui';

const DESKTOP_BREAKPOINT = 520;
const APP_SHELL_MAX_WIDTH = 480;

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
  });

  const ready = fontsLoaded || Boolean(fontError);

  return (
    <ThemeProvider>
      <WebAppShell>
        <SafeAreaProvider>
          <ThemedStatusBar />
          {ready ? (
            <SessionProvider>
              <RootNavigator />
            </SessionProvider>
          ) : (
            <Loading />
          )}
        </SafeAreaProvider>
      </WebAppShell>
    </ThemeProvider>
  );
}

/** Keeps mobile web full-bleed while framing desktop viewports in a clean portrait shell. */
function WebAppShell({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const framed = width > DESKTOP_BREAKPOINT;

  return (
    <View style={[styles.webBackdrop, { backgroundColor: framed ? colors.surfaceMuted : colors.background }]}>
      <View
        style={[
          styles.webFrame,
          { backgroundColor: colors.background },
          framed && {
            maxWidth: APP_SHELL_MAX_WIDTH,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: colors.border,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function ThemedStatusBar() {
  const { scheme, colors, preference } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.style.backgroundColor = colors.background;
    document.body.style.backgroundColor = colors.background;
    document.documentElement.style.colorScheme = scheme;

    const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    if (preference === 'system') {
      metas.forEach((meta) => {
        const defaultScheme = meta.getAttribute('data-scheme');
        if (defaultScheme === 'dark') meta.setAttribute('content', palettes.dark.background);
        else if (defaultScheme === 'light') meta.setAttribute('content', palettes.light.background);
        else meta.setAttribute('content', colors.background);
      });
    } else {
      metas.forEach((meta) => meta.setAttribute('content', colors.background));
    }
  }, [scheme, colors.background, preference]);

  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  webFrame: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
});
