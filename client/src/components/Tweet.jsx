import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { useState } from 'react';

const Tweet = ({ tweet, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const userId = user?.uid || user?._id;
  const [liked, setLiked] = useState(tweet.likes?.includes(userId));
  const [likesCount, setLikesCount] = useState(tweet.likes?.length || 0);
  const [retweeted, setRetweeted] = useState(tweet.retweets?.includes(userId));
  const [retweetsCount, setRetweetsCount] = useState(tweet.retweets?.length || 0);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleLike = async () => {
    const newLikes = await api.likeTweet(tweet._id);
    setLiked(newLikes.includes(userId));
    setLikesCount(newLikes.length);
  };

  const handleRetweet = async () => {
    const newRetweets = await api.retweet(tweet._id);
    setRetweeted(newRetweets.includes(userId));
    setRetweetsCount(newRetweets.length);
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    await api.replyToTweet(tweet._id, replyContent);
    setReplyContent('');
    setShowReply(false);
  };

  const handleDelete = async () => {
    await api.deleteTweet(tweet._id);
    onDelete?.(tweet._id);
  };

  const isOwner = userId === tweet.user?._id;

  return (
    <div className="tweet" style={styles.tweet}>
      <img 
        src={tweet.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tweet.user.username}`} 
        alt={tweet.user.username}
        style={styles.avatar}
      />
      <div style={styles.content}>
        <div style={styles.header}>
          <span style={styles.displayName}>{tweet.user.displayName || tweet.user.username}</span>
          <span style={styles.username}>@{tweet.user.username}</span>
          <span style={styles.time}>· {formatDistanceToNow(new Date(tweet.createdAt))}</span>
        </div>
        
        {tweet.replyTo && (
          <div style={styles.replyTo}>
            Replying to @{tweet.replyTo.user?.username}
          </div>
        )}
        
        <p style={styles.text}>{tweet.content}</p>
        
        <div style={styles.actions}>
          <button onClick={() => setShowReply(!showReply)} style={styles.actionBtn}>
            <span>{tweet.replies?.length || 0}</span> 💬
          </button>
          <button onClick={handleRetweet} style={{...styles.actionBtn, color: retweeted ? '#00ba7c' : undefined}}>
            <span>{retweetsCount}</span> 🔁
          </button>
          <button onClick={handleLike} style={{...styles.actionBtn, color: liked ? '#f4212e' : undefined}}>
            <span>{likesCount}</span> ❤️
          </button>
          {isOwner && (
            <button onClick={handleDelete} style={{...styles.actionBtn, color: '#f4212e'}}>
              🗑️
            </button>
          )}
        </div>

        {showReply && (
          <div style={styles.replyBox}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Tweet your reply..."
              style={styles.replyInput}
            />
            <button onClick={handleReply} className="btn btn-primary" style={{marginTop: '10px'}}>
              Reply
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  tweet: {
    display: 'flex',
    padding: '16px',
    borderBottom: '1px solid var(--border)',
    gap: '12px'
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  content: {
    flex: 1
  },
  header: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    marginBottom: '4px'
  },
  displayName: {
    fontWeight: '700'
  },
  username: {
    color: 'var(--text-secondary)'
  },
  time: {
    color: 'var(--text-secondary)'
  },
  replyTo: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    marginBottom: '4px'
  },
  text: {
    fontSize: '15px',
    lineHeight: '1.5',
    marginBottom: '12px'
  },
  actions: {
    display: 'flex',
    gap: '20px',
    maxWidth: '400px'
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    cursor: 'pointer'
  },
  replyBox: {
    marginTop: '12px',
    padding: '12px',
    background: 'var(--bg-secondary)',
    borderRadius: '8px'
  },
  replyInput: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: 'var(--text)',
    fontSize: '15px',
    resize: 'none',
    outline: 'none'
  }
};

export default Tweet;
