import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { User, Mail, Crown, Image as ImageIcon, Check } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import AvatarSelection from './AvatarSelection';
import { normalAvatars, allPremiumAvatars } from '@/lib/avatars';

const ProfileSettings = () => {
  const { user, profile, updateUser, canAccessPremiumFeatures, refreshUserProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '', avatar_url: null });
  const [initialProfileData, setInitialProfileData] = useState(null);

  useEffect(() => {
    if (profile) {
      const initialData = { 
        name: profile.name || '', 
        email: profile.email || '', 
        avatar_url: profile.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.email}`
      };
      setProfileData(initialData);
      setInitialProfileData(initialData);
    } else if (user) {
        const initialData = {
        name: user.name || '', 
        email: user.email || '', 
        avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`
      };
      setProfileData(initialData);
      setInitialProfileData(initialData);
    }
  }, [user, profile]);
  
  const isProfileChanged = JSON.stringify(profileData) !== JSON.stringify(initialProfileData);

  const handleUpdateProfile = async () => {
    if (!profileData.name.trim()) {
      toast({ title: "Eksik bilgi", description: "Ad soyad alanı boş bırakılamaz.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').update({ 
          name: profileData.name.trim(), 
          avatar_url: profileData.avatar_url, 
          updated_at: new Date().toISOString() 
      })
      .eq('id', user.id)
      .select()
      .single();

      if (error) throw error;
      
      await updateUser(data);
      await refreshUserProfile();
      setInitialProfileData(profileData);
      toast({ title: "Profil güncellendi! ✨", description: "Bilgileriniz başarıyla kaydedildi." });
    } catch (error) {
      console.error('Profile update failed:', error);
      toast({ title: "Hata", description: "Profil güncellenirken bir hata oluştu.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (avatarUrl) => {
    setProfileData(prev => ({ ...prev, avatar_url: avatarUrl }));
  };

  const SecureAvatarDisplay = ({ avatarUrl, name, email }) => {
    const fallback = name ? name.charAt(0).toUpperCase() : email?.charAt(0).toUpperCase();
    return (
      <div 
        className="relative"
        onContextMenu={(e) => e.preventDefault()}
      >
        <Avatar 
          className="h-32 w-32 border-4 border-primary/20 shadow-xl transition-all duration-300 group-hover:shadow-primary/20 pointer-events-none"
        >
          <AvatarImage src={avatarUrl} alt={name} className="object-cover" draggable="false" />
          <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary to-purple-600 text-white">{fallback}</AvatarFallback>
        </Avatar>
      </div>
    );
  };
  
  if (!initialProfileData) return null;

  return (
    <Card className="overflow-hidden border-border/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-b">
        <CardTitle className="flex items-center text-xl"><User className="mr-3 h-6 w-6 text-primary" />Profil Bilgileri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 p-6">
        <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
          <motion.div whileHover={{ scale: 1.05 }} className="relative group">
            <SecureAvatarDisplay avatarUrl={profileData.avatar_url} name={profileData.name} email={user?.email} />
            {canAccessPremiumFeatures && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }} className="absolute -top-2 -right-2 p-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-lg"><Crown className="h-8 w-8 text-white drop-shadow-lg" fill="currentColor" /></motion.div>
            )}
          </motion.div>
          <div className="space-y-4 w-full max-w-md">
            <div className="space-y-2"><Label htmlFor="name" className="text-base font-semibold">Ad Soyad</Label><Input id="name" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} placeholder="Adınızı ve soyadınızı girin" disabled={loading} className="h-12 text-lg border-2 focus:border-primary transition-colors" /></div>
            <div className="space-y-2"><Label htmlFor="email" className="text-base font-semibold">E-posta</Label><div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input id="email" type="email" value={profileData.email} disabled className="h-12 text-lg bg-muted pl-12 border-2" /></div></div>
          </div>
        </div>
        <div className="space-y-6"><div className="flex items-center space-x-3"><div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-lg"><ImageIcon className="h-6 w-6 text-white" /></div><div><h3 className="text-xl font-bold">Avatarını Seç</h3><p className="text-sm text-muted-foreground">{canAccessPremiumFeatures ? "Premium üye olarak 15 farklı avatar arasından seçim yapabilirsin!" : "5 ücretsiz avatar arasından seçim yap veya premium'a geç!"}</p></div></div><AvatarSelection normalAvatars={normalAvatars} premiumAvatars={allPremiumAvatars} selectedAvatar={profileData.avatar_url} onSelect={handleAvatarSelect} isPremium={canAccessPremiumFeatures} /></div>
        <Button onClick={handleUpdateProfile} disabled={loading || !isProfileChanged} className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 transition-all duration-300 shadow-lg hover:shadow-xl disabled:bg-muted disabled:shadow-none disabled:bg-gradient-to-r disabled:from-muted disabled:to-muted-foreground/50">
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Kaydediliyor...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5" />
              <span>Değişiklikleri Kaydet</span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;