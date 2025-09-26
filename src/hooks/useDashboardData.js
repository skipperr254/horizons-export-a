import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { getDailyFreeStories } from '@/utils/dailyStorySelector';

export const useDashboardData = (user, navigate, canAccessPremiumFeatures) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const rpcName = canAccessPremiumFeatures ? 'get_stories_with_user_data' : 'get_stories_with_user_data_stable';
      const { data, error } = await supabase
        .rpc(rpcName, { p_user_id: user.id });

      if (error) throw error;
      
      setStories(data || []);

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, canAccessPremiumFeatures]);

  useEffect(() => {
    if (!user) {
      if (navigate) navigate('/login');
      return;
    }

    fetchDashboardData();

    const channel = supabase.channel('stories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, (payload) => {
        fetchDashboardData(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, fetchDashboardData]);
  
  const processedStories = useMemo(() => {
    if (loading) return [];
    if (canAccessPremiumFeatures) {
      return stories.map(s => ({ ...s, is_locked: false, is_premium_placeholder: false }));
    }
    
    const sortedStories = [...stories].sort((a, b) => a.id - b.id);
    const { unlocked, lockedForPreview, premiumPlaceholderStory } = getDailyFreeStories(sortedStories);
    
    const unlockedStories = stories
      .filter(story => unlocked.includes(story.id))
      .map(story => ({ ...story, is_locked: false, is_premium_placeholder: false }));

    const previewLockedStories = stories
      .filter(story => lockedForPreview.includes(story.id))
      .map(story => ({ ...story, is_locked: true, is_preview_locked: true, is_premium_placeholder: false }));
      
    const premiumPlaceholder = premiumPlaceholderStory ? [{
        ...premiumPlaceholderStory,
        id: 'premium-placeholder',
        title: 'Tüm Hikayelere Erişin',
        description: "Premium'a geçerek bu ve diğer tüm hikayelerin kilidini anında açın.",
        is_locked: true,
        is_preview_locked: false,
        is_premium_placeholder: true,
        level: 'all',
        image_url: "https://images.unsplash.com/photo-1593349328409-72c050a4d7e1?q=80&w=2100",
    }] : [];

    return [...unlockedStories, ...previewLockedStories, ...premiumPlaceholder];

  }, [stories, canAccessPremiumFeatures, loading]);


  const readStoryDetails = stories.filter(s => s.is_read);

  return {
    stories: processedStories,
    loading,
    readStoryDetails,
    savedStories: stories.filter(s => s.is_saved),
    refetchDashboardData: fetchDashboardData,
  };
};