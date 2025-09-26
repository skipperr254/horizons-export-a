import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Loader2, Zap, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import Seo from '@/components/Seo';

const QuizSetupPage = () => {
    const { user, canAccessPremiumFeatures } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [categories, setCategories] = useState([]);
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedCategory, setSelectedCategory] = useState('all');
    const [questionCount, setQuestionCount] = useState(10);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const fetchPromises = [
                    supabase
                        .from('user_saved_words')
                        .select('id, word, translation, category_id, added_at')
                        .eq('user_id', user.id)
                        .order('added_at', { ascending: false })
                ];

                if (canAccessPremiumFeatures) {
                    fetchPromises.push(
                        supabase
                            .from('word_categories')
                            .select('*')
                            .eq('user_id', user.id)
                    );
                }

                const [wordsResult, categoriesResult] = await Promise.all(fetchPromises);

                if (wordsResult.error) throw wordsResult.error;
                setWords(wordsResult.data || []);

                if (canAccessPremiumFeatures && categoriesResult) {
                    if (categoriesResult.error) throw categoriesResult.error;
                    setCategories(categoriesResult.data || []);
                }

            } catch (error) {
                console.error('Error fetching data for quiz setup:', error);
                toast({
                    title: "Hata",
                    description: "Quiz verileri yüklenirken bir hata oluştu.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, navigate, toast, canAccessPremiumFeatures]);

    const handleStartQuiz = () => {
        let wordsForQuizPool;

        if (canAccessPremiumFeatures) {
            if (selectedCategory !== 'all') {
                wordsForQuizPool = words.filter(word => word.category_id === parseInt(selectedCategory));
            } else {
                wordsForQuizPool = words;
            }
        } else {
            // For non-premium users, only use the latest 10 words, ignore categories.
            wordsForQuizPool = words.slice(0, 10);
        }

        if (wordsForQuizPool.length < 4) {
            toast({
                title: "Yetersiz kelime",
                description: `Quiz için en az 4 kelime gereklidir. Mevcut uygun kelime sayısı: ${wordsForQuizPool.length}.`,
                variant: "destructive",
            });
            return;
        }

        const finalQuestionCount = canAccessPremiumFeatures
            ? Math.min(wordsForQuizPool.length, questionCount)
            : Math.min(wordsForQuizPool.length, 10);
        
        const quizWords = [...wordsForQuizPool].sort(() => 0.5 - Math.random()).slice(0, finalQuestionCount);

        // Pass all words for generating wrong options, but only quizWords for questions
        navigate('/quiz', { state: { words: quizWords, allWords: words } });
    };
    
    const wordsInSelectedCategory = canAccessPremiumFeatures 
        ? (selectedCategory === 'all' 
            ? words.length 
            : words.filter(w => w.category_id === parseInt(selectedCategory)).length)
        : words.slice(0, 10).length;

    if (loading) {
        return (
            <div className="min-h-screen bg-secondary">
                <div className="container mx-auto py-16 px-6 text-center">
                    <Loader2 className="h-16 w-16 mx-auto text-primary mb-4 animate-spin" />
                    <h2 className="text-2xl font-bold mb-4">Quiz ayarları yükleniyor...</h2>
                </div>
            </div>
        );
    }
    
    return (
        <>
            <Seo
                title="Quiz Ayarları"
                description="İngilizce kelime bilginizi test etmek için quiz ayarlarınızı yapın ve hemen başlayın."
                url="/quiz/setup"
                keywords="İngilizce quiz başlat, kelime testi ayarları, dil öğrenme quizi"
            />
            <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-background">
                <div className="container mx-auto max-w-2xl py-8 sm:py-12 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5, type: 'spring' }}
                    >
                        <Card className="shadow-2xl bg-card/70 backdrop-blur-sm border-border/20">
                            <CardHeader className="text-center p-6 sm:p-8">
                                <motion.div
                                  animate={{ scale: [1, 1.1, 1], color: ["#8B5CF6", "#EC4899", "#8B5CF6"] }}
                                  transition={{ duration: 3, repeat: Infinity }}
                                >
                                  <Zap className="mx-auto h-12 w-12 text-primary mb-4" />
                                </motion.div>
                                <CardTitle className="text-2xl sm:text-3xl font-bold">Quiz'e Hazırlan</CardTitle>
                                <CardDescription className="text-base sm:text-lg text-muted-foreground">
                                    Bilgini test etmek için ayarlarını seç ve başla!
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 p-6 sm:p-8">
                                {canAccessPremiumFeatures && (
                                    <div className="space-y-4">
                                        <Label htmlFor="category-select" className="text-base sm:text-lg font-semibold">Kelime Listesi Seç</Label>
                                        <Select onValueChange={setSelectedCategory} defaultValue={selectedCategory}>
                                            <SelectTrigger id="category-select" className="h-12 text-base">
                                                <SelectValue placeholder="Bir liste seçin..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Tüm Kayıtlı Kelimeler ({words.length})</SelectItem>
                                                {categories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                                        {cat.name} ({words.filter(w => w.category_id === cat.id).length})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="question-count" className="text-base sm:text-lg font-semibold">Soru Sayısı</Label>
                                        {!canAccessPremiumFeatures && (
                                            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                                <Crown className="h-4 w-4" />
                                                <span>Premium Özellik</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Slider
                                            id="question-count"
                                            min={5}
                                            max={Math.max(5, Math.min(50, wordsInSelectedCategory))}
                                            step={5}
                                            value={[questionCount]}
                                            onValueChange={(value) => setQuestionCount(value[0])}
                                            disabled={!canAccessPremiumFeatures || wordsInSelectedCategory < 5}
                                        />
                                        <span className="font-bold text-base sm:text-lg w-12 text-center">{canAccessPremiumFeatures ? questionCount : '10'}</span>
                                    </div>
                                    {!canAccessPremiumFeatures && (
                                        <p className="text-sm text-muted-foreground">
                                            Ücretsiz üyeler için quiz'ler en fazla 10 soru ile sınırlıdır. Daha fazlası için <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/subscription')}>Premium'a geçin</Button>.
                                        </p>
                                    )}
                                    {canAccessPremiumFeatures && wordsInSelectedCategory < 5 && (
                                        <p className="text-sm text-destructive">
                                           Bu listede quiz için yeterli kelime yok. (En az 5)
                                        </p>
                                    )}
                                </div>
                                
                                <Button size="lg" className="w-full h-12 sm:h-14 text-lg sm:text-xl" onClick={handleStartQuiz} disabled={wordsInSelectedCategory < 4}>
                                    <Zap className="mr-2 h-5 sm:h-6 sm:w-6" />
                                    Quiz'i Başlat
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default QuizSetupPage;