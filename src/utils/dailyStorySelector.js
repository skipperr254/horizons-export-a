import { supabase } from '@/lib/customSupabaseClient';

const createSeededRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
};

const shuffleArray = (array, seededRandom) => {
    let currentIndex = array.length, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(seededRandom() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}

export const getDailyFreeStories = (allStories) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateSeed = today.getTime();
  const seededRandom = createSeededRandom(dateSeed);

  const a1Stories = allStories.filter(story => story.level === 'a1');
  const a2Stories = allStories.filter(story => story.level === 'a2');
  const otherStories = allStories.filter(story => story.level !== 'a1' && story.level !== 'a2');

  const shuffledA1 = shuffleArray([...a1Stories], seededRandom);
  const shuffledA2 = shuffleArray([...a2Stories], seededRandom);

  const unlockedA1 = shuffledA1.slice(0, 3);
  const unlockedA2 = shuffledA2.slice(0, 3);

  const lockedA1 = shuffledA1.slice(3, 6);
  const lockedA2 = shuffledA2.slice(3, 6);

  const unlocked = [...unlockedA1, ...unlockedA2];
  const lockedForPreview = [...lockedA1, ...lockedA2];
  
  const allUnlockedIds = unlocked.map(s => s.id);
  const allPreviewIds = lockedForPreview.map(s => s.id);
  
  const remainingLockedStories = allStories.filter(s => !allUnlockedIds.includes(s.id) && !allPreviewIds.includes(s.id));
  
  const premiumPlaceholderStory = remainingLockedStories.length > 0
    ? shuffleArray([...remainingLockedStories], seededRandom)[0]
    : null;

  return {
    unlocked: unlocked.map(s => s.id),
    lockedForPreview: lockedForPreview.map(s => s.id),
    premiumPlaceholderStory: premiumPlaceholderStory,
  };
};