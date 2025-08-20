import { supabase } from '../lib/supabase';

export class AuthService {
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
