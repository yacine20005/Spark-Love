import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { space } from './theme';
import { makeStyles } from './ThemeProvider';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: Edge[];
  footer?: ReactNode;
};

/** Page shell: safe area, cream background, max width on large screens. */
export function Screen({ children, scroll = true, refreshing, onRefresh, edges = ['top'], footer }: Props) {
  const styles = useStyles();
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { flex: 1 }]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={styles.root}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.column}>
          {content}
          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.background },
  column: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  content: { padding: space.lg - 4, gap: space.md, paddingBottom: space.xl },
  footer: { paddingHorizontal: space.lg - 4, paddingVertical: space.md, gap: space.sm },
}));
