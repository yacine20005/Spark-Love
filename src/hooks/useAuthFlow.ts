
import { useState } from 'react';
import { Alert } from 'react-native';
import { AuthService } from '../api/authService';

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const useAuthFlow = () => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const handleAuth = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    if (!validateEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await AuthService.signInWithOtp(email);
      if (error) {
        Alert.alert('Authentication Error', error.message);
      } else {
        setPendingEmail(email.trim());
        setShowOtpInput(true);
        Alert.alert(
          'Check Your Email',
          'We sent you a 6-digit verification code. Please check your email inbox and look for a 6-digit number - it might be in the subject line, email body, or within a confirmation link.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code.');
      return;
    }
    if (!pendingEmail) {
      Alert.alert(
        'Error',
        'No pending verification. Please start the sign-in process again.'
      );
      return;
    }
    setLoading(true);
    try {
      const { error } = await AuthService.verifyOtp(pendingEmail, otpCode);
      if (error) {
        Alert.alert(
          'Invalid Code',
          'The verification code is incorrect or has expired. Please try again.'
        );
      } else {
        Alert.alert('Success!', 'Welcome to Spark Love!');
        setShowOtpInput(false);
        setPendingEmail('');
        setOtpCode('');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred while verifying the code.'
      );
      console.error('OTP verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmationEmail = async () => {
    if (!pendingEmail) {
      Alert.alert('Error', 'No pending email. Please start the process again.');
      return;
    }
    try {
      const { error } = await AuthService.resendConfirmationEmail(pendingEmail);
      if (error) {
        Alert.alert(
          'Error',
          'Failed to resend verification code. Please try again.'
        );
      } else {
        Alert.alert(
          'Code Sent',
          'A new 6-digit verification code has been sent to your email.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred while resending code.'
      );
      console.error('Resend code error:', error);
    }
  };

  const resetAuthFlow = () => {
    setShowOtpInput(false);
    setPendingEmail('');
    setOtpCode('');
  };

  return {
    email,
    setEmail,
    otpCode,
    setOtpCode,
    loading,
    showOtpInput,
    pendingEmail,
    handleAuth,
    verifyOtp,
    resendConfirmationEmail,
    resetAuthFlow,
  };
};

