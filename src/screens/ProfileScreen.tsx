import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, OPACITY } from '../constants';
import { usePartnerLinking } from '../hooks/usePartnerLinking';
import { PartnerLinkingModal } from '../components/profile/PartnerLinkingModal';
import { PartnerCard } from '../components/profile/PartnerCard';
import { UserCard } from '../components/profile/UserCard';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { modalVisible, setModalVisible, openModal } = usePartnerLinking();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.backgroundGradient} />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.lg }]}>
        <GlassCard style={styles.headerCard} opacity={OPACITY.glass}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account and preferences 👤</Text>
        </GlassCard>

        <PartnerCard onLinkPartner={openModal} />

        <UserCard />
      </ScrollView>

      <PartnerLinkingModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  headerCard: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  title: {
    ...FONTS.largeTitle,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  subtitle: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
});

