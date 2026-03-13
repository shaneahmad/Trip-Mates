import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import Avatar from './Avatar';
import './Navbar.css';

export default function Navbar() {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const location = useLocation();

  // Don't show navbar on auth pages
  if (['/login', '/register'].includes(location.pathname)) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">✈️</span>
          <span className="navbar-title">TripMates</span>
        </Link>

        <div className="navbar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Search destinations, trips, people..." className="navbar-search-input" />
        </div>

        <div className="navbar-actions">
          <Link to="/notifications" className="navbar-action-btn" title="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </Link>

          <Link to="/chat" className="navbar-action-btn" title="Messages">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </Link>

          <Link to="/profile" className="navbar-profile-link">
            <Avatar src={user?.avatar_url} name={user?.full_name || 'U'} size="sm" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
