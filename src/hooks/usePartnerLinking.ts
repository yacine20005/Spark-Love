import { useState } from 'react';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../context/AuthContext';
import { PartnerService } from '../api/partnerService';

type ModalContent = 'options' | 'enterCode' | 'generateCode';

export const usePartnerLinking = () => {
  const { refreshCouples, user } = useAuth();
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
    if (!user) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }
    setIsLoading(true);
    setGeneratedCode('');
    try {
      const code = await PartnerService.generateLinkingCode(user.id);
      setGeneratedCode(code);
      setModalContent('generateCode');
    } catch (error: any) {
      Alert.alert('Error', 'Could not generate a linking code. Please try again.');
      console.error('Generate code error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkPartner = async () => {
    const cleanCode = linkingCode.trim().toUpperCase();
    if (!cleanCode) return;

    if (!user) {
      Alert.alert('Error', 'You must be logged in to link a partner.');
      return;
    }

    // Prevent self-link on the client when the user tries to use their own freshly generated code
    if (generatedCode && cleanCode === generatedCode) {
      Alert.alert(
        'Oops!',
        "It's great to love yourself, but solo mode is here for that 😉"
      );
      return;
    }

    setIsLoading(true);
    try {
      await PartnerService.linkWithCode(cleanCode, user.id);
      Alert.alert('Success!', 'You have successfully linked with your partner.');
      await refreshCouples();
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to link partner.');
      console.error('Link partner error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(generatedCode);
    Alert.alert('Copied!', 'The code has been copied to your clipboard.');
  };

  return {
    modalVisible,
    setModalVisible,
    modalContent,
    setModalContent,
    linkingCode,
    setLinkingCode,
    generatedCode,
    isLoading,
    openModal,
    handleGenerateCode,
    handleLinkPartner,
    copyToClipboard,
  };
};
