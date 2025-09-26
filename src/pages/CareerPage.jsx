import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Briefcase, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Seo from '@/components/Seo';
import { supabase } from '@/lib/customSupabaseClient';

const CareerPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const application = {
      name: formData.get('name'),
      email: formData.get('email'),
      position: formData.get('position'),
      resumeUrl: formData.get('resumeUrl'),
      coverLetter: formData.get('coverLetter'),
    };
    
    const emailBody = `
      <h2>Yeni Kariyer Başvurusu</h2>
      <p><strong>İsim:</strong> ${application.name}</p>
      <p><strong>E-posta:</strong> ${application.email}</p>
      <p><strong>İlgilenilen Pozisyon:</strong> ${application.position}</p>
      <p><strong>CV/LinkedIn:</strong> <a href="${application.resumeUrl}">${application.resumeUrl}</a></p>
      <hr>
      <h3>Ön Yazı:</h3>
      <p>${application.coverLetter.replace(/\n/g, '<br>')}</p>
    `;

    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          subject: `Kariyer Başvurusu: ${application.position}`,
          body: emailBody,
          from_name: application.name,
          from_email: application.email,
        }
      });

      if (error) throw error;
      
      toast({
        title: "Başvurunuz Alındı!",
        description: "İnceleyip en kısa sürede size geri dönüş yapacağız. İlginiz için teşekkürler!",
      });
      e.target.reset();
    } catch (error) {
      console.error('Career submission error:', error);
      toast({
        title: "Hata!",
        description: "Başvurunuz gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Seo
        title="Kariyer"
        description="HikayeGO ekibine katılın. Açık pozisyonları inceleyin ve dil öğreniminin geleceğini şekillendirmemize yardımcı olun."
        url="/career"
      />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto py-16 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Briefcase className="h-16 w-16 mx-auto text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="gradient-text">Ekibimize</span> Katılın
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              Dil öğrenimini yeniden şekillendirme misyonumuza ortak olacak tutkulu yetenekler arıyoruz.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-3xl mx-auto mt-12"
          >
            <Card>
              <CardHeader>
                <CardTitle>Genel Başvuru</CardTitle>
                <CardDescription>Size uygun bir pozisyon bulamadıysanız, genel başvuru formunu doldurarak bizimle iletişime geçebilirsiniz.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Adınız Soyadınız</Label>
                      <Input id="name" name="name" required disabled={loading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta Adresiniz</Label>
                      <Input id="email" name="email" type="email" required disabled={loading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">İlgilendiğiniz Pozisyon</Label>
                    <Input id="position" name="position" placeholder="Örn: Frontend Developer, Content Creator" required disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resumeUrl">CV/LinkedIn URL</Label>
                    <Input id="resumeUrl" name="resumeUrl" type="url" placeholder="https://..." required disabled={loading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coverLetter">Neden Biz?</Label>
                    <Textarea id="coverLetter" name="coverLetter" rows={5} placeholder="Bize kendinizden ve neden HikayeGO'da çalışmak istediğinizden bahsedin." required disabled={loading} />
                  </div>
                  <Button type="submit" className="w-full btn-glow" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : 'Başvuruyu Gönder'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default CareerPage;