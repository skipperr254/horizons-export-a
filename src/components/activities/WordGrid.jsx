import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, ArrowRight, BookOpen, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

const WordCard = React.memo(({ wordData, categories, onDeleteWord, onMoveWord }) => {
  const { canAccessPremiumFeatures } = useAuth();
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }} 
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
    >
      <Card className="h-full group relative overflow-hidden bg-card hover:border-primary/20 transition-all duration-300">
        <CardContent className="p-4 flex flex-col h-full">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-lg font-bold capitalize text-primary flex-1 pr-16">{wordData.word}</h4>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {canAccessPremiumFeatures && (<Button variant="ghost" size="icon" onClick={() => onMoveWord(wordData)} className="h-8 w-8 text-muted-foreground hover:text-primary" title="Liste değiştir"><ArrowRight className="h-4 w-4" /></Button>)}
              <Button variant="ghost" size="icon" onClick={() => onDeleteWord(wordData.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive" title="Kelimeyi sil"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <p className="text-md font-medium text-muted-foreground mb-3 capitalize">{wordData.translation}</p>
          
          <div className="mt-auto space-y-3 pt-3 border-t">
            {wordData.category_id && categories.find(c => c.id === wordData.category_id) && (
              <Badge variant="secondary" className="font-normal">
                <div className={`w-2 h-2 rounded-full mr-2 ${categories.find(c => c.id === wordData.category_id)?.color}`}></div>
                {categories.find(c => c.id === wordData.category_id)?.name}
              </Badge>
            )}
            <div className="text-xs text-muted-foreground space-y-2">
              {wordData.story_title && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3 w-3 flex-shrink-0" />
                  <p className="truncate" title={wordData.story_title}>{wordData.story_title}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <p>{new Date(wordData.added_at).toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});


const WordGrid = React.memo(({ words, setWords, categories, onDeleteWord }) => {
  const { user } = useAuth();
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [targetCategory, setTargetCategory] = useState('');
  const { toast } = useToast();

  const moveWordToCategory = useCallback(async () => {
    if (!selectedWord || !targetCategory) return;
    try {
      const newCategoryId = targetCategory === 'none' ? null : parseInt(targetCategory);
      const { error } = await supabase.from('user_saved_words').update({ category_id: newCategoryId }).eq('id', selectedWord.id).eq('user_id', user.id);
      if (error) throw error;
      setWords(currentWords => currentWords.map(word => word.id === selectedWord.id ? { ...word, category_id: newCategoryId } : word));
      const categoryName = newCategoryId ? categories.find(c => c.id === newCategoryId)?.name : 'Listelenmemiş';
      toast({ title: "Kelime taşındı! ✨", description: `"${selectedWord.word}" kelimesi "${categoryName}" listesine taşındı.` });
      setShowMoveDialog(false);
      setSelectedWord(null);
    } catch (error) {
      console.error('Error moving word:', error);
      toast({ title: "Hata", description: "Kelime taşınırken bir hata oluştu.", variant: "destructive" });
    }
  }, [selectedWord, targetCategory, user, categories, setWords, toast]);

  const handleMoveWord = useCallback((word) => {
    setSelectedWord(word);
    setTargetCategory(word.category_id?.toString() || 'none');
    setShowMoveDialog(true);
  }, []);
  
  const handleCloseDialog = useCallback(() => {
    setShowMoveDialog(false);
    setSelectedWord(null);
  }, []);

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {words.map((wordData) => (
          <WordCard 
            key={wordData.id}
            wordData={wordData}
            categories={categories}
            onDeleteWord={onDeleteWord}
            onMoveWord={handleMoveWord}
          />
        ))}
      </div>

      <Dialog open={showMoveDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kelimeyi Taşı</DialogTitle>
            <DialogDescription>"{selectedWord?.word}" kelimesini hangi listeye taşımak istiyorsunuz?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Liste</Label>
              <Select value={targetCategory} onValueChange={setTargetCategory}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Liste seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Listelenmemiş</SelectItem>
                  {categories.map(category => (<SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>İptal</Button>
            <Button onClick={moveWordToCategory} disabled={!targetCategory}>Taşı</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

export default WordGrid;