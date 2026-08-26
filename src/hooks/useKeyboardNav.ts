import { useEffect } from 'react';
import { PageId } from '../types';

interface KeyboardNavOptions {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  enabled?: boolean;
}

// Ordered main site sections for arrow-key traversal
const MAIN_NAV_SEQUENCE: PageId[] = [
  'home',
  'teams-hub',
  'scores',
  'education',
  'events',
  'consultation',
  'membership',
  'about',
  'contact',
];

/**
 * Keyboard Navigation Hook
 * - ArrowRight / ArrowLeft: Move sequentially through the main site navigation items (RTL aware)
 * - Alt + 1..9: Quick jump to specific top-level pages
 * - Enter / Space on active focused interactive elements
 */
export function useKeyboardNav({ currentPage, onNavigate, enabled = true }: KeyboardNavOptions) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an input, textarea, or contentEditable element
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) return;

      // Quick Alt + Number shortcuts
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= MAIN_NAV_SEQUENCE.length) {
          e.preventDefault();
          onNavigate(MAIN_NAV_SEQUENCE[num - 1]);
          return;
        }
      }

      // Arrow navigation for primary views (RTL: ArrowLeft goes next, ArrowRight goes prev)
      if (!e.altKey && !e.ctrlKey && !e.metaKey) {
        const currentIndex = MAIN_NAV_SEQUENCE.indexOf(currentPage);

        if (e.key === 'ArrowLeft') {
          // Next in RTL
          if (currentIndex >= 0 && currentIndex < MAIN_NAV_SEQUENCE.length - 1) {
            e.preventDefault();
            onNavigate(MAIN_NAV_SEQUENCE[currentIndex + 1]);
          }
        } else if (e.key === 'ArrowRight') {
          // Prev in RTL
          if (currentIndex > 0) {
            e.preventDefault();
            onNavigate(MAIN_NAV_SEQUENCE[currentIndex - 1]);
          }
        } else if (e.key === 'Home') {
          e.preventDefault();
          onNavigate('home');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, onNavigate, enabled]);
}
