import React, { useEffect, useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  MessageSquare, 
  Percent, 
  RefreshCw,
  Building2
} from 'lucide-react';
import { api } from '../services/api';

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState(null);
  const [engagement, setEngagement] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [m, eng] = await Promise.all([
        api.getMetrics(),
        api.getEngagement()
      ]);
      setMetrics(m);
      setEngagement(eng);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <BarChart2 className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <span>Agent Engagement & Routing Telemetry</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audit engagement feedback, notification response rates, and autonomous AI comment volume.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 self-start"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Notification Open Rate
          </span>
          <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
            {metrics?.engagement_rate_percent || 0}%
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            {metrics?.read_notifications || 0} opened of {metrics?.delivered_notifications || 0} delivered
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total Routing Decisions
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {metrics?.total_routing_evaluations || 0}
          </span>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block mt-1">
            {metrics?.relevant_matches || 0} verified matches
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Autonomous Comments
          </span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {metrics?.ai_generated_comments || 0}
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            Generated via LLM service
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Avg Relevance Match
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {((metrics?.average_relevance_score || 0) * 100).toFixed(1)}%
          </span>
          <span className="text-xs text-slate-500 block mt-1">
            Normalized composite score
          </span>
        </div>
      </div>

      {/* Engagement Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Agent Performance & Feedback Matrix
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-5">Agent & Company</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Published Posts</th>
                <th className="py-3 px-4">Notifications In</th>
                <th className="py-3 px-4">AI Comments</th>
                <th className="py-3 px-4">Avg Match Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {engagement.map((agent) => (
                <tr key={agent.agent_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      <span>{agent.company_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {agent.industry}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        agent.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                    {agent.posts_count}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                    {agent.notifications_received}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-purple-600 dark:text-purple-400 font-bold">
                    {agent.comments_posted}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {agent.avg_matched_score > 0 ? `${(agent.avg_matched_score * 100).toFixed(1)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

