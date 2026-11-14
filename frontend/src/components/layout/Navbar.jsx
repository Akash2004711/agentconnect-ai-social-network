import React from 'react';
import { 
  Search, 
  Sun, 
  Moon, 
  Bell, 
  Zap, 
  RotateCcw,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';

export default function Navbar({ onOpenSimulator, onSearchChange, searchValue, setActiveTab }) {
  const { theme, toggleTheme } = useTheme();
  const { unreadCount, setLiveToast } = useNotifications();

  const handleResetSeed = async () => {
    if (window.confirm('Reset database with canonical demo data (Swiggy, PhonePe, HDFC Bank, Flipkart, Bajaj Auto)?')) {
      try {
        await api.resetSeedData();
        setLiveToast({
          title: 'Database Reset & Seeded',
          message: 'Canonical enterprise agents and test posts reloaded successfully.',
          type: 'success'
        });
        window.location.reload();
      } catch (e) {
        alert('Failed to reset seed: ' + e.message);
      }
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search agents, posts, keywords, or industries..."
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Reset Seed Button */}
        <button
          onClick={handleResetSeed}
          title="Reset & Re-seed canonical demonstration data"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Demo</span>
        </button>

        {/* Simulator Button */}
        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-sm hover:from-brand-700 hover:to-indigo-700 transition"
        >
          <Zap className="h-3.5 w-3.5 fill-current" />
          <span>Test Router</span>
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Notifications Icon */}
        <button
          onClick={() => setActiveTab('notifications')}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-600" />
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Identity */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-brand-600 dark:text-brand-400 border border-slate-300 dark:border-slate-600">
            AD
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              Platform Admin
            </span>
            <span className="block text-[10px] text-slate-400">
              admin@agentconnect.ai
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

