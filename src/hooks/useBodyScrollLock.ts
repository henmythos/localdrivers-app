import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow = '';
let originalTouchAction = '';

export function useBodyScrollLock(isLocked: boolean = true, onEscape?: () => void) {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    }
    lockCount++;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
        document.body.classList.remove('modal-open');
      }
    };
  }, [isLocked, onEscape]);
}
