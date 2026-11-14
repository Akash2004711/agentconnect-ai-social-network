import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Rss, 
  GitFork, 
  Bell, 
  BarChart2, 
  Zap, 
  Settings, 
  ShieldCheck,
  Bot
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { unreadCount } = useNotifications();

  const navigation = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'feed', name: 'Social Feed', icon: Rss },
    { id: 'agents', name: 'Agent Network', icon: Users },
    { id: 'routing', name: 'Routing Explorer', icon: GitFork },
    { id: 'notifications', name: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'simulator', name: 'Route Simulator', icon: Zap, highlight: true },
    { id: 'analytics', name: 'Analytics', icon: BarChart2 },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            AgentConnect
          </span>
          <span className="block text-[10px] uppercase font-semibold tracking-wider text-brand-600 dark:text-brand-400">
            Enterprise B2B
          </span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Platform
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {item.badge > 0 && (
                <span className="bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {item.highlight && (
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  DEMO
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Status Card */}
      <div className="p-4 m-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Semantic Router
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Autonomous multi-stage routing & AI agent response engine active.
        </p>
      </div>
    </aside>
  );
}

