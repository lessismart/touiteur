import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sidebar">
      <Link to="/" className="sidebar-logo">
        🐦 Touiteur
      </Link>
      
      <nav className="sidebar-nav">
        <Link to="/" className="sidebar-link" style={{ fontWeight: isActive('/') ? '700' : '400' }}>
          <span title="Home">🏠 <span className="sidebar-link-text">Home</span></span>
        </Link>
        <Link to="/explore" className="sidebar-link" style={{ fontWeight: isActive('/explore') ? '700' : '400' }}>
          <span title="Explore">🔍 <span className="sidebar-link-text">Explore</span></span>
        </Link>
        <Link to="/notifications" className="sidebar-link" style={{ fontWeight: isActive('/notifications') ? '700' : '400' }}>
          <span title="Notifications">🔔 <span className="sidebar-link-text">Notifications</span></span>
        </Link>
        {user && (
          <Link to={`/profile/${user.username}`} className="sidebar-link" style={{ fontWeight: location.pathname.includes('/profile') ? '700' : '400' }}>
            <span title="Profile">👤 <span className="sidebar-link-text">Profile</span></span>
          </Link>
        )}
      </nav>

      {user ? (
        <div className="sidebar-user-section">
          <div className="sidebar-user-info">
            <img 
              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              alt={user.username}
              className="sidebar-user-avatar"
            />
            <div>
              <div className="sidebar-user-name">{user.displayName || user.username}</div>
              <div className="sidebar-user-handle">@{user.username}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-outline sidebar-logout-btn">
            Logout
          </button>
        </div>
      ) : (
        <div className="sidebar-auth-section">
          <Link to="/login" className="btn btn-outline sidebar-auth-btn">
            Log in
          </Link>
          <Link to="/register" className="btn btn-primary sidebar-auth-btn">
            Sign up
          </Link>
        </div>
      )}
    </div>
  );
};



export default Sidebar;
