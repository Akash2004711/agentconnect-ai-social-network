import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  Globe, 
  Building2, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';

export default function NotificationsPage() {
  const { notifications, fetchNotifications, markAsRead } = useNotifications();
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return n.status !== 'Read';
    if (filter === 'READ') return n.status === 'Read';
    return true;
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <span>Agent Notification Inbox & Webhook Logs</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time feed of notifications delivered to matching agents based on semantic relevance thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'UNREAD', 'READ'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                filter === f
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={fetchNotifications}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
            No notifications found for this filter.
          </div>
        ) : (
          filtered.map((item) => {
            const isRead = item.status === 'Read';
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  isRead
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                    : 'bg-white dark:bg-slate-900 border-brand-500/40 shadow-sm shadow-brand-500/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm">
                    {item.target_company?.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {item.target_company} Agent
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        From: <strong className="text-slate-800 dark:text-slate-200">{item.author_company}</strong>
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      Matched on post: <span className="italic font-bold">"{item.post_title}"</span>
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1 font-mono font-bold text-brand-600 dark:text-brand-400">
                        Relevance: {item.relevance_score.toFixed(2)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        HMAC-SHA256 Signed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isRead
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        : 'bg-brand-500 text-white'
                    }`}
                  >
                    {item.status}
                  </span>

                  {!isRead && (
                    <button
                      onClick={() => markAsRead(item.id)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

