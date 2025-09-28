import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import Seo from '@/components/Seo';

const AuthCallbackPage = () => {
    const navigate = useNavigate();
    const { user, initialized, loading } = useAuth();
    const { toast } = useToast();
    const [retryCount, setRetryCount] = React.useState(0);

    // Safari detection
    const isSafari = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.includes("safari") && !userAgent.includes("chrome");
    };

    useEffect(() => {
        if (!initialized) return;

        // Give Safari more time to process the auth state
        const maxRetries = isSafari() ? 3 : 1;
        const retryDelay = isSafari() ? 2000 : 1000;

        if (!user && retryCount < maxRetries) {
            console.log(`Retrying auth check (attempt ${retryCount + 1}/${maxRetries})`);
            setTimeout(() => {
                setRetryCount(prev => prev + 1);
            }, retryDelay);
            return;
        }

        if (user) {
            console.log('User found on callback, redirecting to dashboard.');
            toast({
                title: 'Giriş Başarılı!',
                description: 'Tekrar hoş geldiniz!',
            });
            navigate('/dashboard', { replace: true });
        } else {
            console.log('No user found on callback, redirecting to login.');
            toast({
                title: 'Oturum Açılamadı',
                description: 'Giriş yapılırken bir sorun oluştu. Lütfen tekrar deneyin.',
                variant: 'destructive',
            });
            navigate('/login', { replace: true });
        }
    }, [user, initialized, navigate, toast, retryCount]);

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
                    <p className="text-muted-foreground">Oturumunuz doğrulanıyor, lütfen bekleyin...</p>
                    {isSafari() && (
                        <p className="text-xs text-muted-foreground mt-2">
                            Safari algılandı, biraz daha uzun sürebilir...
                        </p>
                    )}
                </div>
            </div>
        </>
    );
};

export default AuthCallbackPage;