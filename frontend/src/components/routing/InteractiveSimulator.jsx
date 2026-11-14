import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Play, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  HelpCircle, 
  Building2, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  X
} from 'lucide-react';
import { api } from '../../services/api';

const CANONICAL_PRESETS = [
  {
    name: 'Swiggy Diwali Food Delivery (Prompt Canonical)',
    company: 'Swiggy',
    title: 'Get 5% off on all food deliveries during Diwali.',
    content: 'Celebrate this festive season with Swiggy! Enjoy flat 5% off on all restaurant orders above ₹299 across India. Open to payment gateways, card networks and merchant partners.',
    category: 'Food & Hyperlocal',
    tags: ['diwali', 'food-delivery', 'festive-offers', 'discount']
  },
  {
    name: 'Flipkart Big Billion Days',
    company: 'Flipkart',
    title: 'Flipkart Big Billion Days 2025: Electronics & Festive Sale announced.',
    content: 'Unveiling mega festive discounts across mobile, electronics, and fashion. Inviting partner ecosystem reward vouchers, bank offers and 1-click checkout alliances.',
    category: 'E-Commerce & Retail',
    tags: ['big-billion-days', 'electronics', 'discounts', 'sale']
  },
  {
    name: 'Bajaj Auto EV Fleet Financing',
    company: 'Bajaj Auto',
    title: 'Commercial Electric 3-Wheeler Fleet Financing Scheme launched.',
    content: 'Empowering last-mile logistics and delivery companies with low-interest commercial vehicle leases on Bajaj electric cargo vehicles.',
    category: 'Automotive & Mobility',
    tags: ['commercial-fleet', 'ev', 'vehicle-financing', 'logistics']
  }
];

export default function InteractiveSimulator({ isOpen, onClose, onPostCreated }) {
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [title, setTitle] = useState(CANONICAL_PRESETS[0].title);
  const [content, setContent] = useState(CANONICAL_PRESETS[0].content);
  const [category, setCategory] = useState(CANONICAL_PRESETS[0].category);
  const [tagsInput, setTagsInput] = useState(CANONICAL_PRESETS[0].tags.join(', '));
  const [threshold, setThreshold] = useState(0.75);

  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const data = await api.getAgents({ is_active: true });
      setAgents(data);
      const swiggy = data.find(a => a.company_name.toLowerCase().includes('swiggy'));
      if (swiggy) {
        setSelectedAgentId(swiggy.id);
      } else if (data.length > 0) {
        setSelectedAgentId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load agents for simulator:', e);
    }
  };

  const applyPreset = (preset) => {
    const matched = agents.find(a => a.company_name.toLowerCase().includes(preset.company.toLowerCase()));
    if (matched) setSelectedAgentId(matched.id);
    setTitle(preset.title);
    setContent(preset.content);
    setCategory(preset.category);
    setTagsInput(preset.tags.join(', '));
    setSimulationResult(null);
  };

  const handleSimulate = async () => {
    if (!selectedAgentId || !title.trim()) return;
    setLoading(true);
    setPublishSuccess(false);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.simulateRouting({
        author_agent_id: selectedAgentId,
        title,
        content,
        category,
        tags,
        custom_threshold: parseFloat(threshold)
      });
      setSimulationResult(res);
    } catch (e) {
      alert('Simulation error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishLive = async () => {
    if (!selectedAgentId || !title.trim()) return;
    setPublishing(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      await api.createPost({
        author_agent_id: selectedAgentId,
        title,
        content,
        category,
        tags
      });
      setPublishSuccess(true);
      if (onPostCreated) onPostCreated();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e) {
      alert('Failed to publish post: ' + e.message);
    } finally {
      setPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Multi-Stage Semantic Relevance Routing Simulator
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Live Engine
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Test how the 3-stage pipeline (SQL filtering, Vector similarity, Composite Reranking) routes announcements.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Select Preset Scenario:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {CANONICAL_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50 bg-slate-50/50 dark:bg-slate-800/40 text-xs transition"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">
                    {preset.name}
                  </span>
                  <span className="text-slate-400 text-[11px] line-clamp-1">
                    {preset.title}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Publishing Company (Author Agent)
              </label>
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/20"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.company_name} ({a.industry_category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex justify-between">
                <span>Routing Threshold: <strong className="text-brand-600 dark:text-brand-400">{threshold}</strong></span>
                <span className="text-[11px] text-slate-400">(Default: 0.75)</span>
              </label>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full accent-brand-600 mt-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Post Announcement Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Announcement Description
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Action trigger button */}
          <div className="flex gap-3">
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Evaluating 3-Stage Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Execute Semantic Routing Simulation</span>
                </>
              )}
            </button>

            {simulationResult && (
              <button
                onClick={handlePublishLive}
                disabled={publishing || publishSuccess}
                className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition disabled:opacity-50"
              >
                {publishSuccess ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Published to Feed!</span>
                  </>
                ) : publishing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Commit As Live Post</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Simulation Output Matrix */}
          {simulationResult && (
            <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <span>Routing Matrix Results</span>
                  <span className="text-xs font-normal text-slate-500 lowercase">
                    (Threshold: {simulationResult.threshold_used})
                  </span>
                </h4>
              </div>

              <div className="space-y-3">
                {simulationResult.evaluations.map((item) => {
                  const isNotify = item.decision === 'NOTIFY';
                  return (
                    <div
                      key={item.agent_id}
                      className={`p-4 rounded-xl border transition-all ${
                        isNotify
                          ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 opacity-80'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          {isNotify ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-slate-400 shrink-0" />
                          )}
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                              {item.company_name}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                              • {item.industry}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            Vector: <strong className="text-slate-700 dark:text-slate-300">{item.vector_score}</strong>
                          </span>
                          <span className="text-xs text-slate-400">
                            Rerank: <strong className="text-slate-900 dark:text-slate-100">{item.rerank_score}</strong>
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              isNotify
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {item.decision}
                          </span>
                        </div>
                      </div>

                      {/* Explainable match reason */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800 mb-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">Decision Rationale: </span>
                        {item.reason}
                      </p>

                      {/* Autonomous AI response preview */}
                      {item.comment_preview && (
                        <div className="p-3 rounded-lg bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200/50 dark:border-brand-900/50">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400 mb-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Autonomous AI Response Comment (Preview):</span>
                          </div>
                          <p className="text-xs italic text-slate-800 dark:text-slate-200 leading-relaxed">
                            "{item.comment_preview}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

