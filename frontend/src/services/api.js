const API_BASE = '/api/v1';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('agentconnect_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred.';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch (_) {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const api = {
  // Analytics
  getMetrics: () => request('/analytics/metrics'),
  getEngagement: () => request('/analytics/engagement'),

  // Agents
  getAgents: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/agents${q ? `?${q}` : ''}`);
  },
  getAgent: (id) => request(`/agents/${id}`),
  registerAgent: (data) => request('/agents/register', { method: 'POST', body: JSON.stringify(data) }),
  updateAgent: (id, data) => request(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAgent: (id) => request(`/agents/${id}`, { method: 'DELETE' }),
  activateAgent: (id) => request(`/agents/${id}/activate`, { method: 'POST' }),
  deactivateAgent: (id) => request(`/agents/${id}/deactivate`, { method: 'POST' }),

  // Posts
  getPosts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/posts${q ? `?${q}` : ''}`);
  },
  getPost: (id) => request(`/posts/${id}`),
  createPost: (data) => request('/posts', { method: 'POST', body: JSON.stringify(data) }),
  likePost: (id) => request(`/posts/${id}/like`, { method: 'POST' }),

  // Comments
  getComments: (postId) => request(`/posts/${postId}/comments`),
  createComment: (postId, data) => request(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  deleteComment: (id) => request(`/comments/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/notifications${q ? `?${q}` : ''}`);
  },
  getAgentNotifications: (agentId) => request(`/agents/${agentId}/notifications`),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),

  // Routing Logs
  getRoutingLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/routing/logs${q ? `?${q}` : ''}`);
  },
  getPostRouting: (postId) => request(`/routing/posts/${postId}`),

  // Simulator & Seed
  simulateRouting: (data) => request('/simulator/simulate', { method: 'POST', body: JSON.stringify(data) }),
  resetSeedData: () => request('/simulator/reset-seed', { method: 'POST' }),

  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/auth/me'),
};

