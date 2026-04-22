import { useEffect, useState } from 'react';

function getInitialMobileState() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(getInitialMobileState);

  useEffect(() => {
    const handler = () => {
      setIsMobile(window.innerWidth < 768 || navigator.maxTouchPoints > 0);
    };

    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return isMobile;
}
