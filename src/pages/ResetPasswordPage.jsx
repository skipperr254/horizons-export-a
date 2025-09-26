import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/customSupabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import Seo from "@/components/Seo";

// Safari detection
const isSafari = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes('safari') && !userAgent.includes('chrome');
};

const isMobileSafari = () => {
  return isSafari() && /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
};

// Simple error handler for Supabase errors
const handlePasswordResetError = (error) => {
  if (error.message.includes("password should be at least")) {
    return "Şifre en az 8 karakter olmalıdır.";
  }
  if (error.message.includes("invalid") || error.message.includes("expired")) {
    return "Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir talep oluşturun.";
  }
  return error.message || "Bir hata oluştu. Lütfen tekrar deneyin.";
};

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSessionAndListen = async () => {
      console.log(`🔄 Checking auth state (attempt ${retryAttempt + 1})...`);

      // Check URL fragments first (Safari sometimes needs this)
      const checkUrlFragments = () => {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');

        if (error) {
          console.error('❌ URL contains error:', error);
          setError('Bağlantıda hata bulundu. Lütfen yeni bir talep oluşturun.');
          setCheckingSession(false);
          return true;
        }

        if (type === 'recovery' && accessToken) {
          console.log('✅ Recovery mode detected from URL');
          setIsRecoveryMode(true);
          setCheckingSession(false);
          return true;
        }

        return false;
      };

      if (checkUrlFragments()) return;

      // Set timeout based on browser
      let timeoutDuration = isMobileSafari() ? 20000 : isSafari() ? 15000 : 10000;

      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Session check timeout');
        setSessionTimeout(true);
        setCheckingSession(false);
      }, timeoutDuration);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Session error:', error);
          setError('Oturum kontrol edilemedi. Lütfen sayfayı yenileyin.');
        } else if (session) {
          console.log('✅ Valid session found');
          setIsRecoveryMode(true);
        } else {
          console.log('ℹ️ No session found');
          // Don't immediately show error, might be a timing issue
          if (retryAttempt < 2 && isSafari()) {
            console.log('🔄 Retrying session check for Safari...');
            setTimeout(() => {
              setRetryAttempt(prev => prev + 1);
              setCheckingSession(true);
              setSessionTimeout(false);
            }, 2000);
            return;
          }
        }

        setCheckingSession(false);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('❌ Session check failed:', err);
        setError('Bağlantı kontrol edilemedi.');
        setCheckingSession(false);
      }

      // Setup auth listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('📡 Auth state change:', event);

        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
          setIsRecoveryMode(true);
          setCheckingSession(false);
          setSessionTimeout(false);
        } else if (event === "USER_UPDATED") {
          toast({
            title: "Şifre başarıyla güncellendi!",
            description: "Yeni şifrenizle giriş yapabilirsiniz.",
            variant: "success",
          });
          navigate("/login");
        }
      });

      return () => subscription.unsubscribe();
    };

    checkSessionAndListen();
  }, [navigate, toast, retryAttempt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      toast({
        title: "Hata",
        description: "Şifreler eşleşmiyor.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalıdır.");
      toast({
        title: "Hata",
        description: "Şifre en az 8 karakter olmalıdır.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      // Success handled by USER_UPDATED event
    } catch (err) {
      const friendlyError = handlePasswordResetError(err);
      setError(friendlyError);
      toast({
        title: "Hata",
        description: friendlyError,
        variant: "destructive",
      });
      if (
        friendlyError.includes("geçersiz") ||
        friendlyError.includes("süresi dolmuş")
      ) {
        setTimeout(() => navigate("/forgot-password"), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualRetry = () => {
    setCheckingSession(true);
    setSessionTimeout(false);
    setRetryAttempt(0);
    window.location.reload();
  };

  const handleForceRecovery = () => {
    setIsRecoveryMode(true);
    setCheckingSession(false);
    setSessionTimeout(false);
  };

  const renderContent = () => {
    if (checkingSession && !sessionTimeout) {
      return (
        <div className='flex flex-col justify-center items-center p-8 space-y-4'>
          <Loader2 className='h-8 w-8 animate-spin' />
          <p className='text-sm text-muted-foreground text-center'>
            Oturum kontrol ediliyor...
            {isSafari() && <><br />Safari algılandı, biraz uzun sürebilir</>}
          </p>
          {retryAttempt > 0 && (
            <p className='text-xs text-muted-foreground'>
              Deneme {retryAttempt + 1}/3
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleForceRecovery}
            className="mt-4"
          >
            Manuel Devam Et
          </Button>
        </div>
      );
    }

    if (sessionTimeout || (!isRecoveryMode && !checkingSession)) {
      return (
        <div className='text-center p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700'>
          <AlertCircle className='mx-auto h-12 w-12 text-yellow-600 mb-4' />
          <h3 className='text-xl font-semibold'>Bağlantı Sorunu</h3>
          <p className='text-muted-foreground mt-2'>
            {sessionTimeout
              ? 'Şifre sıfırlama bağlantısı yüklenemiyor. Bu genellikle Safari\'de oluşur.'
              : 'Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş olabilir.'
            }
          </p>
          <div className='space-y-2 mt-4'>
            <Button onClick={handleManualRetry} className='w-full'>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sayfayı Yenile
            </Button>
            <Button onClick={handleForceRecovery} variant="outline" className='w-full'>
              Yine de Devam Et
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/forgot-password")}
              className='w-full'
            >
              Yeni Bağlantı İste
            </Button>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='space-y-2'>
          <Label htmlFor='password'>Yeni Şifre</Label>
          <div className='relative group'>
            <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
            <Input
              id='password'
              type={showPassword ? "text" : "password"}
              placeholder='En az 8 karakter'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className='pl-10 pr-10 h-10 text-sm'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors'
            >
              {showPassword ? (
                <EyeOff className='h-4 w-4' />
              ) : (
                <Eye className='h-4 w-4' />
              )}
            </button>
          </div>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='confirmPassword'>Yeni Şifre Tekrar</Label>
          <div className='relative group'>
            <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
            <Input
              id='confirmPassword'
              type={showConfirmPassword ? "text" : "password"}
              placeholder='Şifrenizi tekrar girin'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className='pl-10 pr-10 h-10 text-sm'
            />
            <button
              type='button'
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors'
            >
              {showConfirmPassword ? (
                <EyeOff className='h-4 w-4' />
              ) : (
                <Eye className='h-4 w-4' />
              )}
            </button>
          </div>
        </div>
        {error && (
          <p className='text-xs text-destructive flex items-center'>
            <AlertCircle className='h-3 w-3 mr-1' />
            {error}
          </p>
        )}
        <Button type='submit' className='w-full' disabled={loading}>
          {loading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Güncelleniyor...
            </>
          ) : (
            "Şifreyi Güncelle"
          )}
        </Button>
      </form>
    );
  };

  return (
    <>
      <Seo
        title='Yeni Şifre Belirle'
        description='HikayeGO hesabınız için yeni bir şifre oluşturun.'
        url='/reset-password'
        keywords='yeni şifre, şifre güncelleme, hesap güvenliği'
      />
      <div className='min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-secondary/20 relative'>
        <div className='absolute top-4 right-4'>
          <ThemeToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='w-full max-w-md z-10'
        >
          <Card className='backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/20 shadow-2xl'>
            <CardHeader className='text-center'>
              <CardTitle className='text-2xl md:text-3xl font-bold'>
                Yeni Şifre Belirle
              </CardTitle>
              <CardDescription className='text-base'>
                Hesabınız için yeni bir şifre oluşturun.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderContent()}</CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default ResetPasswordPage;