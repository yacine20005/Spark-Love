import { useState } from 'react';
import { Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type ModalContent = 'options' | 'enterCode' | 'generateCode';

// Simple 6-char uppercase alphanumeric generator (client-side)
const generateCodeLocal = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let res = '';
  for (let i = 0; i < 6; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
};

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
      let code: string;
      let exists = true;
      let attempts = 0;
      // Try up to 10 times to generate a unique code
      while (exists && attempts < 10) {
        code = generateCodeLocal();
        const { data: existing } = await supabase
          .from('couples')
          .select('id')
          .eq('linking_code', code)
          .single();
        exists = !!existing;
        attempts++;
      }
      if (exists) throw new Error('Could not generate a unique code. Please try again.');

      // Insert a pending couple row
      const { data, error } = await supabase
        .from('couples')
        .insert({ user1_id: user.id, linking_code: code })
        .select('id, linking_code')
        .single();
      if (error) throw error;
      setGeneratedCode(data.linking_code as string);
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
      // Find couple by code
      const { data: couple, error: findErr } = await supabase
        .from('couples')
        .select('id, user1_id, user2_id, linking_code')
        .eq('linking_code', cleanCode)
        .single();
      if (findErr || !couple) throw new Error('Invalid linking code.');
      if (couple.user2_id) throw new Error('This invitation has already been used.');
      if (couple.user1_id === user.id) throw new Error('You cannot link with yourself.');

      // Enforce ordered pair: user1_id < user2_id
      const u1 = couple.user1_id < user.id ? couple.user1_id : user.id;
      const u2 = couple.user1_id < user.id ? user.id : couple.user1_id;

      const { error: updErr } = await supabase
        .from('couples')
        .update({ user1_id: u1, user2_id: u2, linking_code: null })
        .eq('id', couple.id);
      if (updErr) throw updErr;

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
