import React, { useState, useEffect } from 'react';
import Seo from '@/components/Seo';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import AuthToggle from '@/components/auth/AuthToggle';
import AuthForm from '@/components/auth/AuthForm';
import AuthHeader from '@/components/auth/AuthHeader';
import TestimonialSlider from '@/components/auth/TestimonialSlider';
import RegistrationSuccess from '@/components/auth/RegistrationSuccess';
import { supabase } from '@/lib/customSupabaseClient';
import { testimonials as staticTestimonials } from '@/data/testimonials.js';
import { handleLoginError, handleRegistrationError, handleGoogleSignInError } from '@/utils/authUtils';
import { ToastAction } from "@/components/ui/toast";
import { Button } from '@/components/ui/button';

const GoogleIcon = (props) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C44.588,34.91,48,29.69,48,24C48,22.659,47.862,21.35,47.611,20.083z"></path>
  </svg>
);


const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(location.pathname === '/login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const [slides, setSlides] = useState([]);
  const [slidesLoading, setSlidesLoading] = useState(true);
  const [resending, setResending] = useState(false);

  const { login, register, signInWithGoogle, user, initialized } = useAuth();
  const { toast } = useToast();
  
  const { errors, setErrors, validateAllFields, submitted, setSubmitted } = useFormValidation(formData, acceptTerms, isLogin);
  const { emailWarning, checkEmailAvailability } = useEmailValidation();

  useEffect(() => {
    const fetchSlides = async () => {
      setSlidesLoading(true);
      const { data, error } = await supabase
        .from('auth_slide_images')
        .select('title, subtitle, image_url, gradient_colors, avatar_url, user_title, rating')
        .order('id', { ascending: true });

      if (error || !data || data.length === 0) {
        if (error) {
            console.error('Error fetching auth slides, using fallback:', error);
        }
        const formattedStaticData = staticTestimonials.map((t, index) => ({
            title: t.name,
            subtitle: t.quote,
            image_url: `https://source.unsplash.com/random/800x1200?futuristic,abstract&sig=${t.id}`,
            gradient_colors: 'from-black/80 via-black/50 to-transparent',
            avatar_url: t.avatar,
            user_title: t.title,
            rating: 5,
            duration: 7000 + (index * 1000), // Variable duration for static data
        }));
        setSlides(formattedStaticData);
      } else {
         const formattedData = data.map((item, index) => ({
            ...item,
            rating: item.rating || 5,
            duration: 7000 + (index * 1000),
        }));
        setSlides(formattedData);
      }
      setSlidesLoading(false);
    };

    fetchSlides();
  }, []);

  useEffect(() => {
    if (initialized && user) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, initialized, navigate, location.state]);

  useEffect(() => {
    setIsLogin(location.pathname === '/login');
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setAcceptTerms(false);
    setShowSuccessMessage(false);
    setSubmitted(false);
    setErrors({});
  }, [location.pathname]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'email' && value.includes('@') && !isLogin) {
      checkEmailAvailability(value);
    }
  };

  const handleResendConfirmation = async (email) => {
    if (resending) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });
      if (error) throw error;
      toast({
        title: "E-posta Gönderildi",
        description: "Doğrulama e-postası tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin. Bağlantı 10 dakika geçerlidir.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    
    const isValid = validateAllFields();

    if (!isValid) {
      const firstErrorKey = Object.keys(errors)[0];
      const message = errors[firstErrorKey] || (isLogin ? "Lütfen tüm alanları doldurun." : "Lütfen tüm gerekli alanları doldurun ve şartları kabul edin.");
      toast({
        title: "Form eksik",
        description: message,
        variant: "destructive"
      });
      return;
    }

    if (!isLogin && !acceptTerms) {
      toast({
        title: "Şartlar ve Koşullar",
        description: "Kayıt olmak için Kullanım Koşulları ve Gizlilik Politikasını kabul etmelisiniz.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast({ title: "Giriş başarılı!", description: "Tekrar hoş geldiniz!" });
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        const { data } = await register(formData.name, formData.email, formData.password);
        if (data && data.user && data.user.identities && data.user.identities.length === 0) {
          setShowSuccessMessage(true);
        } else {
          setShowSuccessMessage(true);
        }
      }
    } catch (error) {
      const errorDetails = isLogin ? handleLoginError(error) : handleRegistrationError(error);
      
      const toastProps = {
        title: isLogin ? "Giriş başarısız" : "Kayıt başarısız",
        description: errorDetails.message || errorDetails,
        variant: "destructive",
      };

      if (isLogin && errorDetails.type === 'email_not_confirmed') {
        toastProps.action = (
          <ToastAction altText="Tekrar Gönder" onClick={() => handleResendConfirmation(formData.email)} disabled={resending}>
            {resending ? 'Gönderiliyor...' : 'Tekrar Gönder'}
          </ToastAction>
        );
      }

      toast(toastProps);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSocialLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      const friendlyMessage = handleGoogleSignInError(error);
      toast({
        title: 'Google ile Giriş Hatası',
        description: friendlyMessage,
        variant: 'destructive',
      });
    } finally {
      setSocialLoading(false);
    }
  };

  const handleToggle = (loginMode) => {
    if (isLogin === loginMode) return;
    setIsLogin(loginMode);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setAcceptTerms(false);
    setShowSuccessMessage(false);
    setSubmitted(false);
    setErrors({});
  };

  if (initialized && user) return null;

  return (
    <>
      <Seo
        title={isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
        description={isLogin ? 'HikayeGO hesabınıza giriş yapın ve İngilizce öğrenme maceranıza devam edin.' : 'HikayeGO\'ya ücretsiz kaydolun ve hikayelerle İngilizce öğrenmeye başlayın.'}
        url={isLogin ? '/login' : '/register'}
        keywords="İngilizce giriş, İngilizce kayıt, dil öğrenme hesabı"
      />
      <div className="h-screen w-full flex bg-background overflow-hidden">
        <div className="w-full lg:w-1/2 flex flex-col p-4 sm:p-6 md:p-8 relative overflow-y-auto overflow-x-hidden custom-scrollbar">
          <motion.div 
            className="absolute -top-20 -left-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute -bottom-20 -right-20 w-48 h-48 bg-green-400/10 rounded-full blur-3xl pointer-events-none"
            animate={{ scale: [1.2, 1, 1.2], rotate: [360, 180, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          
          <main className="w-full max-w-md z-10 m-auto flex-grow flex flex-col justify-center py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/30 dark:border-gray-700/30 shadow-2xl shadow-black/10 dark:shadow-black/30 rounded-2xl">
                <CardContent className="p-6">
                  {showSuccessMessage ? (
                    <RegistrationSuccess 
                      email={formData.email} 
                      onBackToLogin={() => handleToggle(true)} 
                    />
                  ) : (
                    <>
                      <AuthHeader isLogin={isLogin} />
                      <div className="space-y-4">
                        <AuthToggle isLogin={isLogin} onToggle={handleToggle} />
                        <AuthForm
                          isLogin={isLogin}
                          formData={formData}
                          onInputChange={handleInputChange}
                          acceptTerms={acceptTerms}
                          setAcceptTerms={setAcceptTerms}
                          rememberMe={rememberMe}
                          setRememberMe={setRememberMe}
                          loading={loading}
                          onSubmit={handleSubmit}
                          errors={errors}
                          emailWarning={emailWarning}
                          submitted={submitted}
                        />
                         <div className="mt-4 space-y-3">
                          <Button
                              variant="outline"
                              className="w-full h-11 group transition-all duration-300 ease-in-out transform hover:-translate-y-px border-2 border-border hover:border-primary/50 hover:bg-primary/5"
                              onClick={handleGoogleSignIn}
                              disabled={socialLoading || loading}
                            >
                              <AnimatePresence mode="wait">
                                {socialLoading ? (
                                  <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex items-center justify-center w-full"
                                  >
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="w-4 h-4 border-2 border-muted-foreground/30 border-t-primary rounded-full mr-2"
                                    />
                                    Yönlendiriliyor...
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="ready"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center justify-center w-full"
                                  >
                                    <GoogleIcon className="mr-2 h-5 w-5" />
                                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">Google ile Devam Et</span>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </main>
        </div>
        <aside className="hidden lg:flex lg:w-1/2 h-full relative overflow-hidden border-l border-border/50">
          <TestimonialSlider slides={slides} loading={slidesLoading} />
        </aside>
      </div>
    </>
  );
};

export default LoginPage;