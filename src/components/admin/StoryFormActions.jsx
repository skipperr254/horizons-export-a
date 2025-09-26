import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';

const StoryFormActions = ({ 
  editingStory, 
  submitting, 
  uploading, 
  storyForm, 
  onSubmit, 
  onCancel 
}) => {
  const isDisabled = submitting || uploading || !storyForm.title.trim() || !storyForm.content.trim();

  return (
    <div className="flex gap-3 pt-4">
      <Button 
        onClick={onSubmit}
        disabled={isDisabled}
        className="flex-1"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        {editingStory ? 'Hikayeyi Güncelle' : 'Hikaye Ekle'}
      </Button>
      
      {editingStory && (
        <Button 
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1"
        >
          İptal Et
        </Button>
      )}
    </div>
  );
};

export default StoryFormActions;