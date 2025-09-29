import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';
import { AuthContext } from './AuthContext';
import { loadUserProfile } from './AuthHelpers';
import { handleAuthStateChange } from './authHandlers';
import { loginUser, registerUser, signInWithGoogleUser, logoutUser, updateUserProfile } from './authActions';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const authListenerRef = useRef(null);
  const mountedRef = useRef(true);
  const initializingRef = useRef(false);

  const loadProfile = useCallback(async (authUser, preserveUser = null) => {
    if (!mountedRef.current) return;

    try {
      await loadUserProfile(authUser, setUser, preserveUser);
    } catch (error) {
      console.error('❌ Profile loading failed:', error);
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!user) return;
    console.log('🔄 Refreshing user profile...');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await loadProfile(session.user);
      console.log('✅ User profile refreshed.');
    }
  }, [user, loadProfile]);

  const reauthenticate = useCallback(async (password) => {
    if (!user?.email) {
      return { error: new Error("Kullanıcı e-postası bulunamadı.") };
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    return { error: reauthError };
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;

    const initialize = async () => {
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        console.log('🔄 Initializing auth...');

        // Skip OAuth processing if we're on the callback page
        // Let the callback page handle token processing
        const isCallbackPage = window.location.pathname.includes('/auth/callback');
        
        if (!isCallbackPage) {
          // Get current session for non-callback pages
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (!mountedRef.current) return;

          if (error) {
            console.error('❌ Session error:', error);
            setUser(null);
            setAuthError(error.message);
          } else if (session?.user) {
            console.log('✅ Session found, loading profile...');
            await loadProfile(session.user);
          } else {
            console.log('ℹ️ No active session');
            setUser(null);
          }
        }

        // Setup auth listener
        if (!authListenerRef.current) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('🔔 Auth state changed:', event, session?.user?.email || 'no user');
              
              if (!mountedRef.current) return;

              if (event === 'SIGNED_IN' && session?.user) {
                console.log('✅ User signed in:', session.user.email);
                await loadProfile(session.user);
                setAuthError(null);
              } else if (event === 'SIGNED_OUT') {
                console.log('👋 User signed out');
                setUser(null);
                setAuthError(null);
              } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                console.log('🔄 Token refreshed for:', session.user.email);
                await loadProfile(session.user);
              } else if (event === 'USER_UPDATED' && session?.user) {
                console.log('👤 User updated:', session.user.email);
                await loadProfile(session.user);
              } else if (event === 'INITIAL_SESSION' && session?.user) {
                console.log('🎯 Initial session found:', session.user.email);
                await loadProfile(session.user);
                setAuthError(null);
              }
            }
          );
          authListenerRef.current = subscription;
        }

      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mountedRef.current) {
          setUser(null);
          setAuthError(error.message);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setInitialized(true);
          initializingRef.current = false;
        }
      }
    };

    initialize();

    return () => {
      mountedRef.current = false;
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, [loadProfile]);

  const login = useCallback((email, password) => loginUser(email, password, setAuthError), []);
  const register = useCallback((name, email, password) => registerUser(name, email, password, setAuthError), []);
  const signInWithGoogle = useCallback(() => signInWithGoogleUser(setAuthError), []);
  const logout = useCallback(() => logoutUser(mountedRef, setUser, setAuthError), []);
  const updateUser = useCallback((newUserData) => updateUserProfile(newUserData, user, setUser, setAuthError), [user]);

  const subscriptionStatus = useMemo(() => {
    if (!user) return 'none';
    return user.subscription_status || 'none';
  }, [user]);

  const canAccessPremiumFeatures = useMemo(() => {
    if (!user) return false;
    const status = user.subscription_status;
    if (status === 'active' || status === 'trial') {
      return true;
    }
    if (status === 'cancelled' && user.next_payment_date) {
      return new Date(user.next_payment_date) > new Date();
    }
    return false;
  }, [user]);

  const contextValue = useMemo(() => ({
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    authError,
    initialized,
    reauthenticate,
    canAccessPremiumFeatures,
    subscriptionStatus,
    refreshUserProfile,
    signInWithGoogle,
    isNewUser,
    setIsNewUser,
  }), [
    user, login, register, logout, updateUser, loading, authError, 
    initialized, reauthenticate, canAccessPremiumFeatures, 
    subscriptionStatus, refreshUserProfile, signInWithGoogle, isNewUser
  ]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};