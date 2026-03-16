import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const Explore = () => {
  const { user: currentUser } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = async (q) => {
    if (!q.trim()) {
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const results = await api.searchUsers(q);
      setUsers(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(query);
    }, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="main-content">
      <div style={styles.header}>
        <h1 style={styles.title}>Explore</h1>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users..."
          className="input"
          style={styles.search}
        />
      </div>

      <div style={styles.results}>
        {loading ? (
          <div style={styles.loading}>Searching...</div>
        ) : users.length === 0 && query ? (
          <div style={styles.empty}>No users found</div>
        ) : (
          users.map(u => (
            <Link 
              to={`/profile/${u.username}`} 
              key={u._id}
              style={styles.userCard}
            >
              <img 
                src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                alt={u.username}
                style={styles.avatar}
              />
              <div style={styles.userInfo}>
                <div style={styles.displayName}>{u.displayName || u.username}</div>
                <div style={styles.handle}>@{u.username}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  header: {
    padding: '16px',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(12px)',
    zIndex: 1
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    marginBottom: '16px'
  },
  search: {
    padding: '12px'
  },
  results: {
    padding: '16px'
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: 'var(--text-secondary)'
  },
  empty: {
    textAlign: 'center',
    padding: '20px',
    color: 'var(--text-secondary)'
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'inherit',
    borderBottom: '1px solid var(--border)'
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%'
  },
  userInfo: {
    flex: 1
  },
  displayName: {
    fontWeight: '700'
  },
  handle: {
    color: 'var(--text-secondary)'
  }
};

export default Explore;
