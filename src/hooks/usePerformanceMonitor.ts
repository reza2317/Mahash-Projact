import { useEffect } from 'react';

export const usePerformanceMonitor = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource' && entry.duration > 10000) {
             console.log(`[Performance] Resource load time (${(entry.duration / 1000).toFixed(1)}s):`, entry.name);
          }
        }
      });
      observer.observe({ entryTypes: ['resource'] });
      
      return () => observer.disconnect();
    } catch(e) {
      // PerformanceObserver fallback
    }
  }, []);
};
