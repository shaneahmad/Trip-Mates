import { NavLink, useLocation } from 'react-router-dom';
import './BottomNav.css';

export default function BottomNav() {
  const location = useLocation();

  if (['/login', '/register'].includes(location.pathname)) return null;

  const navItems = [
    { to: '/', icon: '🏠', label: 'Home', svgPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { to: '/explore', icon: '🔍', label: 'Explore', svgPath: 'M11 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 0l4.35 4.35' },
    { to: '/create-trip', icon: '➕', label: 'Create', special: true },
    { to: '/discover', icon: '💝', label: 'Discover', svgPath: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
    { to: '/profile', icon: '👤', label: 'Profile', svgPath: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `bottom-nav-item ${isActive ? 'active' : ''} ${item.special ? 'bottom-nav-item-special' : ''}`
          }
        >
          {item.special ? (
            <div className="bottom-nav-create-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          ) : (
            <span className="bottom-nav-icon">{item.icon}</span>
          )}
          <span className="bottom-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
