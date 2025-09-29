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
    const [waitingForAuth, setWaitingForAuth] = useState(false);

    useEffect(() => {
        if (!initialized) return;

        const handleCallback = async () => {
            try {
                console.log('🔄 Processing OAuth callback...');
                
                // Check for errors first
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const searchParams = new URLSearchParams(window.location.search);
                
                const error = hashParams.get('error') || searchParams.get('error');
                const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
                
                if (error) {
                    throw new Error(errorDescription || error);
                }

                // Handle PKCE flow (code parameter)
                const code = searchParams.get('code');
                if (code) {
                    console.log('🔑 Processing PKCE code exchange...');
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
                    if (exchangeError) throw exchangeError;
                    
                    // Clear URL after successful processing
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    console.log('✅ PKCE exchange successful, waiting for auth state...');
                    setWaitingForAuth(true);
                    return;
                }

                // Handle implicit flow (access_token in hash/search)
                const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
                if (accessToken) {
                    console.log('🔐 Processing implicit flow tokens...');
                    
                    const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
                    const tokenType = hashParams.get('token_type') || searchParams.get('token_type') || 'bearer';
                    const expiresIn = hashParams.get('expires_in') || searchParams.get('expires_in');
                    
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                        token_type: tokenType,
                        expires_in: expiresIn ? parseInt(expiresIn) : undefined,
                    });
                    
                    if (sessionError) throw sessionError;
                    
                    // Clear URL after successful processing
                    window.history.replaceState({}, document.title, window.location.pathname);
                    
                    console.log('✅ Session set successfully, waiting for auth state...');
                    setWaitingForAuth(true);
                    return;
                }

                // No tokens found, this might be a direct access to callback
                throw new Error('No authentication tokens found');

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

        // If user is already logged in, redirect immediately
        if (user) {
            console.log('✅ User already authenticated, redirecting to dashboard');
            toast({
                title: 'Giriş Başarılı!',
                description: 'Google ile giriş yapıldı.',
            });
            navigate('/dashboard', { replace: true });
            return;
        }

        // If we're waiting for auth state and no user yet, keep waiting
        if (waitingForAuth && !user) {
            return;
        }

        // Process the callback only if we haven't started waiting for auth
        if (!waitingForAuth) {
            handleCallback();
        }

    }, [initialized, user, navigate, toast, waitingForAuth]);

    // Set up a timeout in case auth never comes through
    useEffect(() => {
        if (!waitingForAuth) return;

        const timeout = setTimeout(() => {
            if (!user) {
                console.warn('⚠️ Timeout waiting for auth state, redirecting to login');
                toast({
                    title: 'Oturum Açılamadı',
                    description: 'Oturum açma işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.',
                    variant: 'destructive',
                });
                navigate('/login', { replace: true });
            }
        }, 10000); // 10 second timeout

        return () => clearTimeout(timeout);
    }, [waitingForAuth, user, navigate, toast]);

    const getMessage = () => {
        if (processing) {
            return 'OAuth doğrulanıyor...';
        }
        if (waitingForAuth) {
            return 'Oturum durumu güncelleniyor...';
        }
        return 'Yönlendiriliyor...';
    };

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
                        {getMessage()}
                    </p>
                    {waitingForAuth && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Oturum bilgileri işleniyor, lütfen bekleyin...
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default AuthCallbackPage;