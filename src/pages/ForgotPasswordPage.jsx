import React, { useState, useRef, useCallback } from 'react';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import DOMPurify from 'dompurify';
import { handlePasswordResetError } from '@/utils/authUtils';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isSubmitting = useRef(false);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isSubmitting.current) return;

    const sanitizedEmail = DOMPurify.sanitize(email.trim().toLowerCase());
    
    if (!sanitizedEmail) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen e-posta adresinizi girin.",
        variant: "destructive"
      });
      return;
    }

    isSubmitting.current = true;
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('request-password-reset', {
        body: { email: sanitizedEmail },
      });

      if (error) {
        const fetchError = await error.context.json();
        const friendlyError = handlePasswordResetError({ ...error, body: fetchError.error });
        toast({
          title: "Hata",
          description: friendlyError,
          variant: "destructive"
        });
      } else if (data.error) {
        toast({
          title: "Hata",
          description: data.error,
          variant: "destructive"
        });
      } else {
        setMessageSent(true);
      }
      
    } catch (error) {
      console.error('Unhandled password reset request error:', error);
      const friendlyError = handlePasswordResetError(error);
       toast({
        title: "Hata",
        description: friendlyError,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  }, [email, toast]);

  return (
    <>
      <Seo
        title="Şifremi Unuttum"
        description="HikayeGO hesap şifrenizi sıfırlayın. E-posta adresinize bir sıfırlama bağlantısı gönderelim."
        url="/forgot-password"
        keywords="şifre sıfırlama, şifremi unuttum, hesap kurtarma"
      />
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-secondary/20 relative">
        <div className="absolute top-4 right-4">
            <ThemeToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md z-10"
        >
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/20 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl md:text-3xl font-bold">Şifrenizi mi Unuttunuz?</CardTitle>
              <CardDescription className="text-base">
                Endişelenmeyin! Şifrenizi sıfırlamak için e-posta adresinizi girin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messageSent ? (
                <div className="text-center p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4"/>
                  <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">İsteğiniz Alındı!</h3>
                  <p className="text-muted-foreground mt-2">
                    Eğer e-posta adresiniz sistemimizde kayıtlıysa, şifre sıfırlama bağlantısı gönderilecektir. Gelen kutunuzu ve spam klasörünü kontrol etmeyi unutmayın.
                  </p>
                  <Button onClick={() => navigate('/login')} className="mt-6 w-full">Giriş Sayfasına Dön</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta Adresi</Label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="ornek@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="pl-10 h-10 text-sm"
                        />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      'Şifre Sıfırlama Bağlantısı Gönder'
                    )}
                  </Button>
                </form>
              )}
               <div className="mt-6 text-center text-sm">
                <Link to="/login" className="font-medium text-primary hover:underline inline-flex items-center">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Giriş ekranına geri dön
                </Link>
                </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;