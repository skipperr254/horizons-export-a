import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getYouTubeVideoId(url) {
  if (!url) return null;
  let videoId = null;
  const standardMatch = url.match(/[?&]v=([^&]+)/);
  if (standardMatch) {
    videoId = standardMatch[1];
  } else {
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) {
      videoId = shortMatch[1];
    } else {
      const embedMatch = url.match(/embed\/([^?&]+)/);
      if (embedMatch) {
        videoId = embedMatch[1];
      }
    }
  }
  return videoId;
}

export function splitTextIntoPages(text, charactersPerPage = 1600) {
  if (!text) return [];

  const pages = [];
  let remainingText = text;

  while (remainingText.length > 0) {
    if (remainingText.length <= charactersPerPage) {
      pages.push(remainingText);
      break;
    }

    let cutOff = charactersPerPage;
    let lastPunctuation = -1;
    let lastSpace = -1;

    // Look for sentence-ending punctuation first
    const punctuationRegex = /[.!?]/g;
    let match;
    while ((match = punctuationRegex.exec(remainingText.substring(0, cutOff + 20)))) {
        if(match.index < cutOff) {
            lastPunctuation = match.index;
        }
    }

    if (lastPunctuation !== -1) {
      cutOff = lastPunctuation + 1;
    } else {
      // If no sentence end found, look for last space
      lastSpace = remainingText.lastIndexOf(' ', cutOff);
      if (lastSpace !== -1) {
        cutOff = lastSpace + 1;
      }
    }
    
    const pageText = remainingText.substring(0, cutOff);
    pages.push(pageText.trim());
    remainingText = remainingText.substring(cutOff).trim();
  }

  return pages;
}