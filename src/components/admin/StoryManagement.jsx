import React from 'react';
import StoryForm from './StoryForm';
import StoryList from './StoryList';

const StoryManagement = ({
  stories,
  storyForm,
  setStoryForm,
  editingStory,
  setEditingStory,
  onStoryAdded,
  onStoryUpdated,
  onEditStory,
  onDeleteStory
}) => {
  return (
    <div className="space-y-6">
      <StoryForm
        storyForm={storyForm}
        setStoryForm={setStoryForm}
        editingStory={editingStory}
        setEditingStory={setEditingStory}
        onStoryAdded={onStoryAdded}
        onStoryUpdated={onStoryUpdated}
      />
      
      <StoryList
        stories={stories}
        onEditStory={onEditStory}
        onDeleteStory={onDeleteStory}
      />
    </div>
  );
};

export default StoryManagement;