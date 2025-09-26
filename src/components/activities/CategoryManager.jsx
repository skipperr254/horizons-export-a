import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Trash2, Crown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';

const categoryColors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
  'bg-yellow-500', 'bg-red-500', 'bg-indigo-500', 'bg-orange-500',
  'bg-teal-500', 'bg-cyan-500'
];

const CategoryManager = React.memo(({ user, categories, setCategories, selectedCategory, setSelectedCategory }) => {
  const { canAccessPremiumFeatures } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(categoryColors[0]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCategoryCreationError = (error) => {
    let title = "Hata Oluştu";
    let description = "Liste oluşturulurken beklenmedik bir hata oluştu.";

    if (error.message.includes('word_categories_user_id_name_key')) {
      title = "Aynı İsimde Liste Mevcut";
      description = "Bu isimde zaten bir listeniz var. Lütfen farklı bir isim deneyin.";
    } else if (error.message.includes('premium_word_category_limit_exceeded')) {
      title = "Liste Limiti Aşıldı";
      description = "Premium üyelik için en fazla 20 kelime listesi oluşturabilirsiniz.";
    }
    
    toast({
      title: title,
      description: description,
      variant: "destructive",
    });
  }

  const createCategory = useCallback(async () => {
    if (!newCategoryName.trim()) {
      toast({ title: "Liste adı gerekli", description: "Lütfen liste için bir ad girin.", variant: "destructive" });
      return;
    }
    if (!canAccessPremiumFeatures) {
      toast({ title: "Premium Özellik", description: "Kelime listesi oluşturmak için Premium üye olmalısınız.", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      const { data, error } = await supabase.from('word_categories').insert({ user_id: user.id, name: newCategoryName.trim(), color: newCategoryColor }).select().single();
      if (error) throw error;
      setCategories(prev => [...prev, data]);
      setNewCategoryName('');
      setNewCategoryColor(categoryColors[0]);
      setShowCreateForm(false);
      toast({ title: "Liste oluşturuldu! ✨", description: `"${newCategoryName}" listesi eklendi.` });
    } catch (error) {
      console.error('Error creating category:', error);
      handleCategoryCreationError(error);
    } finally {
      setIsCreating(false);
    }
  }, [newCategoryName, newCategoryColor, user, setCategories, toast, canAccessPremiumFeatures]);

  const deleteCategory = useCallback(async (categoryId, categoryName) => {
    try {
      await supabase.from('user_saved_words').update({ category_id: null }).eq('category_id', categoryId).eq('user_id', user.id);
      await supabase.from('word_categories').delete().eq('id', categoryId).eq('user_id', user.id);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      if (selectedCategory === categoryId) setSelectedCategory('all');
      toast({ title: "Liste silindi", description: `"${categoryName}" listesi silindi.` });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ title: "Hata", description: "Liste silinirken bir hata oluştu.", variant: "destructive" });
    }
  }, [user, selectedCategory, setCategories, setSelectedCategory, toast]);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 bg-card/70 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Kelime Listeleri</CardTitle>
          {canAccessPremiumFeatures ? (
            !showCreateForm && <Button onClick={() => setShowCreateForm(true)} size="sm"><Plus className="mr-2 h-4 w-4" />Yeni Liste</Button>
          ) : (
            <Button size="sm" disabled className="cursor-not-allowed">
              <Crown className="mr-2 h-4 w-4 text-amber-400" />
              Yeni Liste
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!canAccessPremiumFeatures && (
          <div className="p-3 mb-4 border rounded-lg bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300 text-sm">
            <div className="flex items-start">
              <Crown className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-amber-500" />
              <div>
                <span className="font-bold">Premium Özellik:</span> Sınırsız kelime listesi oluşturmak için üyeliğinizi yükseltin.
              </div>
            </div>
          </div>
        )}
        {showCreateForm && canAccessPremiumFeatures && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4">
            <div className="p-4 border rounded-lg bg-background/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Yeni Liste Oluştur</h4>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateForm(false)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-4">
                <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Liste adı (örn: Fiiller)" onKeyPress={(e) => e.key === 'Enter' && createCategory()} />
                <div className="flex gap-2 flex-wrap">{categoryColors.map((color) => (<button key={color} type="button" onClick={() => setNewCategoryColor(color)} className={`w-6 h-6 rounded-full ${color} border-2 transition-all ${newCategoryColor === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`} />))}</div>
                <Button onClick={createCategory} disabled={isCreating || !newCategoryName.trim()} className="w-full">{isCreating ? 'Oluşturuluyor...' : 'Oluştur'}</Button>
              </div>
            </div>
          </motion.div>
        )}

        <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Tüm Listeler</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <Button
                  variant={selectedCategory === 'all' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory('all')}
                >
                  Tüm Kayıtlı Kelimeler
                </Button>
                {categories.map(category => (
                  <div key={category.id} className="flex items-center group">
                    <Button
                      variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start flex-1"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-2 ${category.color || 'bg-gray-500'}`} />
                        <span className="truncate">{category.name}</span>
                      </div>
                    </Button>
                    {canAccessPremiumFeatures && (
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Listeyi silmek istediğinizden emin misiniz?</AlertDialogTitle>
                              <AlertDialogDescription>"{category.name}" listesi silinecek. Bu işlem geri alınamaz.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCategory(category.id, category.name)} className="bg-destructive hover:bg-destructive/90">Sil</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
});

export default CategoryManager;