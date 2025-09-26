import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Palette, Volume2, Type, Globe, Zap, Shield } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const PreferencesSettings = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [preferences, setPreferences] = useState({
    language: 'tr',
    fontSize: [16],
    readingSpeed: [1],
    autoPlay: true,
    soundEffects: true,
    animations: true,
    compactMode: false,
    showTranslations: true,
    highlightWords: true,
    preventAccidentalClicks: false
  });

  useEffect(() => {
    if (user?.preferences) {
      setPreferences(prev => ({
        ...prev,
        ...user.preferences,
        fontSize: Array.isArray(user.preferences.fontSize) ? user.preferences.fontSize : [16],
        readingSpeed: Array.isArray(user.preferences.readingSpeed) ? user.preferences.readingSpeed : [1],
      }));
    }
  }, [user?.preferences]);

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePreferences = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }
      
      updateUser({ preferences: preferences });

      toast({
        title: "Tercihler güncellendi! 🎨",
        description: "Ayarlarınız başarıyla kaydedildi."
      });
    } catch (error) {
      console.error('❌ Failed to save preferences:', error);
      toast({
        title: "Hata",
        description: "Tercihler kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Palette className="mr-2 h-5 w-5" />
          Tercihler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            Dil
          </Label>
          <Select 
            value={preferences.language} 
            onValueChange={(value) => handlePreferenceChange('language', value)}
            preventTouchOpen={preferences.preventAccidentalClicks && isMobile}
          >
            <SelectTrigger>
              <SelectValue placeholder="Dil seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
              <SelectItem value="en">🇺🇸 English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="flex items-center">
            <Type className="mr-2 h-4 w-4" />
            Yazı Boyutu: {preferences.fontSize[0]}px
          </Label>
          <Slider
            value={preferences.fontSize}
            onValueChange={(value) => handlePreferenceChange('fontSize', value)}
            max={24}
            min={12}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Küçük (12px)</span>
            <span>Büyük (24px)</span>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="flex items-center">
            <Zap className="mr-2 h-4 w-4" />
            Okuma Hızı: {preferences.readingSpeed[0]}x
          </Label>
          <Slider
            value={preferences.readingSpeed}
            onValueChange={(value) => handlePreferenceChange('readingSpeed', value)}
            max={2}
            min={0.5}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Yavaş (0.5x)</span>
            <span>Hızlı (2x)</span>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Volume2 className="mr-2 h-4 w-4" />
            Ses Ayarları
          </h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoPlay">Otomatik Ses Çalma</Label>
              <p className="text-sm text-muted-foreground">Kelimelere tıkladığında otomatik telaffuz</p>
            </div>
            <Switch
              id="autoPlay"
              checked={preferences.autoPlay}
              onCheckedChange={(checked) => handlePreferenceChange('autoPlay', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="soundEffects">Ses Efektleri</Label>
              <p className="text-sm text-muted-foreground">Başarı ve etkileşim sesleri</p>
            </div>
            <Switch
              id="soundEffects"
              checked={preferences.soundEffects}
              onCheckedChange={(checked) => handlePreferenceChange('soundEffects', checked)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Arayüz Ayarları</h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="animations">Animasyonlar</Label>
              <p className="text-sm text-muted-foreground">Sayfa geçişleri ve etkileşim animasyonları</p>
            </div>
            <Switch
              id="animations"
              checked={preferences.animations}
              onCheckedChange={(checked) => handlePreferenceChange('animations', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="compactMode">Kompakt Mod</Label>
              <p className="text-sm text-muted-foreground">Daha az boşluk, daha çok içerik</p>
            </div>
            <Switch
              id="compactMode"
              checked={preferences.compactMode}
              onCheckedChange={(checked) => handlePreferenceChange('compactMode', checked)}
            />
          </div>
          
           <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="preventAccidentalClicks" className="flex items-center">
                <Shield className="mr-2 h-4 w-4 text-blue-500" />
                Dokunma Koruması
              </Label>
              <p className="text-sm text-muted-foreground">Mobilde yanlışlıkla menülerin açılmasını engeller</p>
            </div>
            <Switch
              id="preventAccidentalClicks"
              checked={preferences.preventAccidentalClicks}
              onCheckedChange={(checked) => handlePreferenceChange('preventAccidentalClicks', checked)}
            />
          </div>

        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Okuma Ayarları</h4>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showTranslations">Çevirileri Göster</Label>
              <p className="text-sm text-muted-foreground">Kelime çevirilerini otomatik göster</p>
            </div>
            <Switch
              id="showTranslations"
              checked={preferences.showTranslations}
              onCheckedChange={(checked) => handlePreferenceChange('showTranslations', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="highlightWords">Kelime Vurgulama</Label>
              <p className="text-sm text-muted-foreground">Tıklanan kelimeleri vurgula</p>
            </div>
            <Switch
              id="highlightWords"
              checked={preferences.highlightWords}
              onCheckedChange={(checked) => handlePreferenceChange('highlightWords', checked)}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={handleSavePreferences} 
            disabled={loading} 
            className="w-full"
          >
            <Palette className="mr-2 h-4 w-4" />
            {loading ? "Kaydediliyor..." : "Tercihleri Kaydet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreferencesSettings;