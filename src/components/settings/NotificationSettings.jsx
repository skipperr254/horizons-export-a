import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, Mail, Trophy, BookOpen, Clock, Megaphone } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const NotificationSettings = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyProgress: true,
    newStories: true,
    achievements: true,
    reminders: false,
    marketing: false
  });

  useEffect(() => {
    loadNotificationSettings();
  }, [user]);

  const loadNotificationSettings = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_settings')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.notification_settings) {
        setNotifications(prev => ({
          ...prev,
          ...data.notification_settings
        }));
      }
    } catch (error) {
      console.error('❌ Error loading notification settings:', error);
      toast({
          title: "Hata",
          description: "Bildirim ayarları yüklenirken bir sorun oluştu.",
          variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_settings: notifications,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      updateUser({ notification_settings: notifications });

      toast({
        title: "Bildirim ayarları güncellendi! 🔔",
        description: "Tercihleriniz başarıyla kaydedildi."
      });
    } catch (error) {
      console.error('❌ Failed to save notification settings:', error);
      toast({
        title: "Hata",
        description: "Bildirim ayarları kaydedilirken bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const notificationOptions = [
    {
      key: 'emailNotifications',
      title: 'E-posta Bildirimleri',
      description: 'Önemli güncellemeler ve bildirimler için e-posta al',
      icon: Mail
    },
    {
      key: 'pushNotifications',
      title: 'Anlık Bildirimler',
      description: 'Tarayıcı bildirimleri ve anlık uyarılar (Yakında!)',
      icon: Bell,
      disabled: true
    },
    {
      key: 'weeklyProgress',
      title: 'Haftalık İlerleme Raporu',
      description: 'Haftalık öğrenme istatistiklerin ve başarıların',
      icon: Trophy
    },
    {
      key: 'newStories',
      title: 'Yeni Hikaye Bildirimleri',
      description: 'Yeni hikayeler eklendiğinde bildirim al',
      icon: BookOpen
    },
    {
      key: 'achievements',
      title: 'Başarı Bildirimleri',
      description: 'Yeni rozetler ve başarılar kazandığında bildirim al',
      icon: Trophy
    },
    {
      key: 'reminders',
      title: 'Öğrenme Hatırlatıcıları',
      description: 'Düzenli öğrenme için günlük hatırlatıcılar',
      icon: Clock
    },
    {
      key: 'marketing',
      title: 'Pazarlama E-postaları',
      description: 'Özel teklifler ve kampanya bildirimleri',
      icon: Megaphone
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Bildirim Ayarları
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {notificationOptions.map((option) => {
            const Icon = option.icon;
            return (
              <div key={option.key} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-start space-x-3">
                  <Icon className={`h-5 w-5 mt-1 ${option.disabled ? 'text-muted-foreground' : 'text-primary'}`} />
                  <div className="space-y-1">
                    <Label htmlFor={option.key} className={`text-base font-medium ${option.disabled ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}>
                      {option.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={option.key}
                  checked={notifications[option.key]}
                  onCheckedChange={(checked) => handleNotificationChange(option.key, checked)}
                  disabled={loading || option.disabled}
                />
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={handleSaveNotifications} 
            disabled={loading} 
            className="w-full"
          >
            <Bell className="mr-2 h-4 w-4" />
            {loading ? "Kaydediliyor..." : "Ayarları Kaydet"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;