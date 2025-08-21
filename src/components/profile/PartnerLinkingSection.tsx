
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
import { GlassCard } from '../GlassCard';
import { GradientButton } from '../GradientButton';
import { usePartnerLinking } from '../../hooks/usePartnerLinking';
import { COLORS, FONTS, SPACING, OPACITY } from '../../constants';

interface PartnerLinkingModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PartnerLinkingSection: React.FC<PartnerLinkingModalProps> = ({ visible, onClose }) => {
  const {
    modalContent,
    setModalContent,
    linkingCode,
    setLinkingCode,
    generatedCode,
    isLoading,
    handleGenerateCode,
    handleLinkPartner,
    copyToClipboard,
  } = usePartnerLinking();

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        Animated.timing(translateY, {
          toValue: -e.endCoordinates.height + 50,
          duration: Platform.OS === 'ios' ? e.duration : 250,
          useNativeDriver: true,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        setKeyboardHeight(0);
        Animated.timing(translateY, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? e.duration : 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, [translateY]);

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
            <GradientButton title="I have a code" onPress={() => setModalContent('enterCode')} style={{ width: '100%' }} />
            <Text style={styles.modalSeparator}>OR</Text>
            <GradientButton title="Generate a code" onPress={handleGenerateCode} disabled={isLoading} style={{ width: '100%' }} />
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
            <GradientButton title="Link Account" onPress={handleLinkPartner} disabled={isLoading || linkingCode.length < 6} style={{ width: '100%' }} />
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
            <GradientButton title="Copy Code" onPress={copyToClipboard} style={{ marginTop: SPACING.lg, width: '100%' }} />
          </>
        );
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: translateY }],
        },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionBackground}>
              <GlassCard style={styles.sectionCard} opacity={OPACITY.glass}>
                <View style={styles.sectionHeader}>
                  {modalContent !== 'options' && (
                    <TouchableOpacity
                      onPress={() => setModalContent('options')}
                      style={styles.backButton}
                    >
                      <Text style={styles.backButtonText}>‹ Back</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.sectionContent}>
                  {renderModalContent()}
                </View>
              </GlassCard>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionContainer: {
    width: '100%',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  sectionBackground: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 1)',
    borderRadius: 15,
    padding: 1,
  },
  sectionCard: {
    width: '100%',
    padding: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: SPACING.xl,
  },
  sectionContent: {
    alignItems: 'center',
    width: '100%',
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
    lineHeight: 24,
  },
  textInput: {
    width: '100%',
    minHeight: 50,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 10,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    fontSize: 20,
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
    width: '100%',
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  generatedCode: {
    ...FONTS.largeTitle,
    color: COLORS.primary,
    letterSpacing: 5,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 28,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  closeButtonText: {
    fontSize: 24,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  backButton: {
    padding: SPACING.sm,
  },
  backButtonText: {
    ...FONTS.button,
    color: COLORS.textSecondary,
    fontSize: 16,
  },
});
