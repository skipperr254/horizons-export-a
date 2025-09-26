import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Instagram, Facebook } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import NewsletterSignup from '@/components/NewsletterSignup';

const Footer = React.memo(() => {
  const platformLinks = [
    { name: 'Panel', path: '/dashboard' },
    { name: 'Aktiviteler', path: '/activities' },
    { name: 'Kayıtlı Hikayeler', path: '/saved-stories' },
    { name: 'Quiz', path: '/quiz/setup' },
  ];

  const companyLinks = [
    { name: 'Hakkımızda', path: '/about' },
    { name: 'Blog', path: '/blog' },
    { name: 'Kariyer', path: '/career' },
    { name: 'İletişim', path: '/contact' },
  ];

  const resourcesLinks = [
    { name: 'Yardım Merkezi', path: '/help-center' },
    { name: 'Topluluk', path: '/community' },
  ];

  const legalLinks = [
    { name: 'Kullanım Koşulları', path: '/terms-of-service' },
    { name: 'Gizlilik Politikası', path: '/privacy-policy' },
    { name: 'Çerez Politikası', path: '/cookie-policy' },
  ];

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/hikayego', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com/hikayego', label: 'Instagram' },
    { icon: Linkedin, href: 'https://linkedin.com/company/hikayego', label: 'LinkedIn' },
    { icon: Facebook, href: 'https://facebook.com/hikayego', label: 'Facebook' },
  ];

  return (
    <footer className="bg-background text-foreground border-t border-border/50">
      <div className="container mx-auto px-6 py-12">
        
        <NewsletterSignup />

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <Link to="/" className="inline-flex items-center space-x-2 mb-4 group">
              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }}>
                <Logo className="w-40" />
              </motion.div>
            </Link>
            <p className="text-muted-foreground mt-4 max-w-xs">
              Hikayelerle İngilizce öğrenin. Her seviyeye uygun sürükleyici hikayelerle dil becerilerinizi geliştirin.
            </p>
            <div className="flex mt-6 space-x-5">
              {socialLinks.map((social, index) => (
                <motion.a 
                  key={index} 
                  href={social.href} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  aria-label={social.label} 
                  className="text-muted-foreground hover:text-primary transition-colors"
                  whileHover={{ scale: 1.2, rotate: -10 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <social.icon className="h-6 w-6" />
                </motion.a>
              ))}
            </div>
          </div>
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold tracking-wider uppercase">Platform</h3>
              <ul className="mt-4 space-y-3">
                {platformLinks.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold tracking-wider uppercase">Şirket</h3>
              <ul className="mt-4 space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold tracking-wider uppercase">Kaynaklar</h3>
              <ul className="mt-4 space-y-3">
                {resourcesLinks.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold tracking-wider uppercase">Yasal</h3>
              <ul className="mt-4 space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.name}>
                    <Link to={link.path} className="text-muted-foreground hover:text-primary transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border/50 text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-center md:text-left">
            &copy; {new Date().getFullYear()} HikayeGO. Tüm hakları saklıdır.
          </p>
          <p className="text-center md:text-right">
            Mustafa BAYRAK tarafından tasarlandı.
          </p>
        </div>
      </div>
    </footer>
  );
});

export default Footer;