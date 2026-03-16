import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Tweet from '../components/Tweet';
import TweetForm from '../components/TweetForm';

const Home = () => {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTweets();
  }, []);

  const loadTweets = async () => {
    try {
      const data = await api.getTweets();
      setTweets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTweetCreated = (tweet) => {
    setTweets([tweet, ...tweets]);
  };

  const handleTweetDeleted = (id) => {
    setTweets(tweets.filter(t => t._id !== id));
  };

  return (
    <div className="main-content">
      <div style={styles.header}>
        <h1 style={styles.title}>Home</h1>
      </div>
      
      {user && <TweetForm onTweetCreated={handleTweetCreated} />}
      
      <div style={styles.timeline}>
        {loading ? (
          <div style={styles.loading}>Loading...</div>
        ) : tweets.length === 0 ? (
          <div style={styles.empty}>
            No tweets yet. Follow some users or post your first tweet!
          </div>
        ) : (
          tweets.map(tweet => (
            <Tweet 
              key={tweet._id} 
              tweet={tweet} 
              onDelete={handleTweetDeleted}
            />
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
    fontWeight: '700'
  },
  timeline: {
    minHeight: '100vh'
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--text-secondary)'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--text-secondary)'
  }
};

export default Home;
