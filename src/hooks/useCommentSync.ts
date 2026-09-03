import { useState, useEffect, useCallback } from 'react';
import { commentStore, StoredComment } from '../utils/commentStore';
import { checkDBHealthBeforeLargeWrite } from '../utils/dbHealthService';

export function useCommentSync(reportId: string) {
  const [comments, setComments] = useState<StoredComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'syncing' | 'error'>('synced');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Load comments offline-first from IndexedDB, then fetch online
  const loadComments = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      // 1. Offline IndexedDB load
      const cached = await commentStore.getCommentsForReport(reportId);
      if (cached && cached.length > 0) {
        setComments(cached);
      }

      // 2. Online fetch & sync
      setSyncStatus('syncing');
      const res = await fetch('/api/wp/comments');
      const data = await res.json();
      if (data.success && Array.isArray(data.comments)) {
        const remoteComments = data.comments
          .filter((c: any) => String(c.post_id) === String(reportId))
          .map((c: any) => ({
            ...c,
            author: c.author_name || c.author || 'کاربر',
            timestamp: c.timestamp || Date.now(),
            syncStatus: 'synced' as const
          }));
        
        // Merge with any local pending comments
        const pendingLocal = comments.filter(c => c.syncStatus === 'pending');
        const mergedMap = new Map();
        for (const rc of remoteComments) {
          mergedMap.set(rc.id, rc);
        }
        for (const pc of pendingLocal) {
          if (!mergedMap.has(pc.id)) {
            mergedMap.set(pc.id, pc);
          }
        }
        const finalComments = Array.from(mergedMap.values());
        setComments(finalComments);
        await commentStore.saveCommentsForReport(reportId, finalComments);
        setSyncStatus('synced');
      } else {
        setSyncStatus('synced');
      }
    } catch (err) {
      console.warn('Failed to sync comments online, using local cache:', err);
      setSyncStatus('pending');
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = async (author_name: string, content: string): Promise<boolean> => {
    if (!content.trim()) return false;
    setSubmitting(true);
    try {
      // Check database health & disk quota before write
      await checkDBHealthBeforeLargeWrite();

      const tempId = `local_${Date.now()}`;
      const now = Date.now();
      const author = author_name.trim() || 'کاربر مهمان';
      const newComment: StoredComment = {
        id: tempId,
        reportId,
        author,
        author_name: author,
        content: content.trim(),
        timestamp: now,
        created_at: new Date(now).toISOString(),
        syncStatus: 'pending'
      };

      const updated = [newComment, ...comments];
      setComments(updated);
      await commentStore.saveCommentsForReport(reportId, updated);

      // Attempt immediate backend sync
      try {
        const res = await fetch('/api/wp/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_id: reportId,
            author_name: newComment.author_name,
            content: newComment.content
          })
        });
        const data = await res.json();
        if (data.success) {
          await loadComments();
          setSubmitting(false);
          return true;
        }
      } catch (apiErr) {
        console.warn('Comment stored locally, pending network sync:', apiErr);
        setSyncStatus('pending');
      }

      setSubmitting(false);
      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      setSyncStatus('error');
      setSubmitting(false);
      return false;
    }
  };

  const deleteComment = async (commentId: string | number): Promise<boolean> => {
    try {
      await checkDBHealthBeforeLargeWrite();
      const updated = comments.filter(c => c.id !== commentId);
      setComments(updated);
      await commentStore.saveCommentsForReport(reportId, updated);

      if (String(commentId).startsWith('local_')) {
        return true;
      }

      const res = await fetch(`/api/wp/comments/${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadComments();
      }
      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      return false;
    }
  };

  return {
    comments,
    loading,
    submitting,
    syncStatus,
    addComment,
    deleteComment,
    refreshComments: loadComments
  };
}
