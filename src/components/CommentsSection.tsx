import React, { useState } from 'react';
import { MessageSquare, Send, Trash2, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { useCommentSync } from '../hooks/useCommentSync';
import { toPersianDigits } from '../utils/persianDate';

interface CommentsSectionProps {
  reportId: string;
  isAdmin: boolean;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ reportId, isAdmin }) => {
  const { comments, loading, submitting, syncStatus, addComment, deleteComment } = useCommentSync(reportId);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const success = await addComment(authorName, content);
    if (success) {
      setContent('');
      setAuthorName('');
      setSuccessMessage('دیدگاه شما با موفقیت در پایگاه محلی IndexedDB ثبت شد.');
      setTimeout(() => setSuccessMessage(''), 4000);
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>دیدگاه‌ها و تبادل نظرات ({toPersianDigits(comments.length)})</span>
        </h4>

        {/* Sync Status Badge (Admin Only) */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {syncStatus === 'synced' && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>همگام‌سازی شده با دیتابیس</span>
              </>
            )}
            {syncStatus === 'syncing' && (
              <>
                <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                <span>در حال همگام‌سازی...</span>
              </>
            )}
            {syncStatus === 'pending' && (
              <>
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>ذخیره محلی (آفلاین)</span>
              </>
            )}
            {syncStatus === 'error' && (
              <>
                <AlertCircle className="w-3 h-3 text-rose-500" />
                <span>خطای همگام‌سازی</span>
              </>
            )}
          </div>
        )}
      </div>

      {successMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نام و نام خانوادگی:</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="مثال: دکتر علوی"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">متن دیدگاه:</label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="دیدگاه، پرسش یا پیشنهاد خود را درباره این گزارش بنویسید..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'در حال ثبت...' : 'ثبت دیدگاه'}</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-6 text-xs text-slate-500">در حال بارگذاری دیدگاه‌ها از IndexedDB...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
            هنوز دیدگاهی برای این گزارش ثبت نشده است. اولین نفری باشید که نظر می‌دهید!
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                    {c.author_name ? c.author_name.charAt(0) : 'ک'}
                  </span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{c.author_name}</h5>
                    <span className="text-[10px] text-slate-400">
                      {c.created_at ? toPersianDigits(new Date(c.created_at).toLocaleDateString('fa-IR')) : 'اخیراً'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      c.syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {c.syncStatus === 'synced' ? 'همگام‌شده' : 'محلی (Pending)'}
                    </span>
                  )}
                  {(isAdmin || c.syncStatus === 'pending') && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                      title="حذف دیدگاه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pr-9 whitespace-pre-wrap">
                {c.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
