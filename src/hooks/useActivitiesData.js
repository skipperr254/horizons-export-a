import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useActivitiesData = (user, canAccessPremiumFeatures, navigate) => {
  const [words, setWords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    wordsLearned: 0,
    quizzesCompleted: 0,
    storiesRead: 0,
    progressPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);
  const userIdRef = useRef(null);

  const fetchActivitiesData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const fetchPromises = [
        supabase.from('user_saved_words').select('*, word_categories(name, color)', { count: 'exact' }).eq('user_id', user.id).order('added_at', { ascending: false }),
        supabase.from('user_quiz_attempts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('user_read_stories').select('story_id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('stories').select('id', { count: 'exact', head: true })
      ];

      if (canAccessPremiumFeatures) {
        fetchPromises.push(
          supabase.from('word_categories').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        );
      }

      const results = await Promise.all(fetchPromises);

      const [wordsResult, quizAttemptsResult, readStoriesResult, totalStoriesResult, categoriesResult] = results;

      if (wordsResult.error) throw wordsResult.error;
      
      let fetchedWords = wordsResult.data || [];
      if (!canAccessPremiumFeatures) {
        setWords(fetchedWords.slice(0, 10));
      } else {
        setWords(fetchedWords);
      }
      
      if (canAccessPremiumFeatures && categoriesResult) {
        if (categoriesResult.error) throw categoriesResult.error;
        setCategories(categoriesResult.data || []);
      } else {
        setCategories([]);
      }
      
      const quizzesCompleted = quizAttemptsResult.count || 0;
      const storiesRead = readStoriesResult.count || 0;
      const totalStories = totalStoriesResult.count || 0;
      const progressPercentage = totalStories > 0 ? Math.round((storiesRead / totalStories) * 100) : 0;
      const wordsCount = wordsResult.count || 0;

      setStats({
        wordsLearned: wordsCount,
        quizzesCompleted,
        storiesRead,
        progressPercentage,
      });

    } catch (error) {
      console.error('Activities data fetch error:', error);
      setWords([]);
      setCategories([]);
      setStats({ wordsLearned: 0, quizzesCompleted: 0, storiesRead: 0, progressPercentage: 0 });
    } finally {
      setLoading(false);
    }
  }, [user?.id, canAccessPremiumFeatures]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.id !== userIdRef.current || !fetchedRef.current) {
      userIdRef.current = user.id;
      fetchedRef.current = true;
      fetchActivitiesData();
    }
  }, [user, navigate, fetchActivitiesData]);

  return {
    words,
    setWords,
    categories,
    setCategories,
    stats,
    loading,
    fetchActivitiesData
  };
};