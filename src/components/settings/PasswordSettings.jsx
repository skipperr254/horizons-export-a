import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Key, Lock, Eye, EyeOff, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { handlePasswordResetError } from '@/utils/authUtils';

const PasswordSettings = () => {
  const { user, reauthenticate } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  });

  const checkPasswordStrength = (password) => {
    let score = 0;
    const feedback = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('En az 8 karakter olmalı');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('En az bir büyük harf içermeli');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('En az bir küçük harf içermeli');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('En az bir rakam içermeli');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('En az bir özel karakter içermeli');
    }

    return { score, feedback };
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'newPassword') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const getPasswordStrengthColor = (score) => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (score) => {
    if (score <= 2) return 'Zayıf';
    if (score <= 3) return 'Orta';
    if (score <= 4) return 'İyi';
    return 'Güçlü';
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Eksik bilgi",
        description: "Lütfen tüm şifre alanlarını doldurun.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Şifreler eşleşmiyor",
        description: "Yeni şifre ve şifre tekrarı aynı olmalıdır.",
        variant: "destructive"
      });
      return;
    }

    if (passwordStrength.score < 3) {
      toast({
        title: "Şifre çok zayıf",
        description: "Lütfen daha güçlü bir şifre seçin.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      if (!user?.email) {
        toast({ title: "Hata", description: "Kullanıcı bilgileri alınamadı.", variant: "destructive" });
        setLoading(false);
        return;
      }
      
      const { error: reauthError } = await reauthenticate(passwordData.currentPassword);
      if (reauthError) {
          toast({ title: "Hata", description: "Mevcut şifreniz yanlış.", variant: "destructive" });
          setLoading(false);
          return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) {
        console.error('❌ Password change error:', updateError);
        const friendlyError = handlePasswordResetError(updateError);
        toast({
          title: "Hata",
          description: friendlyError,
          variant: "destructive"
        });
        return;
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      setPasswordStrength({ score: 0, feedback: [] });

      toast({
        title: "Şifre değiştirildi! 🔐",
        description: "Şifreniz başarıyla güncellendi."
      });
    } catch (error) {
      console.error('❌ Password change failed:', error);
      if (error.message !== "Mevcut şifreniz yanlış.") {
        toast({
            title: "Hata",
            description: "Şifre değiştirilirken bir hata oluştu.",
            variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Güvenlik Ayarları
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="current-password">Mevcut Şifre</Label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="current-password"
              type={showCurrentPassword ? "text" : "password"}
              value={passwordData.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
              placeholder="Mevcut şifrenizi girin"
              className="pl-10 pr-10"
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">Yeni Şifre</Label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              value={passwordData.newPassword}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
              placeholder="Yeni şifrenizi girin"
              className="pl-10 pr-10"
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          {passwordData.newPassword && (
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between text-sm">
                <span>Şifre Gücü:</span>
                <span className={`font-medium ${passwordStrength.score >= 4 ? 'text-green-600' : passwordStrength.score >= 3 ? 'text-blue-600' : passwordStrength.score >= 2 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {getPasswordStrengthText(passwordStrength.score)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                ></div>
              </div>
              {passwordStrength.feedback.length > 0 && passwordStrength.score < 5 && (
                <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                  {passwordStrength.feedback.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1 h-1 bg-muted-foreground rounded-full mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Yeni Şifre Tekrar</Label>
          <div className="relative">
            <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={passwordData.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              placeholder="Yeni şifrenizi tekrar girin"
              className="pl-10 pr-10"
              disabled={loading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
            <p className="text-sm text-red-600">Şifreler eşleşmiyor</p>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t">
          <Button 
            onClick={handleChangePassword} 
            disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || passwordData.newPassword !== passwordData.confirmPassword || passwordStrength.score < 3} 
            className="w-full"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
            {loading ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PasswordSettings;