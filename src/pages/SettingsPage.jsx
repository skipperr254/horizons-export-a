import React, { useState } from 'react';
import Seo from '@/components/Seo';
import { motion } from 'framer-motion';
import SettingsSidebar from '@/components/settings/SettingsSidebar';
import ProfileSettings from '@/components/settings/ProfileSettings';
import PasswordSettings from '@/components/settings/PasswordSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import PreferencesSettings from '@/components/settings/PreferencesSettings';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { User, Shield, Bell, Palette, Crown, LogOut } from 'lucide-react';
import SubscriptionManagement from '@/components/settings/SubscriptionManagement';

const settingsRoutes = [
  { path: '/', element: <ProfileSettings />, icon: User, label: 'Profil' },
  { path: 'security', element: <PasswordSettings />, icon: Shield, label: 'Güvenlik' },
  { path: 'notifications', element: <NotificationSettings />, icon: Bell, label: 'Bildirimler' },
  { path: 'appearance', element: <PreferencesSettings />, icon: Palette, label: 'Görünüm' },
  { path: 'subscription', element: <SubscriptionManagement />, icon: Crown, label: 'Abonelik' },
];

const SettingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { logout } = useAuth();
  const { toast } = useToast();
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast({
        title: 'Başarıyla çıkış yapıldı',
        description: 'Görüşmek üzere! 👋',
      });
    } catch (error) {
      toast({
        title: 'Çıkış yapılamadı',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const MobileSettings = () => (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Ayarlar</h1>
      <Accordion type="single" collapsible className="w-full">
        {settingsRoutes.map(({ path, element, icon: Icon, label }) => (
          <AccordionItem value={`item-${path === '/' ? '' : path}`} key={path}>
            <AccordionTrigger className="text-base py-4">
              <div className="flex items-center">
                <Icon className="mr-3 h-5 w-5" />
                {label}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {element}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <Button
        variant="destructive"
        className="w-full mt-8 h-12 text-base"
        onClick={() => setIsLogoutAlertOpen(true)}
      >
        <LogOut className="mr-2 h-5 w-5" />
        Çıkış Yap
      </Button>
    </div>
  );

  const DesktopSettings = () => (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row gap-10">
        <SettingsSidebar />
        <main className="flex-1">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Routes>
              {settingsRoutes.map(({ path, element }) => (
                <Route key={path} path={path} element={element} />
              ))}
              <Route path="*" element={<Navigate to="/settings" replace />} />
            </Routes>
          </motion.div>
        </main>
      </div>
    </div>
  );

  return (
    <>
      <Seo
        title="Ayarlar"
        description="HikayeGO hesap ayarlarınızı yönetin. Profil, güvenlik, bildirimler ve abonelik ayarlarınızı buradan düzenleyebilirsiniz."
      />
      <div className="min-h-screen bg-background">
        {isMobile ? <MobileSettings /> : <DesktopSettings />}
      </div>
      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Çıkış yapmak istediğine emin misin?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem mevcut oturumunu sonlandıracak ve seni ana sayfaya yönlendirecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Çıkış Yap
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SettingsPage;