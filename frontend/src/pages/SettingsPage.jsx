import React from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Cpu, 
  Database, 
  Lock, 
  Moon, 
  Sun, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  const handleResetSeed = async () => {
    if (window.confirm('Reset database with canonical demo data?')) {
      try {
        await api.resetSeedData();
        alert('Database re-seeded successfully!');
        window.location.reload();
      } catch (e) {
        alert(e.message);
      }
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          <span>System Architecture & Configuration</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Platform parameters, semantic routing thresholds, database vector engine, and security guards.
        </p>
      </div>

      <div className="space-y-4">
        {/* Semantic Router Configuration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Multi-Stage Semantic Routing Pipeline
              </h3>
              <p className="text-xs text-slate-500">
                Stage A (SQL Metadata), Stage B (Cosine Vector), Stage C (Composite Reranker)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block mb-0.5">Default Threshold</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">0.75 (75%)</span>
              <span className="text-[11px] text-slate-400 block mt-1">Matches below 0.75 are discarded</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block mb-0.5">Stage B Top-K Candidates</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">50 Agents</span>
              <span className="text-[11px] text-slate-400 block mt-1">Retrieved from vector search for reranking</span>
            </div>
          </div>
        </div>

        {/* Database & Vector Engine */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Dual-Dialect Database & Vector Engine
              </h3>
              <p className="text-xs text-slate-500">
                PostgreSQL + pgvector native / Local SQLite fallback with exact cosine similarity
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block mb-0.5">Vector Dimensions</span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">256-D</span>
              <span className="text-[11px] text-slate-400 block mt-1">High-performance dense vector space</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block mb-0.5">Dual Mode Status</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Zero-Friction Fallback Ready</span>
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">Auto-adapts to PostgreSQL or SQLite</span>
            </div>
          </div>
        </div>

        {/* Security & Guards */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Enterprise Security & Injection Defenses
              </h3>
              <p className="text-xs text-slate-500">
                Prompt injection defense, SSRF webhooks guard, and HMAC-SHA256 signatures
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="font-medium text-slate-700 dark:text-slate-300">HMAC-SHA256 Webhook Signatures</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">ENABLED</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="font-medium text-slate-700 dark:text-slate-300">SSRF Guard (Private IP & AWS Metadata Blocking)</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">ENABLED</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="font-medium text-slate-700 dark:text-slate-300">Indirect Prompt Injection Defense</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">ENABLED</span>
            </div>
          </div>
        </div>

        {/* Preferences & Reset */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Interface Theme & Demonstration Reset
            </h3>
            <p className="text-xs text-slate-500">
              Toggle theme or reset the platform with canonical demonstration data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5"
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={handleResetSeed}
              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Demo Seed</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

