import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [liveToast, setLiveToast] = useState(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications({ limit: 30 });
      setNotifications(data);
      setUnreadCount(data.filter(n => n.status !== 'Read').length);
    } catch (e) {
      console.warn('[NotificationContext] Failed to fetch notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Setup SSE connection
    let eventSource;
    try {
      eventSource = new EventSource('/api/v1/notifications/stream');

      eventSource.addEventListener('NEW_POST_ROUTED', (e) => {
        const payload = JSON.parse(e.data);
        setLiveToast({
          title: 'Post Semantic Routing Complete',
          message: `${payload.data.author_company} posted "${payload.data.title}". ${payload.data.notified_count} agents notified, ${payload.data.comments_count} AI replies generated.`,
          type: 'success',
          timestamp: new Date().toLocaleTimeString()
        });
        fetchNotifications();
      });

      eventSource.onerror = () => {
        // Fallback polling if SSE drops
        eventSource.close();
      };
    } catch (e) {
      console.warn('[NotificationContext] SSE setup error:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, status: 'Read', read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      liveToast,
      setLiveToast,
      fetchNotifications,
      markAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);

