import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import Seo from '@/components/Seo';
import { supabase } from '@/lib/customSupabaseClient';

const AuthCallbackPage = () => {
    const navigate = useNavigate();
    const { user, initialized } = useAuth();
    const { toast } = useToast();
    const [processing, setProcessing] = useState(true);

    // Safari detection
    const isSafari = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.includes('safari') && !userAgent.includes('chrome');
    };

    // Manual token extraction and session setting
    const handleOAuthCallback = async () => {
        try {
            console.log('🔄 Processing OAuth callback...');
            
            // Extract tokens from URL hash or search params
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const searchParams = new URLSearchParams(window.location.search);
            
            // Check for error in URL
            const error = hashParams.get('error') || searchParams.get('error');
            const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
            
            if (error) {
                console.error('❌ OAuth error:', error, errorDescription);
                throw new Error(errorDescription || error);
            }

            // Get tokens from URL
            const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
            const tokenType = hashParams.get('token_type') || searchParams.get('token_type') || 'bearer';
            const expiresIn = hashParams.get('expires_in') || searchParams.get('expires_in');
            const expiresAt = hashParams.get('expires_at') || searchParams.get('expires_at');

            if (!accessToken) {
                console.error('❌ No access token found in URL');
                throw new Error('No access token received from OAuth provider');
            }

            console.log('✅ Tokens found, setting session manually...');

            // Create session object
            const sessionData = {
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: tokenType,
                expires_in: expiresIn ? parseInt(expiresIn) : 3600,
                expires_at: expiresAt ? parseInt(expiresAt) : Math.floor(Date.now() / 1000) + 3600,
                user: null // Will be populated by Supabase
            };

            // Set the session manually
            const { data, error: sessionError } = await supabase.auth.setSession(sessionData);
            
            if (sessionError) {
                console.error('❌ Failed to set session:', sessionError);
                throw sessionError;
            }

            if (data.session) {
                console.log('✅ Session set successfully:', data.session.user?.email);
                
                // Clear URL parameters for security
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Show success message
                toast({
                    title: 'Giriş Başarılı!',
                    description: 'Google ile giriş yapıldı.',
                });
                
                // Redirect to dashboard
                navigate('/dashboard', { replace: true });
            } else {
                throw new Error('Session was not created');
            }

        } catch (error) {
            console.error('❌ OAuth callback processing failed:', error);
            
            toast({
                title: 'Oturum Açılamadı',
                description: error.message || 'Giriş yapılırken bir sorun oluştu. Lütfen tekrar deneyin.',
                variant: 'destructive',
            });
            
            // Clear URL and redirect to login
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate('/login', { replace: true });
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        if (!initialized) return;

        // If user is already logged in, redirect immediately
        if (user) {
            console.log('User already logged in, redirecting to dashboard.');
            navigate('/dashboard', { replace: true });
            return;
        }

        // For Safari or when manual processing is needed
        if (isSafari() || window.location.hash.includes('access_token') || window.location.search.includes('access_token')) {
            handleOAuthCallback();
            return;
        }

        // Fallback: wait for Supabase to process the session
        const timeout = setTimeout(() => {
            if (!user) {
                console.log('No user found on callback, redirecting to login.');
                toast({
                    title: 'Oturum Açılamadı',
                    description: 'Giriş yapılırken bir sorun oluştu. Lütfen tekrar deneyin.',
                    variant: 'destructive',
                });
                navigate('/login', { replace: true });
            }
        }, 5000); // 5 second timeout

        return () => clearTimeout(timeout);
    }, [user, initialized, navigate, toast]);

    return (
        <>
            <Seo
                title="Yönlendiriliyor..."
                description="Kimlik doğrulama işlemi tamamlanıyor."
                noIndex={true}
            />
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        {processing ? 'Oturumunuz doğrulanıyor, lütfen bekleyin...' : 'Yönlendiriliyor...'}
                    </p>
                    {isSafari() && (
                        <p className="text-xs text-amber-600 mt-2">
                            Safari algılandı, manuel işlem yapılıyor...
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default AuthCallbackPage;