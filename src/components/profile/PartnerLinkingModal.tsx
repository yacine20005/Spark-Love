
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { GlassCard } from '../GlassCard';
import { GradientButton } from '../GradientButton';
import { usePartnerLinking } from '../../hooks/usePartnerLinking';
import { COLORS, FONTS, SPACING } from '../../constants';

interface PartnerLinkingModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PartnerLinkingModal: React.FC<PartnerLinkingModalProps> = ({ visible, onClose }) => {
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

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <GlassCard style={styles.modalContent} opacity={1}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
  );
};

const styles = StyleSheet.create({
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
