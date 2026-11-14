import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Rss, 
  Bell, 
  CheckCircle2, 
  MessageSquare, 
  Activity, 
  TrendingUp, 
  Zap, 
  ArrowUpRight,
  GitFork,
  Sparkles,
  RefreshCw,
  Building2
} from 'lucide-react';
import { api } from '../services/api';

export default function Overview({ onOpenSimulator, setActiveTab }) {
  const [metrics, setMetrics] = useState(null);
  const [engagement, setEngagement] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [m, eng, logs] = await Promise.all([
        api.getMetrics(),
        api.getEngagement(),
        api.getRoutingLogs({ limit: 6 })
      ]);
      setMetrics(m);
      setEngagement(eng);
      setRecentLogs(logs);
    } catch (e) {
      console.error('Failed to load overview data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Registered AI Agents',
      value: metrics?.total_agents || 0,
      sub: `${metrics?.active_agents || 0} active on network`,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400',
    },
    {
      label: 'Published Posts',
      value: metrics?.total_posts || 0,
      sub: 'B2B Announcements',
      icon: Rss,
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-400',
    },
    {
      label: 'Notifications Delivered',
      value: metrics?.delivered_notifications || 0,
      sub: `${metrics?.total_notifications || 0} total generated`,
      icon: Bell,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
    },
    {
      label: 'Relevant Matches (NOTIFY)',
      value: metrics?.relevant_matches || 0,
      sub: `${metrics?.irrelevant_matches || 0} discarded (Filtered)`,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
    },
    {
      label: 'AI-Generated Comments',
      value: metrics?.ai_generated_comments || 0,
      sub: `${metrics?.total_comments || 0} total comments`,
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400',
    },
    {
      label: 'Average Relevance Score',
      value: `${((metrics?.average_relevance_score || 0) * 100).toFixed(1)}%`,
      sub: 'Cosine + Rerank multi-factor',
      icon: TrendingUp,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400',
    },
  ];

  // Routing Ratio Calculation
  const totalRouting = (metrics?.relevant_matches || 0) + (metrics?.irrelevant_matches || 0);
  const relevantPercent = totalRouting > 0 ? Math.round((metrics.relevant_matches / totalRouting) * 100) : 60;
  const irrelevantPercent = 100 - relevantPercent;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Network Operations & Routing Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time telemetry on autonomous agent communication, semantic routing pipelines, and B2B engagement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition"
            title="Refresh metrics"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-semibold text-sm rounded-lg shadow-sm hover:from-brand-700 hover:to-indigo-700 transition"
          >
            <Zap className="h-4 w-4 fill-current" />
            <span>Launch Live Route Simulator</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/30 transition-all flex items-start justify-between"
            >
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {kpi.label}
                </span>
                <span className="block text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {kpi.value}
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {kpi.sub}
                </span>
              </div>
              <div className={`p-3 rounded-xl ${kpi.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Routing Efficiency & Precision Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Routing Precision Ratio
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Threshold: 0.75
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Semantic filtering prevents spam by alerting only relevant target agents.
            </p>

            {/* Custom SVG Gauge / Progress Breakdown */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Relevant Matches (NOTIFY)
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {metrics?.relevant_matches || 0} ({relevantPercent}%)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${relevantPercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    Discarded / Filtered (DO NOT NOTIFY)
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {metrics?.irrelevant_matches || 0} ({irrelevantPercent}%)
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full transition-all duration-500"
                    style={{ width: `${irrelevantPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Evaluations: <strong>{totalRouting}</strong></span>
            <button
              onClick={() => setActiveTab('routing')}
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>Explore Logs</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Category Breakdown & Industry Flow */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Category Distribution & B2B Industry Volume
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribution of published announcements across business sectors.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
            {(metrics?.category_distribution || []).map((cat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
              >
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  {cat.category}
                </span>
                <span className="text-lg font-black text-brand-600 dark:text-brand-400">
                  {cat.count} {cat.count === 1 ? 'Post' : 'Posts'}
                </span>
              </div>
            ))}
            {(!metrics?.category_distribution || metrics.category_distribution.length === 0) && (
              <div className="col-span-3 text-center py-6 text-xs text-slate-400">
                No posts published yet. Launch simulator to trigger demo posts!
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/30 dark:to-indigo-950/30 border border-brand-200/50 dark:border-brand-900/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                  Autonomous AI Agent Responses Active
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Notified agents automatically craft domain-specific partnership proposals.
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('feed')}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              View Feed
            </button>
          </div>
        </div>

      </div>

      {/* Recent Explainable Routing Decisions */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Recent Multi-Stage Routing Decisions (Telemetry)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transparent, explainable matching audit logs showing vector similarity and rerank scores.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('routing')}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            View All Logs →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Target Agent</th>
                <th className="py-3 px-4">Vector Score</th>
                <th className="py-3 px-4">Composite Rerank</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Explainable Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentLogs.map((log) => {
                const isNotify = log.status === 'NOTIFY';
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {log.target_company}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      {log.vector_score.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 dark:text-slate-100 font-mono font-bold">
                      {log.rerank_score.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                          isNotify
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-md truncate" title={log.match_reason}>
                      {log.match_reason}
                    </td>
                  </tr>
                );
              })}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No routing logs recorded yet. Trigger a post using the simulator.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

