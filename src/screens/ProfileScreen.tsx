import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { GlassCard } from '../components/GlassCard';
import { GradientButton } from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { COLORS, FONTS, SPACING, OPACITY } from '../constants';

type ModalContent = 'options' | 'enterCode' | 'generateCode';

export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, signOut, couples, activeCouple, setActiveCouple, refreshCouples, loadingCouples } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent>('options');
  const [linkingCode, setLinkingCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const openModal = () => {
    setModalContent('options');
    setLinkingCode('');
    setGeneratedCode('');
    setModalVisible(true);
  };

  const handleGenerateCode = async () => {
    setIsLoading(true);
    setGeneratedCode('');
    try {
      const { data, error } = await supabase.rpc('create_couple_and_get_code');
      if (error) throw error;
      setGeneratedCode(data);
      setModalContent('generateCode');
    } catch (error: any) {
      Alert.alert('Error', 'Could not generate a linking code. Please try again.');
      console.error('Generate code error:', error);
    }
    setIsLoading(false);
  };

  const handleLinkPartner = async () => {
    const cleanCode = linkingCode.trim().toUpperCase();
    if (!cleanCode) return;
    setIsLoading(true);
    try {
      await supabase.rpc('link_partner', { p_linking_code: cleanCode });
      Alert.alert('Success!', 'You have successfully linked with your partner.');
      await refreshCouples();
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to link partner.');
      console.error('Link partner error:', error);
    }
    setIsLoading(false);
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(generatedCode);
    Alert.alert('Copied!', 'The code has been copied to your clipboard.');
  };

  const renderPartnerCard = () => (
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
                  <Text style={styles.coupleText}>{couple.partner.email}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <GradientButton
            title={couples.length > 0 ? 'Link New Partner' : 'Link Your Account'}
            onPress={openModal}
            style={{ marginTop: SPACING.lg }}
          />
        </>
      )}
    </GlassCard>
  );

  const renderModalContent = () => {
    if (isLoading) {
        return <ActivityIndicator size="large" color={COLORS.primary} />;
    }

    switch (modalContent) {
      case 'options':
        return (
          <>
            <Text style={styles.modalTitle}>Link with Partner</Text>
            <Text style={styles.modalText}>How would you like to link?</Text>
            <GradientButton title="I have a code" onPress={() => setModalContent('enterCode')} style={{width: '100%'}} />
            <Text style={styles.modalSeparator}>OR</Text>
            <GradientButton title="Generate a code" onPress={handleGenerateCode} disabled={isLoading} style={{width: '100%'}} />
          </>
        );
      case 'enterCode':
        return (
          <>
            <Text style={styles.modalTitle}>Enter Code</Text>
            <Text style={styles.modalText}>Enter the 6-character code from your partner.</Text>
            <TextInput
              style={styles.textInput}
              placeholder="ABCDEF"
              placeholderTextColor={COLORS.textSecondary}
              value={linkingCode}
              onChangeText={setLinkingCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <GradientButton title="Link Account" onPress={handleLinkPartner} disabled={isLoading || linkingCode.length < 6} style={{width: '100%'}} />
          </>
        );
      case 'generateCode':
        return (
          <>
            <Text style={styles.modalTitle}>Share this Code</Text>
            <Text style={styles.modalText}>Ask your partner to enter this code on their profile screen.</Text>
            <TouchableOpacity onPress={copyToClipboard}>
              <GlassCard style={styles.codeContainer} opacity={0.5}>
                <Text style={styles.generatedCode}>{generatedCode}</Text>
              </GlassCard>
            </TouchableOpacity>
            <GradientButton title="Copy Code" onPress={copyToClipboard} style={{marginTop: SPACING.lg, width: '100%'}} />
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.backgroundGradient} />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.lg }]}>
        <GlassCard style={styles.headerCard} opacity={OPACITY.glass}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account and preferences 👤</Text>
        </GlassCard>

        {renderPartnerCard()}

        <GlassCard style={styles.featureCard} opacity={OPACITY.glass}>
          <Text style={styles.featureTitle}>Your Account</Text>
          <Text style={styles.featureDescription}>You are signed in as: {user?.email}</Text>
          <GradientButton title="Sign Out" onPress={signOut} style={{ marginTop: SPACING.lg }} />
        </GlassCard>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <GlassCard style={styles.modalContent} opacity={1}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            {modalContent !== 'options' && (
                <TouchableOpacity onPress={() => setModalContent('options')} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹ Back</Text>
                </TouchableOpacity>
            )}
            <View style={styles.modalInnerContent}>
              {renderModalContent()}
            </View>
          </GlassCard>
        </View>
      </Modal>
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
  featureCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  featureTitle: {
    ...FONTS.h2,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  featureDescription: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: "center",
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
  activeCoupleItem: {
    backgroundColor: COLORS.primary,
  },
  coupleText: {
    ...FONTS.body1,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  modalContent: {
    width: '90%',
    padding: SPACING.xl,
  },
  modalInnerContent: {
    alignItems: 'center',
    width: '100%',
    paddingTop: SPACING.xl, // To avoid overlap with buttons
  },
  modalTitle: {
    ...FONTS.h1,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  modalText: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  textInput: {
    width: '100%',
    minHeight: 50,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 10,
    padding: 10,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    letterSpacing: 4,
  },
  modalSeparator: {
    ...FONTS.h3,
    color: COLORS.textSecondary,
    marginVertical: SPACING.lg,
  },
  codeContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: 15,
    marginBottom: SPACING.lg,
  },
  generatedCode: {
    ...FONTS.largeTitle,
    color: COLORS.primary,
    letterSpacing: 5,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    padding: SPACING.sm,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    padding: SPACING.sm,
    zIndex: 1,
  },
  backButtonText: {
    ...FONTS.button,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});
