import React, { useEffect, useRef } from "react";

/**
 * useVideoMonitor
 * Hooks into the video element to detect 'error' and 'stalled' events.
 * Reports these events to the admin panel by saving them into a shared log.
 */
export function useVideoMonitor(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  reportId: string,
  teamSlug: string
) {
  const hasReportedErrorRef = useRef(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleVideoError = (e: Event) => {
      if (hasReportedErrorRef.current) return;
      hasReportedErrorRef.current = true;
      const errorState = (e.target as HTMLVideoElement).error;
      const errorCode = errorState ? errorState.code : 'unknown';
      const errorMessage = errorState ? errorState.message : 'No details';
      
      console.error(`[Video Monitor] Error on video ${reportId} for team ${teamSlug}:`, errorCode, errorMessage);
      reportIssueToAdmin('error', reportId, teamSlug, `Code ${errorCode}: ${errorMessage}`);
    };

    const handleVideoStalled = () => {
      console.warn(`[Video Monitor] Video stalled ${reportId} for team ${teamSlug}`);
      reportIssueToAdmin('stalled', reportId, teamSlug, 'Video playback stalled (Network or decoding bottleneck)');
    };

    videoEl.addEventListener('error', handleVideoError);
    videoEl.addEventListener('stalled', handleVideoStalled);

    return () => {
      videoEl.removeEventListener('error', handleVideoError);
      videoEl.removeEventListener('stalled', handleVideoStalled);
    };
  }, [videoRef, reportId, teamSlug]);
}

function reportIssueToAdmin(type: 'error' | 'stalled', reportId: string, teamSlug: string, details: string) {
  try {
    const key = 'mahash_video_errors_log';
    const existingRaw = localStorage.getItem(key);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    
    // Prevent spamming the same error in the last 1 hour
    if (existing.some((log: any) => log.reportId === reportId && log.type === type && (Date.now() - log.timestamp < 3600000))) {
      return; 
    }

    const errorEntry = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      reportId,
      teamSlug,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };

    existing.push(errorEntry);

    // Keep only last 50 errors
    if (existing.length > 50) existing.shift();

    localStorage.setItem(key, JSON.stringify(existing));
    window.dispatchEvent(new Event('mahash_video_error_logged'));

    // Post to backend server endpoint for administrator dashboard visibility
    fetch('/api/video-monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorEntry)
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to report video issue:', e);
  }
}
