import React, { useState, useEffect } from 'react';

export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query, matches]);

  return matches;
};