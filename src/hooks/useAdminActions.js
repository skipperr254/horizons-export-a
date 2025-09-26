import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

export const useAdminActions = ({
  users,
  setUsers,
  stories,
  setStories,
  testimonials,
  setTestimonials,
  lessons,
  setLessons,
  categories,
  setCategories,
  refetch,
  toast
}) => {
  const [updatingUser, setUpdatingUser] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storyForm, setStoryForm] = useState({ title: '', description: '', level: 'a1', category: 'adventure', read_time: '5 dk', image_url: '', content: '', is_featured: false });
  const [editingStory, setEditingStory] = useState(null);
  const [testimonialForm, setTestimonialForm] = useState({ name: '', comment: '' });
  const [isProcessingTestimonial, setIsProcessingTestimonial] = useState(false);

  const handleCreateUser = async (userData) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: userData,
      });

      if (error) throw new Error(`Fonksiyon çağrısı hatası: ${error.message}`);
      if (data.error) throw new Error(data.error);

      setUsers(prev => [data.user, ...prev].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
      toast({
        title: 'Başarılı!',
        description: `Kullanıcı ${data.user.email} başarıyla oluşturuldu.`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Hata',
        description: `Kullanıcı oluşturulamadı: ${error.message}`,
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleTogglePremium = async (userId, currentStatus) => {
    setUpdatingUser(userId);
    try {
      const { data, error } = await supabase.rpc('manage_user_premium', {
        p_user_id: userId,
        p_premium_status: !currentStatus
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.message);
      
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if(profileError) throw profileError;

      const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);
      if(authUserError) throw authUserError;
      
      const combinedUser = {
        ...authUser.user,
        ...updatedProfile
      };

      setUsers(users.map(u => u.id === userId ? combinedUser : u));
      toast({
        title: 'Başarılı!',
        description: `Kullanıcının premium durumu güncellendi. Yeni durum: ${!currentStatus ? 'Aktif' : 'İptal Edildi'}.`,
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Kullanıcı durumu güncellenemedi: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleRefreshUsers = async () => {
    setIsRefreshing(true);
    await refetch('users');
    setIsRefreshing(false);
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    setUpdatingUser(userId);
    try {
      const { data, error } = await supabase.rpc('update_user_role', {
        p_user_id: userId,
        p_new_role: newRole
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.message);

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({
        title: 'Başarılı!',
        description: 'Kullanıcı rolü güncellendi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Kullanıcı rolü güncellenemedi: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    setUpdatingUser(userId);
    try {
      const { data, error } = await supabase.rpc('delete_user_by_id', { user_id_to_delete: userId });
      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.message);

      setUsers(users.filter(u => u.id !== userId));
      toast({
        title: 'Başarılı!',
        description: 'Kullanıcı başarıyla silindi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Kullanıcı silinemedi: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleStoryAdded = (newStory) => {
    setStories([newStory, ...stories]);
  };

  const handleStoryUpdated = (updatedStory) => {
    setStories(stories.map(s => s.id === updatedStory.id ? updatedStory : s));
  };

  const handleEditStory = (story) => {
    setEditingStory(story);
    setStoryForm({
      title: story.title,
      description: story.description,
      level: story.level,
      category: story.category || 'adventure',
      read_time: story.read_time,
      image_url: story.image_url,
      content: story.content,
      is_featured: story.is_featured || false,
    });
  };

  const handleDeleteStory = async (storyId) => {
    try {
      const { error } = await supabase.from('stories').delete().eq('id', storyId);
      if (error) throw error;
      setStories(stories.filter(s => s.id !== storyId));
      toast({
        title: 'Başarılı!',
        description: 'Hikaye silindi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Hikaye silinemedi: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddTestimonial = async () => {
    if (!testimonialForm.name || !testimonialForm.comment) {
      toast({ title: 'Hata', description: 'İsim ve yorum alanları zorunludur.', variant: 'destructive' });
      return;
    }
    setIsProcessingTestimonial(true);
    try {
      const { data, error } = await supabase.from('testimonials').insert(testimonialForm).select().single();
      if (error) throw error;
      setTestimonials([data, ...testimonials]);
      setTestimonialForm({ name: '', comment: '' });
      toast({ title: 'Başarılı!', description: 'Yorum eklendi.' });
    } catch (error) {
      toast({ title: 'Hata', description: 'Yorum eklenemedi: ' + error.message, variant: 'destructive' });
    } finally {
      setIsProcessingTestimonial(false);
    }
  };

  const handleDeleteTestimonial = async (id) => {
    try {
      const { error } = await supabase.from('testimonials').delete().eq('id', id);
      if (error) throw error;
      setTestimonials(testimonials.filter(t => t.id !== id));
      toast({ title: 'Başarılı!', description: 'Yorum silindi.' });
    } catch (error) {
      toast({ title: 'Hata', description: 'Yorum silinemedi: ' + error.message, variant: 'destructive' });
    }
  };

  const handleAddLesson = useCallback((newLesson) => {
    setLessons(prev => [...prev, newLesson].sort((a, b) => a.position - b.position));
  }, [setLessons]);

  const handleUpdateLesson = useCallback((updatedLesson) => {
    setLessons(prev => prev.map(l => l.id === updatedLesson.id ? updatedLesson : l));
  }, [setLessons]);

  const handleDeleteLesson = useCallback(async (lessonId) => {
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (error) throw error;
    setLessons(prev => prev.filter(l => l.id !== lessonId));
    toast({ title: 'Başarılı!', description: 'Ders silindi.' });
  }, [setLessons, toast]);

  const handleCategoryAdded = useCallback((newCategory) => {
    setCategories(prev => [...prev, newCategory]);
  }, [setCategories]);

  const handleUpdateLessonOrder = useCallback(async (orderedLessons, orderedCategories = null) => {
    let lessonUpdates = [];
    if(orderedLessons) {
      lessonUpdates = orderedLessons.map((lesson, index) => {
        const { created_at, updated_at, ...rest } = lesson;
        return {
          ...rest,
          position: index,
        };
      });
    }
    
    let categoryUpdates = [];
    if(orderedCategories) {
      categoryUpdates = orderedCategories.map((cat, index) => {
        const { created_at, updated_at, lessons, ...rest } = cat;
        return {
          ...rest,
          position: index
        };
      });
    }
    
    try {
      if (lessonUpdates.length > 0) {
        const { error: lessonError } = await supabase.from('lessons').upsert(lessonUpdates);
        if (lessonError) throw lessonError;
      }
      if (categoryUpdates.length > 0) {
        const { error: categoryError } = await supabase.from('lesson_categories').upsert(categoryUpdates);
        if (categoryError) throw categoryError;
      }

      if(lessonUpdates.length > 0 || categoryUpdates.length > 0) {
        toast({ title: 'Başarılı!', description: 'Sıralama güncellendi.' });
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast({ title: 'Hata', description: 'Sıralama güncellenemedi: ' + error.message, variant: 'destructive' });
      if(refetch) refetch();
    }
  }, [toast, refetch]);

  return {
    updatingUser,
    isRefreshing,
    storyForm,
    setStoryForm,
    editingStory,
    setEditingStory,
    testimonialForm,
    setTestimonialForm,
    isProcessingTestimonial,
    handleCreateUser,
    handleTogglePremium,
    handleRefreshUsers,
    handleUpdateUserRole,
    handleDeleteUser,
    handleStoryAdded,
    handleStoryUpdated,
    handleEditStory,
    handleDeleteStory,
    handleAddTestimonial,
    handleDeleteTestimonial,
    handleAddLesson,
    handleUpdateLesson,
    handleDeleteLesson,
    handleCategoryAdded,
    handleUpdateLessonOrder,
  };
};