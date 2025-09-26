import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Rss, Loader2 } from 'lucide-react';
import Seo from '@/components/Seo';
import { supabase } from '@/lib/customSupabaseClient';
import { Link } from 'react-router-dom';

const BlogPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultImage = 'https://horizons-cdn.hostinger.com/47ed419b-a823-468d-9e6e-80c8442792f0/f557009055158d9ee5d06d3a4010e832.png';

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching blog posts:', error);
      } else {
        setPosts(data);
      }
      setLoading(false);
    };

    fetchPosts();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut'
      }
    }
  };

  return (
    <>
      <Seo
        title="Blog"
        description="Dil öğrenimi, etkili çalışma teknikleri ve HikayeGO'dan haberler hakkında en son makaleler."
        url="/blog"
        keywords="ingilizce öğrenme blog, dil ipuçları, hikayego blog"
        image="https://horizons-cdn.hostinger.com/47ed419b-a823-468d-9e6e-80c8442792f0/366922a31d1e46225d596c04907118d5.jpg"
      />
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-grow">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative bg-secondary/30 pt-24 pb-12 text-center overflow-hidden"
          >
            <div className="absolute inset-0">
              <img src="https://horizons-cdn.hostinger.com/47ed419b-a823-468d-9e6e-80c8442792f0/366922a31d1e46225d596c04907118d5.jpg" alt="Blog hero" className="w-full h-full object-cover opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"></div>
            </div>
            <div className="container mx-auto px-6 relative">
              <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                <Rss className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                HikayeGO <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-transparent bg-clip-text">Blog</span>
              </h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                Dil öğrenimi yolculuğunuzda size ilham verecek ipuçları, hikayeler ve güncellemeler.
              </p>
            </div>
          </motion.div>

          <div className="container mx-auto py-16 px-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : posts.length > 0 ? (
              <motion.div
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    variants={itemVariants}
                    className="h-full"
                  >
                    <Link to={`/blog/${post.slug}`} className="block h-full group">
                      <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/10 group-hover:-translate-y-2 border-border/50 flex flex-col">
                        <CardHeader className="p-0">
                          <div className="aspect-[16/9] overflow-hidden">
                            <motion.img
                              alt={post.title}
                              className="w-full h-full object-cover"
                              src={post.image_url || defaultImage}
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 flex flex-col justify-between flex-grow">
                          <div>
                            <CardTitle className="mb-2 text-xl line-clamp-2">{post.title}</CardTitle>
                            <CardDescription className="mb-4 line-clamp-3">{post.excerpt}</CardDescription>
                          </div>
                          <div className="text-sm text-muted-foreground mt-4">
                            <span>{post.author_name}</span> &bull; <span>{new Date(post.published_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
               <div className="text-center py-16">
                  <h2 className="text-2xl font-semibold text-foreground">Henüz Blog Yazısı Yok</h2>
                  <p className="mt-2 text-muted-foreground">Yakında burada ilham verici içerikler bulacaksınız!</p>
                </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BlogPage;