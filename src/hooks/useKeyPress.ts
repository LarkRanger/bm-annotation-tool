import { useCallback, useEffect } from 'react';

export function useKeyPress(targetKey: string, handler: () => void) {
  // If pressed key is our target key then set to true
  const downHandler = useCallback((event: KeyboardEvent) => {
    if (event.key === targetKey) {
      handler();
    }
  }, [targetKey, handler]);

  // If released key is our target key then set to false
  const upHandler = useCallback((event: KeyboardEvent) => {
    if (event.key === targetKey) {
      handler();
    }
  }, [targetKey, handler]);

  // Add event listeners
  useEffect(() => {
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [upHandler, downHandler]); // Empty array ensures that effect is only run on mount and unmount
};