import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const TweetForm = ({ onTweetCreated, replyTo = null }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    try {
      const tweet = await api.createTweet(content, replyTo?._id || null);
      setContent('');
      onTweetCreated?.(tweet);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.container}>
        <img 
          src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
          alt={user?.username}
          style={styles.avatar}
        />
        <div style={styles.inputArea}>
          {replyTo && (
            <div style={styles.replyingTo}>
              Replying to @{replyTo.user?.username}
            </div>
          )}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            style={styles.input}
            maxLength={280}
          />
        </div>
      </div>
      <div style={styles.footer}>
        <span style={styles.counter}>{280 - content.length}</span>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!content.trim() || loading}
          style={styles.button}
        >
          {replyTo ? 'Reply' : 'Tweet'}
        </button>
      </div>
    </form>
  );
};

const styles = {
  form: {
    padding: '16px',
    borderBottom: '1px solid var(--border)'
  },
  container: {
    display: 'flex',
    gap: '12px'
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  inputArea: {
    flex: 1
  },
  replyingTo: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    marginBottom: '8px'
  },
  input: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: 'var(--text)',
    fontSize: '20px',
    resize: 'none',
    outline: 'none',
    minHeight: '60px',
    fontFamily: 'inherit'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: '60px',
    paddingTop: '12px'
  },
  counter: {
    color: 'var(--primary)',
    fontSize: '14px',
    fontWeight: '600'
  },
  button: {
    padding: '8px 16px'
  }
};

export default TweetForm;
