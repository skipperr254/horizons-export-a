import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useStoryData = (slug, user, navigate) => {
  const { canAccessPremiumFeatures } = useAuth();
  const [story, setStory] = useState(null);
  const [storySections, setStorySections] = useState([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isRead, setIsRead] = useState(false);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const storySlugRef = useRef(null);
  const userIdRef = useRef(null);
  const storyIdRef = useRef(null);

  const fetchStoryData = useCallback(async () => {
    if (!slug || !user) return;
    
    setLoading(true);
    try {
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*, story_ratings(rating, user_id)')
        .eq('slug', slug)
        .single();
      
      if (storyError || !storyData) {
        console.error('Story fetch failed:', storyError);
        toast({ title: "Hikaye bulunamadı", description: "Aradığınız hikaye mevcut değil veya URL yanlış.", variant: "destructive" });
        if (navigate) navigate('/dashboard');
        return;
      }
      
      storyIdRef.current = storyData.id;
      setStory(storyData);
      setLoading(false); // Stop loading after essential data is fetched

      // Fetch non-critical data in the background
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('story_sections')
        .select('id, content, audio_url, section_order, word_timings')
        .eq('story_id', storyData.id)
        .order('section_order', { ascending: true });

      if (sectionsError) {
        console.error('Story sections fetch failed:', sectionsError);
      } else if (sectionsData) {
        setStorySections(sectionsData);
      }

      const [savedResult, readResult] = await Promise.allSettled([
        supabase
          .from('user_saved_stories')
          .select('story_id')
          .eq('user_id', user.id)
          .eq('story_id', storyData.id)
          .maybeSingle(),
        supabase
          .from('user_read_stories')
          .select('story_id')
          .eq('user_id', user.id)
          .eq('story_id', storyData.id)
          .maybeSingle(),
      ]);

      setIsSaved(savedResult.status === 'fulfilled' && !!savedResult.value.data);
      setIsRead(readResult.status === 'fulfilled' && !!readResult.value.data);

      try {
        const progressData = localStorage.getItem(`story_progress_${user.id}_${storyData.id}`);
        setProgress(progressData ? JSON.parse(progressData) : null);
      } catch (e) {
        console.error("Failed to read progress from localStorage", e);
        setProgress(null);
      }

    } catch (error) {
      console.error('Story data fetch error:', error);
      setStory(null);
      setStorySections([]);
      setIsSaved(false);
      setIsRead(false);
      setProgress(null);
      setLoading(false);
      toast({ title: "Hata", description: "Hikaye verileri yüklenirken bir sorun oluştu.", variant: "destructive" });
      if (navigate) navigate('/dashboard');
    }
  }, [slug, user, navigate, toast]);

  useEffect(() => {
    if (!user) {
      if (navigate) navigate('/login');
      return;
    }
    if (slug !== storySlugRef.current || user.id !== userIdRef.current) {
      storySlugRef.current = slug;
      userIdRef.current = user.id;
      fetchStoryData();
    }
  }, [slug, user, navigate, fetchStoryData]);

  const toggleSaveStory = async () => {
    const storyId = storyIdRef.current;
    if (!storyId) return;

    if (!canAccessPremiumFeatures) {
      return { requiresPremium: true };
    }
    try {
      if (isSaved) {
        await supabase.from('user_saved_stories').delete().match({ user_id: user.id, story_id: storyId });
        setIsSaved(false);
        toast({ title: "Hikaye kaldırıldı", description: "Hikaye kayıtlı listesinden çıkarıldı." });
      } else {
        await supabase.from('user_saved_stories').insert({ user_id: user.id, story_id: storyId, saved_at: new Date().toISOString() });
        setIsSaved(true);
        toast({ title: "Hikaye kaydedildi!", description: "Bu hikayeyi Kütüphane'nde bulabilirsin." });
      }
    } catch (error) {
      console.error('Error toggling save story:', error);
      toast({ title: "Hata", description: "İşlem sırasında bir hata oluştu.", variant: "destructive" });
    }
  };

  const toggleReadStatus = async () => {
    const storyId = storyIdRef.current;
    if (!storyId) return;
    try {
      if (isRead) {
        await supabase.from('user_read_stories').delete().match({ user_id: user.id, story_id: storyId });
        setIsRead(false);
        toast({ title: "Okundu işareti kaldırıldı", description: "Hikaye okunmadı olarak işaretlendi." });
      } else {
        await supabase.from('user_read_stories').insert({ user_id: user.id, story_id: storyId, read_at: new Date().toISOString() });
        setIsRead(true);
        toast({ title: "Hikaye okundu! 🎉", description: "Tebrikler! Bir hikayeyi daha tamamladın." });
      }
    } catch (error) {
      console.error('Error toggling read status:', error);
      toast({ title: "Hata", description: "İşlem sırasında bir hata oluştu.", variant: "destructive" });
    }
  };

  return { story, storySections, isSaved, isRead, progress, loading, toggleSaveStory, toggleReadStatus };
};