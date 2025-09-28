import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';
import { AuthContext } from './AuthContext';
import { loadUserProfile } from './AuthHelpers';
import { handleAuthStateChange } from './authHandlers';
import { loginUser, registerUser, signInWithGoogleUser, logoutUser, updateUserProfile } from './authActions';

// Safari detection
const isSafari = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('safari') && !userAgent.includes('chrome');
};

// Mobile Safari detection
const isMobileSafari = () => {
  return isSafari() && /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const authListenerRef = useRef(null);
  const initializingRef = useRef(false);
  const lastSessionRef = useRef(null);
  const mountedRef = useRef(true);

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

        // Adjust timeout based on browser and device
        let timeoutDuration = 10000; // Default 10 seconds
        if (isMobileSafari()) {
          timeoutDuration = 20000; // 20 seconds for mobile Safari
        } else if (isSafari()) {
          timeoutDuration = 15000; // 15 seconds for desktop Safari
        }

        console.log(`⏱️ Using ${timeoutDuration}ms timeout for ${isMobileSafari() ? 'Mobile Safari' : isSafari() ? 'Safari' : 'other browsers'}`);

        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), timeoutDuration)
        );

        let session, error;

        try {
          const result = await Promise.race([sessionPromise, timeoutPromise]);
          session = result.data?.session;
          error = result.error;
        } catch (timeoutError) {
          console.warn('⚠️ Session check timed out, trying alternative approach...');

          // Safari fallback: Try without timeout
          if (isSafari()) {
            try {
              const fallbackResult = await supabase.auth.getSession();
              session = fallbackResult.data?.session;
              error = fallbackResult.error;
              console.log('✅ Fallback session check succeeded');
            } catch (fallbackError) {
              console.error('❌ Fallback session check failed:', fallbackError);
              error = fallbackError;
            }
          } else {
            throw timeoutError;
          }
        }

        if (!mountedRef.current) return;

        if (error) {
          console.error('❌ Session error:', error);
          setUser(null);
          setAuthError(error.message);
        } else if (session?.user) {
          console.log('✅ Session found, loading profile...');
          lastSessionRef.current = session.user.id;
          await loadProfile(session.user);
        } else {
          console.log('ℹ️ No active session');
          setUser(null);
          lastSessionRef.current = null;
        }

        // Setup auth listener
        if (!authListenerRef.current) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => handleAuthStateChange(
              event, session, mountedRef, lastSessionRef,
              { setIsNewUser, loadProfile, setUser, setAuthError, user }
            )
          );
          authListenerRef.current = subscription;
        }

      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mountedRef.current) {
          setUser(null);
          // Don't show timeout errors to users, they're confusing
          if (!error.message.includes('timeout')) {
            setAuthError(error.message);
          } else {
            console.log('ℹ️ Continuing without session (timeout)');
          }
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setInitialized(true);
          initializingRef.current = false;
        }
      }
    };

    // Add small delay for Safari to prevent race conditions
    if (isSafari()) {
      setTimeout(initialize, 100);
    } else {
      initialize();
    }

    return () => {
      mountedRef.current = false;
      if (authListenerRef.current) {
        authListenerRef.current.unsubscribe();
        authListenerRef.current = null;
      }
    };
  }, [loadProfile, user]);

  const login = useCallback((email, password) => loginUser(email, password, setAuthError), []);
  const register = useCallback((name, email, password) => registerUser(name, email, password, setAuthError), []);
  const signInWithGoogle = useCallback(() => signInWithGoogleUser(setAuthError), []);
  const logout = useCallback(() => logoutUser(mountedRef, setUser, setAuthError, lastSessionRef), []);
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


  const contextValue = React.useMemo(() => ({
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
  }), [user, login, register, logout, updateUser, loading, authError, initialized, reauthenticate, canAccessPremiumFeatures, subscriptionStatus, refreshUserProfile, signInWithGoogle, isNewUser]);

  console.log(loading)
  console.log(initialized)
  
  if (loading && !initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          {isSafari() && (
            <p className="text-xs text-muted-foreground mt-2">Safari algılandı, biraz daha uzun sürebilir...</p>
          )}
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