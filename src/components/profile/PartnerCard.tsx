
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { GlassCard } from '../GlassCard';
import { GradientButton } from '../GradientButton';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, OPACITY } from '../../constants';

interface PartnerCardProps {
  onLinkPartner: () => void;
}

export const PartnerCard: React.FC<PartnerCardProps> = ({ onLinkPartner }) => {
  const { couples, activeCouple, setActiveCouple, loadingCouples } = useAuth();

  return (
    <GlassCard style={styles.featureCard} opacity={OPACITY.glass}>
      <Text style={styles.featureTitle}>
        {couples.length > 0 ? 'Your Partners' : 'Partner Linking'}
      </Text>
      <Text style={styles.featureDescription}>
        {couples.length > 0
          ? 'Select a partner to play with or choose Solo Mode.'
          : 'Link with your partner to compare answers and grow together.'}
      </Text>

      {loadingCouples ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
      ) : (
        <>
          {couples.length > 0 && (
            <View style={styles.couplesList}>
              <TouchableOpacity
                style={styles.coupleItem}
                onPress={() => setActiveCouple(null)}>
                <View style={styles.selectionIndicator}>
                  <View style={styles.indicatorOuter}>
                    {!activeCouple && <View style={styles.indicatorInner} />}
                  </View>
                </View>
                <Text style={styles.coupleText}>Solo Mode</Text>
              </TouchableOpacity>
              {couples.map(couple => (
                <TouchableOpacity
                  key={couple.id}
                  style={styles.coupleItem}
                  onPress={() => setActiveCouple(couple)}>
                  <View style={styles.selectionIndicator}>
                    <View style={styles.indicatorOuter}>
                      {activeCouple?.id === couple.id && <View style={styles.indicatorInner} />}
                    </View>
                  </View>
                  <Text style={styles.coupleText}>{couple.partner.first_name || `Partner (${couple.partner.id.substring(0, 6)})`}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <GradientButton
            title={couples.length > 0 ? 'Link New Partner' : 'Link Your Account'}
            onPress={onLinkPartner}
            style={{ marginTop: SPACING.lg }}
          />
        </>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  featureCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  featureTitle: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  featureDescription: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  couplesList: {
    width: '100%',
    marginVertical: SPACING.md,
  },
  coupleItem: {
    padding: SPACING.md,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionIndicator: {
    paddingRight: SPACING.md,
  },
  indicatorOuter: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  coupleText: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});
