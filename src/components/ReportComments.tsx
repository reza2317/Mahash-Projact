import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2, User, CheckCircle2 } from 'lucide-react';
import { toPersianDigits } from '../utils/persianDate';
import { logReportToMySQL } from '../utils/mysqlLogger';

interface ReportCommentsProps {
  reportId: string;
  isAdmin: boolean;
}

export const ReportComments: React.FC<ReportCommentsProps> = ({ reportId, isAdmin }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/wp/comments');
      const data = await res.json();
      if (data.success && Array.isArray(data.comments)) {
        const reportComments = data.comments.filter((c: any) => String(c.post_id) === String(reportId));
        setComments(reportComments);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [reportId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) {
      alert('لطفاً متن دیدگاه خود را وارد کنید.');
      return;
    }

    setSubmitting(true);
    const author = authorName.trim() || 'کاربر مهمان باشگاه';
    const content = commentContent.trim();

    try {
      const res = await fetch('/api/wp/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: reportId,
          author_name: author,
          content
        })
      });
      const data = await res.json();
      if (data.success) {
        // Log to MySQL activity table
        logReportToMySQL({
          actionType: 'comment_post',
          title: `ثبت دیدگاه جدید برای گزارش ${reportId}`,
          details: content,
          userName: author,
          reportId: String(reportId),
          metadata: {
            reportId,
            authorName: author,
            commentId: data.comment_id
          },
          status: 'success'
        });

        setCommentContent('');
        setAuthorName('');
        setSuccessMsg('دیدگاه شما با موفقیت ثبت شد و در جدول wp_comments پایگاه داده ذخیره گردید.');
        await fetchComments();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('خطا در ثبت دیدگاه');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string | number) => {
    if (!confirm('آیا از حذف این دیدگاه اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/wp/comments/${commentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        logReportToMySQL({
          actionType: 'comment_delete',
          title: `حذف دیدگاه شماره ${commentId}`,
          details: `حذف نظر مربوط به گزارش ${reportId}`,
          userName: 'مدیر سامانه',
          reportId: String(reportId),
          status: 'warning'
        });
        await fetchComments();
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>دیدگاه‌ها و نظرات کاربران ({toPersianDigits(comments.length)})</span>
        </h4>
        <span className="text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
          جدول wp_comments وردپرس
        </span>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 p-3 rounded-xl text-xs flex items-center gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">نام و نام خانوادگی:</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="مثال: علی رضایی"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">متن دیدگاه یا پیشنهاد:</label>
          <textarea
            rows={3}
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="دیدگاه، پرسش یا بازخورد خود را درباره این گزارش بنویسید..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'در حال ثبت...' : 'ثبت دیدگاه'}</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
            هنوز دیدگاهی برای این گزارش ثبت نشده است. اولین نفری باشید که نظر می‌دهید!
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{c.author_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono mr-2">
                      {toPersianDigits(new Date(c.date).toLocaleDateString('fa-IR'))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">
                    تایید شده
                  </span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 rounded-lg transition"
                      title="حذف دیدگاه"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pr-9">
                {c.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
