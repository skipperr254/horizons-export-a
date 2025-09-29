import { supabase } from '@/lib/customSupabaseClient';
import DOMPurify from 'dompurify';

export const loginUser = async (email, password, setAuthError) => {
  try {
    setAuthError(null);
    console.log('🔐 Login attempt for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: DOMPurify.sanitize(email.toLowerCase().trim()), 
      password 
    });
    
    if (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
    
    console.log('✅ Login successful');
    return data;
  } catch (error) {
    console.error('❌ Login failed:', error);
    setAuthError(error.message);
    throw error;
  }
};

export const registerUser = async (name, email, password, setAuthError) => {
  try {
    setAuthError(null);
    console.log('📝 Registration attempt for:', email);

    const sanitizedName = DOMPurify.sanitize(name.trim());
    const sanitizedEmail = DOMPurify.sanitize(email.toLowerCase().trim());

    if (!sanitizedName || sanitizedName.length < 2) {
      throw new Error('Ad Soyad en az 2 karakter olmalıdır');
    }
    if (!sanitizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      throw new Error('Geçerli bir e-posta adresi girin');
    }
    if (!password || password.length < 6) {
      throw new Error('Şifre en az 6 karakter olmalıdır');
    }

    const { data: emailExists, error: rpcError } = await supabase.rpc('check_email_exists', {
      p_email: sanitizedEmail,
    });

    if (rpcError) {
      console.error('Error checking email via RPC:', rpcError);
    }

    if (emailExists) {
      throw new Error('Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          name: sanitizedName,
        },
      },
    });
    
    if (error) {
      console.error('❌ Registration error:', error);
      
      if (error.message.includes('User already registered') || 
          error.message.includes('already been registered') ||
          error.message.includes('Email address already registered')) {
        throw new Error('Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.');
      }

      if (error.message.includes('Email address') && error.message.includes('is invalid')) {
        throw new Error('Geçersiz e-posta adresi. Lütfen geçerli bir e-posta adresi kullanın.');
      }
      
      throw error;
    }
    
    console.log('✅ Registration successful');
    return data;
  } catch (error) {
    console.error('❌ Registration failed:', error);
    setAuthError(error.message);
    throw error;
  }
};

export const signInWithGoogleUser = async (setAuthError) => {
  try {
    setAuthError(null);
    console.log('🔐 Signing in with Google...');
    
    // Safari detection
    const isSafari = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      return userAgent.includes('safari') && !userAgent.includes('chrome');
    };

    const options = {
      redirectTo: `${window.location.origin}/auth/callback`,
      flowType: 'pkce',
    };

    // Safari-specific configuration for better compatibility
    if (isSafari()) {
      options.queryParams = {
        access_type: 'offline',
        prompt: 'consent',
        response_type: 'code'
      };
      // Force redirect mode for Safari instead of popup
      options.skipBrowserRedirect = false;
      options.scopes = 'openid email profile'
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options,
    });

    if (error) {
      console.error('❌ Google sign-in error:', error);
      throw error;
    }
  } catch (error) {
    console.error('❌ Google sign-in failed:', error);
    setAuthError(error.message);
    throw error;
  }
};

export const logoutUser = async (mountedRef, setUser, setAuthError, lastSessionRef) => {
  setAuthError(null);
  console.log('🚪 Logging out...');

  try {
      const { error } = await supabase.auth.signOut();
      if (error && !error.message.includes('Session from session_id claim in JWT does not exist')) {
          console.warn('Supabase signout warning (handled gracefully):', error.message);
      }
  } catch (e) {
      console.error('A critical error occurred during the logout process:', e);
  } finally {
      if (mountedRef.current) {
          setUser(null);
          lastSessionRef.current = null;
          console.log('✅ Local logout process completed.');
      }
  }
};

export const updateUserProfile = async (newUserData, user, setUser, setAuthError) => {
  if (!user) return;
  
  try {
    setAuthError(null);
    console.log('📝 Updating user profile...', newUserData);
    
    const sanitizedUserData = { ...newUserData };
    if (sanitizedUserData.name) {
      sanitizedUserData.name = DOMPurify.sanitize(sanitizedUserData.name.trim());
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...sanitizedUserData,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Profile update error:', error);
      throw error;
    }
    
    setUser(prevUser => ({ 
      ...prevUser, 
      ...data
    }));
    
    console.log('✅ Profile updated successfully');
    return data;
  } catch (error) {
    console.error('❌ Update user failed:', error);
    setAuthError(error.message);
    throw error;
  }
};