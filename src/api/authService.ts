import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Ensure the auth session can be completed if redirection occurs on web
WebBrowser.maybeCompleteAuthSession();

export class AuthService {
  static async signInWithGoogle() {
    try {
      // Create redirect URL back to the app
      const redirectTo = Linking.createURL('index');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No OAuth URL returned from Supabase');

      // Open the OAuth URL in WebBrowser session
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success' && result.url) {
        // Extract access_token and refresh_token from redirect URL hash
        const hashIndex = result.url.indexOf('#');
        if (hashIndex === -1) {
          throw new Error('No session parameters found in redirect URL');
        }

        const hash = result.url.substring(hashIndex + 1);
        const params = Object.fromEntries(
          hash.split('&').map((param) => {
            const [key, value] = param.split('=');
            return [key, decodeURIComponent(value || '')];
          })
        );

        const accessToken = params.access_token;
        const refreshToken = params.refresh_token;

        if (!accessToken || !refreshToken) {
          throw new Error('Access token or refresh token is missing in redirect URL');
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) throw sessionError;
        return { error: null };
      }

      return { error: new Error('Google Sign-In was cancelled or failed') };
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      return { error };
    }
  }

  static async signInWithOtp(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        data: {
          otpType: 'email',
        },
      },
    });
    return { error };
  }

  static async verifyOtp(email: string, token: string) {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });
    return { error };
  }

  static async resendConfirmationEmail(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        data: {
          otpType: 'email',
        },
      },
    });
    return { error };
  }

  static async signOut() {
    await supabase.auth.signOut();
  }
}

