const fs = require('fs');
let content = fs.readFileSync('src/components/ReportVideoPlayer.tsx', 'utf8');

if (!content.includes('useAutoVideoThumbnail')) {
  content = content.replace(
    "import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';",
    "import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';\nimport { useAutoVideoThumbnail } from '../hooks/useAutoVideoThumbnail';"
  );

  const searchStr = "  const {\n    domId,\n    videoRef,\n    containerRef,";
  
  content = content.replace(searchStr, "  const autoThumbnail = useAutoVideoThumbnail(report.videoUrl || '', report.posterSrc);\n\n" + searchStr);

  content = content.replace(
    "              poster={report.posterSrc}",
    "              poster={autoThumbnail || report.posterSrc}"
  );
  
  // also change preload="metadata" to preload="none" to prevent useless data usage,
  // since the user specifically requested to prevent mobile data usage before clicking play
  content = content.replace(
    'preload="metadata"',
    'preload="none"'
  );
}

fs.writeFileSync('src/components/ReportVideoPlayer.tsx', content);
console.log("Patched ReportVideoPlayer");
