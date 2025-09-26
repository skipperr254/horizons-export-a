import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Shield } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminActions } from '@/hooks/useAdminActions';
import { useAuth } from '@/contexts/AuthContext';
import Seo from '@/components/Seo';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminStats from '@/components/admin/AdminStats';

const UserManagement = lazy(() => import('@/components/admin/UserManagement'));
const StoryManagement = lazy(() => import('@/components/admin/StoryManagement'));
const BlogManagement = lazy(() => import('@/components/admin/BlogManagement'));
const TestimonialManagement = lazy(() => import('@/components/admin/TestimonialManagement'));
const AdminSettings = lazy(() => import('@/components/admin/AdminSettings'));
const LessonManagement = lazy(() => import('@/components/admin/LessonManagement'));

const AdminPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isAdmin = user && user.role === 'admin';
  const isContentCreator = user && user.role === 'content_creator';

  const [activeView, setActiveView] = useState(isAdmin ? 'users' : 'stories');

  useEffect(() => {
    if (user) {
      setActiveView(user.role === 'admin' ? 'users' : 'stories');
    }
  }, [user]);

  const {
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
    loading,
    refetch
  } = useAdminData(user);

  const {
    handleTogglePremium,
    handleRefreshUsers,
    handleUpdateUserRole,
    handleDeleteUser,
    handleCreateUser,
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
    updatingUser,
    isRefreshing,
    storyForm,
    setStoryForm,
    editingStory,
    setEditingStory,
    testimonialForm,
    setTestimonialForm,
    isProcessingTestimonial
  } = useAdminActions({
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
  });
  
  const renderContent = () => {
    const suspenseFallback = <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    if (isContentCreator) {
        switch (activeView) {
            case 'stories':
                return <Suspense fallback={suspenseFallback}><StoryManagement stories={stories} storyForm={storyForm} setStoryForm={setStoryForm} editingStory={editingStory} setEditingStory={setEditingStory} onStoryAdded={handleStoryAdded} onStoryUpdated={handleStoryUpdated} onEditStory={handleEditStory} onDeleteStory={handleDeleteStory} /></Suspense>;
            case 'blog':
                return <Suspense fallback={suspenseFallback}><BlogManagement /></Suspense>;
            default:
                return null;
        }
    }

    if (isAdmin) {
        switch (activeView) {
          case 'users':
            return <Suspense fallback={suspenseFallback}><UserManagement users={users} onTogglePremium={handleTogglePremium} onUpdateRole={handleUpdateUserRole} onDeleteUser={handleDeleteUser} onCreateUser={handleCreateUser} updatingUser={updatingUser} onRefresh={handleRefreshUsers} isRefreshing={isRefreshing} /></Suspense>;
          case 'stories':
            return <Suspense fallback={suspenseFallback}><StoryManagement stories={stories} storyForm={storyForm} setStoryForm={setStoryForm} editingStory={editingStory} setEditingStory={setEditingStory} onStoryAdded={handleStoryAdded} onStoryUpdated={handleStoryUpdated} onEditStory={handleEditStory} onDeleteStory={handleDeleteStory} /></Suspense>;
          case 'blog':
            return <Suspense fallback={suspenseFallback}><BlogManagement /></Suspense>;
          case 'lessons':
            return <Suspense fallback={suspenseFallback}><LessonManagement lessons={lessons} categories={categories} onAddLesson={handleAddLesson} onUpdateLesson={handleUpdateLesson} onDeleteLesson={handleDeleteLesson} onCategoryAdded={handleCategoryAdded} onUpdateLessonOrder={handleUpdateLessonOrder} /></Suspense>;
          case 'testimonials':
            return <Suspense fallback={suspenseFallback}><TestimonialManagement testimonials={testimonials} testimonialForm={testimonialForm} setTestimonialForm={setTestimonialForm} onAddTestimonial={handleAddTestimonial} onDeleteTestimonial={handleDeleteTestimonial} isProcessing={isProcessingTestimonial} /></Suspense>;
          case 'settings':
            return <Suspense fallback={suspenseFallback}><AdminSettings /></Suspense>;
          default:
            return <Suspense fallback={suspenseFallback}><UserManagement users={users} onTogglePremium={handleTogglePremium} onUpdateRole={handleUpdateUserRole} onDeleteUser={handleDeleteUser} onCreateUser={handleCreateUser} updatingUser={updatingUser} onRefresh={handleRefreshUsers} isRefreshing={isRefreshing} /></Suspense>;
        }
    }
    
    return null;
  };
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Admin paneli yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo
        title="Yönetim Paneli"
        description="HikayeGO admin paneli. Kullanıcıları, hikayeleri, dersleri ve diğer site içeriklerini yönetin."
        url="/admin"
        keywords="admin paneli, kullanıcı yönetimi, içerik yönetimi"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
            <AdminSidebar activeView={activeView} setActiveView={setActiveView} />
            <main>
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center">
                  <Shield className="mr-3 h-8 w-8 text-primary" />
                  Yönetim Paneli
                </h1>
                <p className="text-lg text-muted-foreground">
                  {isAdmin ? 'Kullanıcıları, hikayeleri ve içerikleri yönetin' : 'Hikaye ve blog yazılarını yönetin'}
                </p>
              </div>
              {isAdmin && <AdminStats users={users} stories={stories} lessons={lessons} />}
              <div className="mt-8">
                {renderContent()}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPage;