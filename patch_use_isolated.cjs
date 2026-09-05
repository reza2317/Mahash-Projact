const fs = require('fs');
let content = fs.readFileSync('src/hooks/useIsolatedTeamVideo.ts', 'utf8');

// Add import for useVideoMonitor
if (!content.includes('useVideoMonitor')) {
  content = content.replace(
    "import { ActivityReport",
    "import { useVideoMonitor } from './useVideoMonitor';\nimport { ActivityReport"
  );
}

// Add state for inViewport and intersection observer
if (!content.includes('isInViewport')) {
  const stateInsert = `
  const [isInViewport, setIsInViewport] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsInViewport(true);
        // Once intersected, we can stop observing if we want to just load it once and keep it,
        // but let's keep it simple and just set to true.
        if (observerRef.current && containerRef.current) {
          observerRef.current.unobserve(containerRef.current);
        }
      }
    }, {
      rootMargin: '200px 0px', // start loading slightly before it comes into view
      threshold: 0.01
    });
    
    observerRef.current.observe(containerRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useVideoMonitor(videoRef, report.id, teamSlug);
`;

  // Find where to insert this, maybe after `const videoRef = useRef...` and `const containerRef = useRef...`
  const searchFor = "const autoRetryCountRef = useRef<number>(0);";
  content = content.replace(searchFor, stateInsert + '\n  ' + searchFor);
}

// Change the loadResource useEffect to depend on isInViewport
const oldLoadEffect = `  useEffect(() => {
    loadResource();
  }, [loadResource]);`;
  
const newLoadEffect = `  useEffect(() => {
    if (isInViewport) {
      loadResource();
    }
  }, [loadResource, isInViewport]);`;

if (content.includes(oldLoadEffect)) {
  content = content.replace(oldLoadEffect, newLoadEffect);
}

fs.writeFileSync('src/hooks/useIsolatedTeamVideo.ts', content);
console.log("Patched useIsolatedTeamVideo");
