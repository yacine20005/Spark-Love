import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { GradientButton } from '../components/GradientButton';
import { GlassCard } from '../components/GlassCard';
import { COLORS, FONTS, SPACING, OPACITY, GRADIENTS } from '../constants';

export const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);

    // Attempt to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // If sign-in fails, attempt to sign up
      if (signInError.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          Alert.alert('Error signing up', signUpError.message);
        } else {
          Alert.alert('Success!', 'Account created. Please check your email to confirm your account.');
        }
      } else {
        Alert.alert('Error signing in', signInError.message);
      }
    } else {
      Alert.alert('Success!', 'Logged in successfully.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={GRADIENTS.background}
        style={styles.backgroundGradient}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>💕</Text>
          <Text style={styles.title}>Spark Love</Text>
          <Text style={styles.subtitle}>
            Strengthen your connection, one question at a time.
          </Text>
        </View>

        <GlassCard style={styles.card} opacity={OPACITY.glass}>
          <Text style={styles.cardTitle}>Sign In or Sign Up</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@address.com"
            placeholderTextColor={COLORS.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <GradientButton
            title={loading ? 'Loading...' : 'Sign In / Sign Up'}
            onPress={handleLogin}
            disabled={loading || !email || !password}
            style={styles.button}
          />
          <Text style={styles.infoText}>
            Enter your email and password to sign in or create an account.
          </Text>
        </GlassCard>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  icon: {
    fontSize: 80,
    marginBottom: SPACING.md,
  },
  title: {
    ...FONTS.largeTitle,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...FONTS.body1,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: '80%',
  },
  card: {
    padding: SPACING.lg,
    width: '100%',
  },
  cardTitle: {
    ...FONTS.h3,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary,
    ...FONTS.body2,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.glass,
  },
  button: {
    width: '100%',
  },
  infoText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
