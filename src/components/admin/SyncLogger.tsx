// src/components/admin/SyncLogger.tsx
import React, { useState, useEffect } from 'react';
import { Terminal, Trash2, CheckCircle2, XCircle, Clock, Activity, RefreshCw } from 'lucide-react';
import { WordPressService, WPLogEntry } from '../../services/WordPressService';

export const SyncLogger: React.FC = () => {
  const [logs, setLogs] = useState<WPLogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  useEffect(() => {
    const unsubscribe = WordPressService.subscribe((entry) => {
      setLogs((prev) => [entry, ...prev].slice(0, 100)); // keep last 100 logs
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'success') return log.success;
    if (filter === 'error') return !log.success;
    return true;
  });

  const clearLogs = () => setLogs([]);

  return (
    <div className="bg-[#15191e] border border-slate-700/80 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>گزارشگر همگام‌سازی لحظه‌ای (SyncLogger)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              نمایش زنده درخواست‌ها و پاسخ‌های REST API وردپرس جهت عیب‌یابی خطاهای اتصال، لوگو و گزارش‌ها.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              همه ({logs.length})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'success' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              موفق ({logs.filter(l => l.success).length})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filter === 'error' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              خطا ({logs.filter(l => !l.success).length})
            </button>
          </div>

          <button
            onClick={clearLogs}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
            title="پاک‌سازی گزارش‌ها"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">پاک‌سازی</span>
          </button>
        </div>
      </div>

      {/* Logs Console Window */}
      <div className="bg-[#0b0e13] border border-slate-800/80 rounded-xl p-4 font-mono text-xs max-h-80 overflow-y-auto space-y-2 select-text" dir="ltr">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 italic">
            هنوز هیچ درخواست API ثبت نشده است. عملیاتی مانند ذخیره لوگو یا دریافت گزارش‌ها را انجام دهید...
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition ${
                log.success
                  ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-900/50 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {log.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="font-bold px-1.5 py-0.5 rounded bg-slate-900 text-[10px] text-slate-200">
                  {log.method}
                </span>
                <span className="truncate text-slate-200 text-xs" title={log.url}>
                  {log.url}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
                {log.status && (
                  <span className={`px-1.5 py-0.5 rounded font-bold ${log.success ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'}`}>
                    HTTP {log.status}
                  </span>
                )}
                {log.latency !== undefined && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {log.latency}ms
                  </span>
                )}
                <span className="text-[10px] text-slate-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {log.error && (
                <div className="w-full text-rose-400 text-[10px] bg-rose-950/50 p-1.5 rounded mt-1 border border-rose-900/40 truncate">
                  Error: {log.error}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
