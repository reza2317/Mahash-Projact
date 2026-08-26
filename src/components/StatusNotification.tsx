import React from 'react';
import { useNotification, NotificationItem } from '../context/NotificationContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const StatusNotification: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (!notifications || notifications.length === 0) return null;

  return (
    <div
      id="status-notification-container"
      aria-live="polite"
      className="fixed bottom-5 left-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none"
      dir="rtl"
    >
      {notifications.map((item) => (
        <ToastItem key={item.id} item={item} onDismiss={() => removeNotification(item.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ item: NotificationItem; onDismiss: () => void }> = ({ item, onDismiss }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-[#173b82] dark:text-blue-400 shrink-0 mt-0.5" />;
    }
  };

  const getBorderColor = () => {
    switch (item.type) {
      case 'success':
        return 'border-emerald-300 dark:border-emerald-800 bg-white/95 dark:bg-slate-900/95 shadow-emerald-500/10';
      case 'error':
        return 'border-rose-300 dark:border-rose-800 bg-white/95 dark:bg-slate-900/95 shadow-rose-500/10';
      case 'warning':
        return 'border-amber-300 dark:border-amber-800 bg-white/95 dark:bg-slate-900/95 shadow-amber-500/10';
      case 'info':
      default:
        return 'border-blue-300 dark:border-blue-800 bg-white/95 dark:bg-slate-900/95 shadow-blue-500/10';
    }
  };

  return (
    <div
      id={`toast-${item.id}`}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 ${getBorderColor()}`}
      role="alert"
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
          {item.title}
        </h4>
        {item.message && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {item.message}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        aria-label="بستن اعلان"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
