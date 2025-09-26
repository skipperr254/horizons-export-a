import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Search, Calendar, ArrowDownAZ, ArrowUpAZ, Video, BookOpen, CheckCircle, BrainCircuit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActivitiesData } from '@/hooks/useActivitiesData';
import { supabase } from '@/lib/customSupabaseClient';
import CategoryManager from '@/components/activities/CategoryManager';
import QuizSection from '@/components/activities/QuizSection';
import WordGrid from '@/components/activities/WordGrid';
import EmptyWordState from '@/components/activities/EmptyWordState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ActivitiesPageSkeleton from '@/components/activities/skeletons/ActivitiesPageSkeleton';
import { AnimatePresence, motion } from 'framer-motion';
import Seo from '@/components/Seo';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';


const WORDS_PER_PAGE = 24;

const ActivitiesPage = () => {
  const { user, canAccessPremiumFeatures } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [lessonStats, setLessonStats] = useState({ completed: 0, total: 0 });

  const {
    words,
    setWords,
    categories,
    setCategories,
    stats,
    loading,
    fetchActivitiesData
  } = useActivitiesData(user, canAccessPremiumFeatures, navigate);

  const fetchLessonStats = useCallback(async () => {
    if (!user) return;
    try {
      const [progressRes, totalRes] = await Promise.all([
        supabase.from('user_lesson_progress').select('lesson_id', { count: 'exact' }).eq('user_id', user.id).eq('completed', true),
        supabase.from('lessons').select('id', { count: 'exact' })
      ]);
      if (progressRes.error || totalRes.error) {
        throw progressRes.error || totalRes.error;
      }
      setLessonStats({ completed: progressRes.count, total: totalRes.count });
    } catch (error) {
      console.error("Error fetching lesson stats:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchActivitiesData();
      fetchLessonStats();
    }
  }, [canAccessPremiumFeatures, user, fetchActivitiesData, fetchLessonStats]);

  const allStats = useMemo(() => ({
    ...stats,
    lessonsCompleted: lessonStats.completed,
    totalLessons: lessonStats.total,
  }), [stats, lessonStats]);

  const filteredAndSortedWords = useMemo(() => {
    let filtered = words.filter(word => {
      const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           word.translation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || word.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    switch (sortOrder) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.added_at) - new Date(b.added_at));
        break;
      case 'az':
        filtered.sort((a, b) => a.word.localeCompare(b.word));
        break;
      case 'za':
        filtered.sort((a, b) => b.word.localeCompare(a.word));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
        break;
    }

    return filtered;
  }, [words, searchTerm, selectedCategory, sortOrder]);

  const paginatedWords = useMemo(() => {
    const indexOfLastWord = currentPage * WORDS_PER_PAGE;
    const indexOfFirstWord = indexOfLastWord - WORDS_PER_PAGE;
    return filteredAndSortedWords.slice(indexOfFirstWord, indexOfLastWord);
  }, [filteredAndSortedWords, currentPage]);
  
  const totalPages = Math.ceil(filteredAndSortedWords.length / WORDS_PER_PAGE);

  const deleteWord = useCallback(async (wordId) => {
    try {
      const { error } = await supabase
        .from('user_saved_words')
        .delete()
        .eq('id', wordId)
        .eq('user_id', user.id);
      if (error) throw error;
      setWords(currentWords => currentWords.filter(word => word.id !== wordId));
      toast({
        title: "Kelime silindi",
        description: "Kelime koleksiyonunuzdan kaldırıldı.",
      });
    } catch (error) {
      console.error('Error deleting word:', error);
      toast({
        title: "Hata",
        description: `Kelime silinirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    }
  }, [user, setWords, toast]);

  const startQuiz = useCallback(() => {
    navigate('/quiz/setup');
  }, [navigate]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }, []);
  
  const renderPagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      if (currentPage > halfPagesToShow + 2) {
        pageNumbers.push('...');
      }

      let start = Math.max(2, currentPage - halfPagesToShow);
      let end = Math.min(totalPages - 1, currentPage + halfPagesToShow);
      
      if (currentPage <= halfPagesToShow + 1) {
        end = maxPagesToShow;
      }
      
      if (currentPage >= totalPages - halfPagesToShow) {
        start = totalPages - maxPagesToShow + 1;
      }

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (currentPage < totalPages - halfPagesToShow - 1) {
        pageNumbers.push('...');
      }
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers.map((page, index) => (
      <PaginationItem key={`${page}-${index}`}>
        {typeof page === 'number' ? (
          <PaginationLink 
            href="#" 
            onClick={(e) => { e.preventDefault(); handlePageChange(page); }} 
            isActive={currentPage === page}
          >
            {page}
          </PaginationLink>
        ) : (
          <PaginationEllipsis />
        )}
      </PaginationItem>
    ));
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-secondary">
        <ActivitiesPageSkeleton />
      </div>
    );
  }

  const statCards = [
    { icon: BrainCircuit, label: "Öğrenilen Kelime", value: allStats.wordsLearned, color: "from-blue-400 to-cyan-400", iconColor: "text-blue-100" },
    { icon: CheckCircle, label: "Tamamlanan Quiz", value: allStats.quizzesCompleted, color: "from-green-400 to-emerald-400", iconColor: "text-green-100" },
    { icon: BookOpen, label: "Okunan Hikaye", value: allStats.storiesRead, color: "from-purple-400 to-pink-400", iconColor: "text-purple-100" },
    { icon: Video, label: "İzlenen Ders", value: allStats.lessonsCompleted, color: "from-red-400 to-rose-400", iconColor: "text-red-100" },
  ];

  return (
    <>
      <Seo
        title="Aktivitelerim"
        description="İngilizce öğrenme gelişiminizi takip edin. Kaydettiğiniz kelimeleri yönetin, quizlerle pratik yapın ve öğrenme istatistiklerinizi görün."
        url="/activities"
        keywords="İngilizce kelime pratiği, kelime ezberleme, İngilizce quiz, dil öğrenme takibi"
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-background">
        <div className="container mx-auto py-6 px-4 md:px-6 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Aktivitelerim
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              İlerlemeni takip et, kelimelerini yönet ve bilgilerini sına!
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.03, y: -5 }}
              >
                <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.color} text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl`}>
                  <div className="absolute -top-8 -right-8 w-24 h-24 opacity-20">
                    <stat.icon className="w-full h-full" />
                  </div>
                  <CardContent className="relative z-10 p-4">
                    <p className="text-sm font-medium text-white/90 mb-2">{stat.label}</p>
                    <p className="text-3xl md:text-4xl font-bold text-white">{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <QuizSection 
            onStartQuiz={startQuiz}
            selectedCategory={selectedCategory}
            categories={categories}
          />
          
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-8">
              <CategoryManager
                user={user}
                categories={categories}
                setCategories={setCategories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                canAccessPremiumFeatures={canAccessPremiumFeatures}
              />
            </div>

            <div className="lg:col-span-8">
              <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-card/70 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <CardTitle className="text-2xl">Kayıtlı Kelimeler</CardTitle>
                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                      <div className="relative w-full md:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Kelime ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 h-12 text-base md:h-10 md:text-sm"
                        />
                      </div>
                      <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-full md:w-[180px] h-12 text-base md:text-sm">
                          <SelectValue placeholder="Sırala" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest" className="py-2 text-base md:text-sm"><div className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> En Yeni</div></SelectItem>
                          <SelectItem value="oldest" className="py-2 text-base md:text-sm"><div className="flex items-center"><Calendar className="mr-2 h-4 w-4" /> En Eski</div></SelectItem>
                          <SelectItem value="az" className="py-2 text-base md:text-sm"><div className="flex items-center"><ArrowDownAZ className="mr-2 h-4 w-4" /> A-Z</div></SelectItem>
                          <SelectItem value="za" className="py-2 text-base md:text-sm"><div className="flex items-center"><ArrowUpAZ className="mr-2 h-4 w-4" /> Z-A</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {filteredAndSortedWords.length > 0 ? (
                      <>
                        <WordGrid
                          words={paginatedWords}
                          setWords={setWords}
                          categories={categories}
                          user={user}
                          onDeleteWord={deleteWord}
                        />
                        {totalPages > 1 && (
                            <Pagination className="mt-8">
                                <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} disabled={currentPage === 1} />
                                </PaginationItem>
                                {renderPagination()}
                                <PaginationItem>
                                    <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} disabled={currentPage === totalPages} />
                                </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        )}
                      </>
                    ) : (
                      <EmptyWordState searchTerm={searchTerm} />
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ActivitiesPage;