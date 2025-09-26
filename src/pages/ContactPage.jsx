import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';
import Seo from '@/components/Seo';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const ContactPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: 'Eksik Alanlar',
        description: 'Lütfen tüm alanları doldurun.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          from_name: formData.name,
          from_email: formData.email,
          subject: `İletişim Formu: ${formData.subject}`,
          body: `
            <p><strong>Gönderen:</strong> ${formData.name}</p>
            <p><strong>E-posta:</strong> ${formData.email}</p>
            <hr>
            <p>${formData.message.replace(/\n/g, '<br>')}</p>
          `,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Mesajınız Gönderildi! 🚀',
        description: 'En kısa sürede size geri dönüş yapacağız.',
      });
      setFormData({ name: user?.name || '', email: user?.email || '', subject: '', message: '' });
    } catch (error) {
      toast({
        title: 'Hata',
        description: `Mesaj gönderilirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin veya bize contact@hikayego.com adresinden ulaşın.`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'E-posta',
      value: 'contact@hikayego.com',
      href: 'mailto:contact@hikayego.com',
    },
    {
      icon: Phone,
      title: 'Telefon',
      value: 'Çok yakında..',
      href: '#',
    },
    {
      icon: MapPin,
      title: 'Adres',
      value: 'Adıyaman, Merkez',
      href: '#',
    },
  ];

  return (
    <>
      <Seo
        title="İletişim"
        description="Bizimle iletişime geçin. Soru, öneri veya işbirliği talepleriniz için buradayız."
      />
      <div className="bg-background text-foreground min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-16 sm:py-24">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                Bizimle <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">İletişime Geçin</span>
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Soru, öneri veya herhangi bir konuda bize ulaşmaktan çekinmeyin. Ekibimiz size yardımcı olmaktan mutluluk duyar.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-8"
              >
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-start space-x-6 p-6 bg-card/50 dark:bg-secondary/50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 bg-primary/10 text-primary p-4 rounded-full">
                      <item.icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <a href={item.href} className="text-lg text-muted-foreground hover:text-primary transition-colors">
                        {item.value}
                      </a>
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-card/50 dark:bg-secondary/50 rounded-xl shadow-lg">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Adınız Soyadınız</Label>
                      <Input id="name" placeholder="Adınız Soyadınız" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta Adresiniz</Label>
                      <Input id="email" type="email" placeholder="ornek@eposta.com" value={formData.email} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Konu</Label>
                    <Input id="subject" placeholder="Mesajınızın konusu" value={formData.subject} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Mesajınız</Label>
                    <Textarea id="message" placeholder="Bize ne söylemek istersiniz?" rows={6} value={formData.message} onChange={handleChange} required />
                  </div>
                  <Button type="submit" className="w-full text-lg py-6" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" /> Mesajı Gönder
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ContactPage;