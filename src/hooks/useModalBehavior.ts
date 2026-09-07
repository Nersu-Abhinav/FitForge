import React, { useEffect } from 'react';

interface UseModalBehaviorOptions {
  isOpen: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
}

/**
 * Universal modal UX enhancement hook:
 * 1. Automatically locks document body scrolling to prevent background scroll leaks.
 * 2. Listens for global 'Escape' key to close modal.
 * 3. Provides clean handleBackdropClick helper for outside touch/click dismissal.
 */
export function useModalBehavior({
  isOpen,
  onClose,
  closeOnEscape = true
}: UseModalBehaviorOptions) {
  // 1. Body Scroll Lock
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Prevent layout shift from scrollbar disappearing
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');

    // Lock all app scroll containers
    const scrollContainers = document.querySelectorAll<HTMLElement>('.app-scroll-container, #app-main-viewport, [data-scrollable]');
    const originalContainerOverflows = new Map<HTMLElement, string>();
    scrollContainers.forEach(el => {
      originalContainerOverflows.set(el, el.style.overflowY || '');
      el.style.overflowY = 'hidden';
    });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');

      scrollContainers.forEach(el => {
        el.style.overflowY = originalContainerOverflows.get(el) || '';
      });
    };
  }, [isOpen]);

  // 2. Escape Key Listener
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnEscape]);

  // 3. Outside Click / Touch Handler
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      onClose();
    }
  };

  return { handleBackdropClick };
}
