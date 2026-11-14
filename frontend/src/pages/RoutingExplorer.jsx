import React, { useEffect, useState } from 'react';
import { 
  GitFork, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Search, 
  Layers, 
  Sliders, 
  Info,
  Calendar,
  Building2,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function RoutingExplorer({ onOpenSimulator }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getRoutingLogs({ limit: 150 });
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const company = (log.target_company || '').toLowerCase();
      const reason = (log.match_reason || '').toLowerCase();
      return company.includes(q) || reason.includes(q);
    }
    return true;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <GitFork className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <span>Semantic Relevance Routing Explorer</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explainable multi-stage decision pipeline: inspect exact vector similarity, keyword overlap, and reranking reasons.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadLogs}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenSimulator}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition"
          >
            Launch Route Simulator
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {['ALL', 'NOTIFY', 'DO_NOT_NOTIFY', 'FILTERED_OUT'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                statusFilter === status
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search company or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-5">Target Agent</th>
                <th className="py-3 px-4">Stage B Vector</th>
                <th className="py-3 px-4">Stage C Rerank</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-6">Explainable Rationale & Factor Breakdown</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading routing audit logs...</td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No matching routing logs found.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isNotify = log.status === 'NOTIFY';
                  const isFiltered = log.status === 'FILTERED_OUT';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-4 px-5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span>{log.target_company}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono font-medium text-slate-600 dark:text-slate-400">
                        {log.vector_score.toFixed(2)}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {log.rerank_score.toFixed(2)}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isNotify
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : isFiltered
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isNotify ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          <span>{log.status.replace(/_/g, ' ')}</span>
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300 leading-relaxed">
                        <p className="mb-1">{log.match_reason}</p>
                        {log.breakdown && Object.keys(log.breakdown).length > 0 && (
                          <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 mt-1 font-mono">
                            {log.breakdown.matched_keywords?.length > 0 && (
                              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                kws: {log.breakdown.matched_keywords.join(', ')}
                              </span>
                            )}
                            {log.breakdown.industry_synergy !== undefined && (
                              <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                synergy: {log.breakdown.industry_synergy}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

