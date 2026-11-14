import React, { useEffect } from 'react';
import { Sparkles, X, CheckCircle, Info } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export default function Toast() {
  const { liveToast, setLiveToast } = useNotifications();

  useEffect(() => {
    if (liveToast) {
      const timer = setTimeout(() => {
        setLiveToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [liveToast, setLiveToast]);

  if (!liveToast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white dark:bg-slate-900 border border-brand-500/30 rounded-xl p-4 shadow-xl shadow-brand-500/10 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1 pr-2">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {liveToast.title}
            </h4>
            <span className="text-[10px] text-slate-400">
              {liveToast.timestamp || 'Just now'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {liveToast.message}
          </p>
        </div>
        <button
          onClick={() => setLiveToast(null)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

