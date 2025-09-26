import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, BookOpenText, Crown, TrendingUp } from 'lucide-react';
import SectionHeader from '@/components/home/SectionHeader';

const steps = [
  {
    icon: UserPlus,
    title: 'Hesap Oluşturun',
    description: 'Saniyeler içinde ücretsiz kaydolarak veya sosyal medya hesaplarınızı kullanarak HikayeGO dünyasına ilk adımı atın.',
  },
  {
    icon: BookOpenText,
    title: 'Keşfedin ve Okuyun',
    description: "İngilizce seviyenize uygun yüzlerce hikaye arasından dilediğinizi seçin. Bilmediğiniz kelimelere dokunarak anında anlamını öğrenin.",
  },
  {
    icon: Crown,
    title: "Premium'a Geçin",
    description: "Premium'a geçerek tüm hikayelere, sesli okuma özelliğine ve reklamsız arayüze sınırsız erişim kazanın.",
  },
  {
    icon: TrendingUp,
    title: 'Öğrenin ve Gelişin',
    description: "Her gün yeni bir hikaye okuyun, kelime testleri çözün ve kişisel kelime listenizi tekrar ederek İngilizce'nizi akıcı hale getirin.",
  },
];

const cardVariants = {
  offscreen: {
    y: 50,
    opacity: 0,
  },
  onscreen: (i) => ({
    y: 0,
    opacity: 1,
    transition: {
      type: "tween",
      ease: "easeOut",
      duration: 0.6,
      delay: i * 0.1,
    },
  }),
};

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-background -z-10"></div>
      
      <div className="container mx-auto px-4">
        <SectionHeader 
          title="Nasıl Çalışır?" 
          subtitle="Öğrenme yolculuğunuz sadece 4 basit adımdan oluşuyor."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              custom={index}
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.4 }}
              variants={cardVariants}
              whileHover={{ y: -8, transition: { type: 'tween', ease: 'easeOut', duration: 0.3 } }}
              className="relative p-0.5 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-transparent h-full transition-all duration-300 hover:from-primary/40"
            >
              <div className="relative p-6 h-full rounded-[14px] overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-lg hover:shadow-primary/10 dark:hover:shadow-primary/10 border border-white/20 dark:border-slate-800/50 transition-shadow duration-300">
                <div className="absolute -top-2 -right-2 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-2xl"></div>
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <motion.div 
                      className="p-3 rounded-lg bg-primary/10"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <step.icon className="h-7 w-7 text-primary" />
                    </motion.div>
                    <span className="text-7xl font-bold text-slate-200/80 dark:text-slate-700/80 -mt-2">
                      {`0${index + 1}`}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;