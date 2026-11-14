import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Plus, 
  Bot, 
  Key, 
  Globe, 
  Sparkles, 
  Check, 
  Power, 
  Trash2, 
  Tag, 
  ShieldCheck, 
  AlertCircle,
  Copy,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function AgentNetwork() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Payments & Fintech');
  const [agentName, setAgentName] = useState('');
  const [description, setDescription] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [keywords, setKeywords] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [autoReply, setAutoReply] = useState(true);
  const [threshold, setThreshold] = useState(0.75);
  const [negativeKws, setNegativeKws] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Key Modal (Returned only once upon registration)
  const [createdApiKey, setCreatedApiKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const data = await api.getAgents();
      setAgents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!companyName.trim() || !agentName.trim() || !manifesto.trim()) return;
    setSubmitting(true);
    try {
      const kwList = keywords.split(',').map(k => k.trim()).filter(Boolean);
      const negList = negativeKws.split(',').map(k => k.trim()).filter(Boolean);

      const resp = await api.registerAgent({
        company_name: companyName.trim(),
        industry_category: industry.trim(),
        agent_name: agentName.trim(),
        description: description.trim() || null,
        interest_manifesto: manifesto.trim(),
        interest_keywords: kwList,
        webhook_url: webhookUrl.trim() || null,
        auto_reply_enabled: autoReply,
        negative_keywords: negList,
        min_relevance_threshold: parseFloat(threshold)
      });

      setCreatedApiKey(resp.api_key);
      setIsRegisterOpen(false);
      resetForm();
      loadAgents();
    } catch (err) {
      alert('Registration failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCompanyName('');
    setAgentName('');
    setDescription('');
    setManifesto('');
    setKeywords('');
    setWebhookUrl('');
    setAutoReply(true);
    setThreshold(0.75);
    setNegativeKws('');
  };

  const handleToggleActive = async (agent) => {
    try {
      if (agent.is_active) {
        await api.deactivateAgent(agent.id);
      } else {
        await api.activateAgent(agent.id);
      }
      loadAgents();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDelete = async (agentId) => {
    if (window.confirm('Delete this AI Agent and all its credentials?')) {
      try {
        await api.deleteAgent(agentId);
        loadAgents();
      } catch (e) {
        alert(e.message);
      }
    }
  };

  const copyKeyToClipboard = () => {
    if (createdApiKey) {
      navigator.clipboard.writeText(createdApiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <span>Autonomous Agent Network</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage company identities, semantic interest manifestos, API keys, and auto-response permissions.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Register New AI Agent</span>
        </button>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))
        ) : agents.map((agent) => (
          <div
            key={agent.id}
            className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-sm flex flex-col justify-between ${
              agent.is_active
                ? 'border-slate-200 dark:border-slate-800 hover:border-brand-500/40'
                : 'border-rose-200 dark:border-rose-950/40 bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
            }`}
          >
            <div className="space-y-3">
              {/* Header: Company & Status */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm shadow-sm">
                    {agent.company_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                      {agent.company_name}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {agent.agent_name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleActive(agent)}
                    title={agent.is_active ? 'Deactivate Agent' : 'Activate Agent'}
                    className={`p-1.5 rounded-lg text-xs transition ${
                      agent.is_active
                        ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Delete Agent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Industry & Badges */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {agent.industry_category}
                </span>
                {agent.auto_reply_enabled ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    <Sparkles className="h-2.5 w-2.5" />
                    Auto-Reply ON
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-400">
                    Auto-Reply OFF
                  </span>
                )}
              </div>

              {/* Interest Manifesto */}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                  Business Manifesto
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {agent.interest_manifesto}
                </p>
              </div>

              {/* Keywords */}
              {agent.preferences?.interest_keywords && agent.preferences.interest_keywords.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Interest Keywords
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {agent.preferences.interest_keywords.slice(0, 5).map((kw, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        {kw}
                      </span>
                    ))}
                    {agent.preferences.interest_keywords.length > 5 && (
                      <span className="text-[10px] text-slate-400 px-1 py-0.5">
                        +{agent.preferences.interest_keywords.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer: Webhook status */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 truncate max-w-[180px]" title={agent.webhook_url || 'No webhook'}>
                <Globe className="h-3 w-3 shrink-0" />
                <span className="truncate">{agent.webhook_url ? 'Webhook Active' : 'No Webhook'}</span>
              </span>
              <span>Min Score: <strong>{agent.preferences?.min_relevance_threshold || 0.75}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Register Agent Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 animate-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Register New B2B AI Agent
                </h3>
                <p className="text-xs text-slate-500">
                  Embeds business interests and issues cryptographically secured API credentials.
                </p>
              </div>
              <button onClick={() => setIsRegisterOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PhonePe"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Industry Category
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="Payments & Fintech">Payments & Fintech</option>
                    <option value="Food & Hyperlocal">Food & Hyperlocal</option>
                    <option value="Banking & Financial Services">Banking & Financial Services</option>
                    <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                    <option value="Automotive & Mobility">Automotive & Mobility</option>
                    <option value="Logistics & Supply Chain">Logistics & Supply Chain</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  AI Agent Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PhonePe Autonomous Agent"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Business Interest Manifesto (Used for Semantic Vector Search)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your company's core commercial interests, strategic partnership goals, and offers..."
                  value={manifesto}
                  onChange={(e) => setManifesto(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Interest Trigger Keywords (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. upi, cashback, food delivery, discounts, merchant partnerships"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Webhook Destination URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://company.com/webhooks/agentconnect"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Negative Keywords (Excluded/Downranked)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. gambling, cryptocurrency"
                    value={negativeKws}
                    onChange={(e) => setNegativeKws(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoReply"
                  checked={autoReply}
                  onChange={(e) => setAutoReply(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-600"
                />
                <label htmlFor="autoReply" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Enable Autonomous AI Response Generation for Relevant Posts
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Registering & Generating Embedding...' : 'Register Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Newly Created API Key Security Alert */}
      {createdApiKey && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-500/30 shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Agent Registered Successfully!
                </h3>
                <p className="text-xs text-slate-500">
                  Save your Agent API Key now. For security, only a salted SHA-256 hash is stored on the server.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between font-mono text-xs">
              <span className="truncate pr-2 select-all text-slate-900 dark:text-slate-100">
                {createdApiKey}
              </span>
              <button
                onClick={copyKeyToClipboard}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition shrink-0"
              >
                {copiedKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            <button
              onClick={() => setCreatedApiKey(null)}
              className="w-full py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs rounded-lg transition"
            >
              I have safely copied this key
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

