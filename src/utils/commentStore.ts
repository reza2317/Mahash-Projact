import { getCommentsByReportIdIsolated, saveCommentIsolated, deleteCommentIsolated, DBCommentRecord } from './indexedDBHelper';
import { checkDBHealthBeforeLargeWrite } from './dbHealthService';

export type StoredComment = DBCommentRecord & {
  author_name?: string;
  created_at?: string;
  date?: string;
};

export const commentStore = {
  async getCommentsForReport(reportId: string): Promise<StoredComment[]> {
    try {
      const records = await getCommentsByReportIdIsolated(reportId);
      return records.map(r => ({
        ...r,
        author_name: r.author,
        created_at: new Date(r.timestamp).toISOString()
      }));
    } catch (err) {
      console.warn('Error reading comments from isolated IndexedDB:', err);
      return [];
    }
  },

  async saveComment(comment: StoredComment): Promise<void> {
    try {
      await checkDBHealthBeforeLargeWrite();
      const record: DBCommentRecord = {
        id: String(comment.id),
        reportId: comment.reportId,
        author: comment.author_name || comment.author || 'کاربر مهمان',
        content: comment.content,
        timestamp: comment.timestamp || Date.now(),
        syncStatus: comment.syncStatus || 'pending'
      };
      await saveCommentIsolated(record);
    } catch (err) {
      console.error('Error saving comment to isolated IndexedDB:', err);
    }
  },

  async saveCommentsForReport(reportId: string, comments: StoredComment[]): Promise<void> {
    try {
      await checkDBHealthBeforeLargeWrite();
      for (const c of comments) {
        const record: DBCommentRecord = {
          id: String(c.id),
          reportId: reportId,
          author: c.author_name || c.author || 'کاربر مهمان',
          content: c.content,
          timestamp: c.timestamp || (c.created_at ? new Date(c.created_at).getTime() : Date.now()),
          syncStatus: c.syncStatus || 'pending'
        };
        await saveCommentIsolated(record);
      }
    } catch (err) {
      console.error('Error saving comments batch to isolated IndexedDB:', err);
    }
  },

  async deleteComment(commentId: string): Promise<void> {
    try {
      await deleteCommentIsolated(commentId);
    } catch (err) {
      console.error('Error deleting comment from isolated IndexedDB:', err);
    }
  }
};
