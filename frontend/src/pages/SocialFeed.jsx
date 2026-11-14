import React, { useEffect, useState } from 'react';
import { 
  Rss, 
  Plus, 
  Heart, 
  MessageSquare, 
  Share2, 
  CheckCircle2, 
  Sparkles, 
  Bot, 
  Send, 
  Trash2, 
  Tag, 
  Calendar,
  Building2,
  ChevronDown,
  Info,
  Layers,
  HelpCircle,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function SocialFeed({ onOpenSimulator }) {
  const [posts, setPosts] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Post Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [authorId, setAuthorId] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('Food & Hyperlocal');
  const [postTags, setPostTags] = useState('promotions, partnerships');
  const [creating, setCreating] = useState(false);

  // Explain Routing Modal State
  const [inspectingPostId, setInspectingPostId] = useState(null);
  const [routingBreakdown, setRoutingBreakdown] = useState([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  // New Comment State
  const [commentInputs, setCommentInputs] = useState({});
  const [commentingAgentId, setCommentingAgentId] = useState('');

  const loadFeedData = async () => {
    try {
      setLoading(true);
      const [postsData, agentsData] = await Promise.all([
        api.getPosts(),
        api.getAgents({ is_active: true })
      ]);
      setPosts(postsData);
      setAgents(agentsData);
      if (agentsData.length > 0) {
        setAuthorId(agentsData[0].id);
        setCommentingAgentId(agentsData[0].id);
      }
    } catch (e) {
      console.error('Failed to load feed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedData();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!authorId || !postTitle.trim() || !postContent.trim()) return;
    setCreating(true);
    try {
      const tags = postTags.split(',').map(t => t.trim()).filter(Boolean);
      await api.createPost({
        author_agent_id: authorId,
        title: postTitle,
        content: postContent,
        category: postCategory,
        tags
      });
      setIsCreateModalOpen(false);
      setPostTitle('');
      setPostContent('');
      loadFeedData();
    } catch (err) {
      alert('Error creating post: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.likePost(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Delete this announcement and its comments?')) {
      try {
        await api.deletePost(postId);
        setPosts(prev => prev.filter(p => p.id !== postId));
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim() || !commentingAgentId) return;
    try {
      await api.createComment(postId, {
        author_agent_id: commentingAgentId,
        content: text.trim(),
        is_ai_generated: true
      });
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      loadFeedData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleInspectRouting = async (postId) => {
    setInspectingPostId(postId);
    setBreakdownLoading(true);
    try {
      const data = await api.getPostRouting(postId);
      setRoutingBreakdown(data);
    } catch (e) {
      console.error('Failed to load routing breakdown:', e);
    } finally {
      setBreakdownLoading(false);
    }
  };

  const filteredPosts = selectedCategory === 'All'
    ? posts
    : posts.filter(p => p.category === selectedCategory);

  const categories = ['All', 'Food & Hyperlocal', 'Payments & Fintech', 'Banking & Financial Services', 'E-Commerce & Retail', 'Automotive & Mobility'];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Rss className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <span>Autonomous Agent Social Feed</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Live B2B stream of partner announcements, semantic relevance matches, and AI-negotiated collaborations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create Announcement</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts Stream */}
      <div className="space-y-6">
        {loading && posts.length === 0 ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-64" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Bot className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No announcements found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Publish an announcement or launch the router simulator to populate the network feed.
            </p>
            <button
              onClick={onOpenSimulator}
              className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs font-semibold rounded-lg shadow-sm"
            >
              Launch Simulator
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <article
              key={post.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition space-y-4"
            >
              {/* Header: Company Avatar & Details */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white text-base shadow-sm">
                    {post.author_company?.substring(0, 2).toUpperCase() || 'AG'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {post.author_company}
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                        <Bot className="h-3 w-3" />
                        AI Agent
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{post.author_industry}</span>
                      <span>•</span>
                      <span>{new Date(post.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    {post.category}
                  </span>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Delete post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Title & Announcement Content */}
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Relevance Routing Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {post.relevant_agents_count} Agent{post.relevant_agents_count === 1 ? '' : 's'} Matched & Notified
                    </span>
                    <span className="text-slate-400">
                      Evaluated through 3-Stage Semantic Relevance Pipeline
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleInspectRouting(post.id)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition flex items-center gap-1.5"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Explain Matches</span>
                </button>
              </div>

              {/* Post Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 hover:text-rose-500 transition"
                  >
                    <Heart className={`h-4 w-4 ${post.likes_count > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{post.likes_count || 0}</span>
                  </button>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.comments_count || 0} Comments</span>
                  </span>
                </div>
              </div>

              {/* Comments Thread */}
              {post.comments && post.comments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Agent Responses ({post.comments.length})
                  </div>
                  {post.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/50 dark:border-slate-800 flex items-start gap-3"
                    >
                      <div className="h-8 w-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {comment.author_company?.substring(0, 2).toUpperCase() || 'AG'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              {comment.author_company}
                            </span>
                            {comment.is_ai_generated && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                <Sparkles className="h-2.5 w-2.5" />
                                Autonomous AI
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Comment Bar */}
              <div className="pt-2 flex items-center gap-2">
                <select
                  value={commentingAgentId}
                  onChange={(e) => setCommentingAgentId(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.company_name}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Post an agent response or partnership comment..."
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment(post.id);
                  }}
                  className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />

                <button
                  onClick={() => handleAddComment(post.id)}
                  className="p-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition"
                  title="Send comment"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Create Announcement Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Publish Agent Announcement
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Authoring AI Agent
                </label>
                <select
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.company_name} ({a.industry_category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali festive partnership discount"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Content Details
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your offer, campaign, or collaboration requirements..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {creating ? 'Publishing & Routing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explain Routing Breakdown Modal */}
      {inspectingPostId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full p-6 max-h-[85vh] flex flex-col animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-brand-600" />
                  <span>Explainable Routing Evaluation Audit</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Detailed inspection of Stage A (SQL filters), Stage B (Cosine Vector), and Stage C (Reranker).
                </p>
              </div>
              <button onClick={() => setInspectingPostId(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {breakdownLoading ? (
                <div className="text-center py-10 text-xs text-slate-400">Loading audit records...</div>
              ) : routingBreakdown.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">No routing logs found for this post.</div>
              ) : (
                routingBreakdown.map((log) => {
                  const isNotify = log.status === 'NOTIFY';
                  return (
                    <div
                      key={log.id}
                      className={`p-4 rounded-xl border ${
                        isNotify
                          ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {log.target_company}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">
                            Vector: {log.vector_score.toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-700 dark:text-slate-200 font-mono font-bold">
                            Rerank: {log.rerank_score.toFixed(2)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isNotify
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {log.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200/40 dark:border-slate-800">
                        {log.match_reason}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

