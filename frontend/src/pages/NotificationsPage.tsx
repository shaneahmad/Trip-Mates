import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useNotificationStore } from '../store/notificationStore';
import Avatar from '../components/Avatar';
import './NotificationsPage.css';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at?: string;
  sender_name?: string;
  sender_avatar?: string;
  reference_id?: string;
  reference_type?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadCount } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications');
      setNotifications(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // handle error
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    // Mark as read
    if (!notif.read) {
      await api.put(`/api/notifications/${notif.id}/read`);
      setNotifications(notifications.map((n) => n.id === notif.id ? { ...n, read: true } : n));
    }

    // Navigate based on type
    if (notif.reference_type === 'conversation') {
      navigate(`/chat/${notif.reference_id}`);
    } else if (notif.reference_type === 'trip') {
      navigate('/explore');
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'match': return '💝';
      case 'trip_join': return '✈️';
      case 'like': return '❤️';
      case 'comment': return '💬';
      default: return '🔔';
    }
  };

  return (
    <div className="page-container notifications-page">
      <div className="page-header animate-fadeInUp">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Notifications</h1>
            <p>Stay updated on your travel connections</p>
          </div>
          {notifications.some((n) => !n.read) && (
            <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card" style={{ marginBottom: 8 }}>
              <div className="card-body" style={{ display: 'flex', gap: 12, padding: 16 }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 999 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: 200, height: 16, marginBottom: 4 }} />
                  <div className="skeleton" style={{ width: 140, height: 12 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔔</div>
          <h3>No notifications</h3>
          <p>You'll be notified when someone matches with you, joins your trip, or sends you a message.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((notif, idx) => (
            <div
              key={notif.id}
              className={`notification-item card animate-fadeInUp ${!notif.read ? 'notification-unread' : ''}`}
              style={{ animationDelay: `${idx * 0.03}s`, cursor: 'pointer' }}
              onClick={() => handleNotificationClick(notif)}
            >
              <div className="card-body notification-item-inner">
                <div className="notification-icon-wrap">
                  {notif.sender_avatar ? (
                    <Avatar src={notif.sender_avatar} name={notif.sender_name || 'U'} />
                  ) : (
                    <span className="notification-icon">{getNotifIcon(notif.type)}</span>
                  )}
                </div>
                <div className="notification-content">
                  <p className="notification-title">{notif.title}</p>
                  <p className="notification-message">{notif.message}</p>
                  <span className="notification-time">{formatTime(notif.created_at)}</span>
                </div>
                {!notif.read && <div className="notification-dot" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
