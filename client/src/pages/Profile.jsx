import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Tweet from '../components/Tweet';
import TweetForm from '../components/TweetForm';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', avatar: '' });

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const user = await api.getUserByUsername(username);
      setProfileUser(user);
      setIsFollowing(user.followers?.includes(currentUser?.uid || currentUser?._id));
      
      const userTweets = await api.getUserTweets(user._id);
      setTweets(userTweets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const result = await api.followUser(profileUser._id);
      setProfileUser(result);
      setIsFollowing(result.followers?.includes(currentUser.uid || currentUser._id));
    } catch (error) {
      console.error('Follow error:', error);
      alert('Failed to follow/unfollow. Please try again.');
    }
  };

  const handleTweetCreated = (tweet) => {
    setTweets([tweet, ...tweets]);
  };

  const handleEditClick = () => {
    setEditForm({
      displayName: profileUser.displayName || '',
      bio: profileUser.bio || '',
      avatar: profileUser.avatar || ''
    });
    setShowEdit(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress image using canvas to avoid exceeding Firestore 1MB limits
        const img = new Image();
        img.onload = () => {
          const MAX_SIZE = 300; // max width/height
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to JPEG with 0.8 quality to significantly reduce file size
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setEditForm({ ...editForm, avatar: compressedDataUrl });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updateProfile(editForm);
      setProfileUser(updated);
      setShowEdit(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to save profile. The image might be too large or there was a network error.');
    }
  };

  const isOwnProfile = currentUser?.username === username;

  if (loading) {
    return <div className="main-content" style={styles.loading}>Loading...</div>;
  }

  if (!profileUser) {
    return <div className="main-content" style={styles.loading}>User not found</div>;
  }

  return (
    <div className="main-content">
      {showEdit && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h2>Edit Profile</h2>
            <form onSubmit={handleEditSubmit}>
              <input
                type="text"
                placeholder="Display Name"
                className="input"
                style={styles.input}
                value={editForm.displayName}
                onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
              />
              <textarea
                placeholder="Bio"
                className="input"
                style={{...styles.input, minHeight: '80px'}}
                value={editForm.bio}
                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
              />
              <div style={styles.avatarUpload}>
                {editForm.avatar && (
                  <img src={editForm.avatar} alt="Preview" style={styles.avatarPreview} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={styles.fileInput}
                />
              </div>
              <input
                type="text"
                placeholder="Or paste Avatar URL"
                className="input"
                style={styles.input}
                value={editForm.avatar}
                onChange={(e) => setEditForm({...editForm, avatar: e.target.value})}
              />
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowEdit(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div style={styles.header}>
        <img 
          src={profileUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`}
          alt={profileUser.username}
          style={styles.banner}
        />
        <div style={styles.profileInfo}>
          <img 
            src={profileUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`}
            alt={profileUser.username}
            style={styles.avatar}
          />
          <div style={styles.actions}>
            {isOwnProfile ? (
              <button onClick={handleEditClick} className="btn btn-outline">Edit Profile</button>
            ) : (
              <button 
                onClick={handleFollow}
                className={isFollowing ? 'btn btn-outline' : 'btn btn-primary'}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          <h1 style={styles.displayName}>{profileUser.displayName || profileUser.username}</h1>
          <p style={styles.handle}>@{profileUser.username}</p>
          {profileUser.bio && <p style={styles.bio}>{profileUser.bio}</p>}
          <div style={styles.stats}>
            <span><strong>{profileUser.following?.length || 0}</strong> Following</span>
            <span><strong>{profileUser.followers?.length || 0}</strong> Followers</span>
          </div>
        </div>
      </div>

      {isOwnProfile && <TweetForm onTweetCreated={handleTweetCreated} />}

      <div style={styles.tweets}>
        {tweets.map(tweet => (
          <Tweet key={tweet._id} tweet={tweet} />
        ))}
        {tweets.length === 0 && (
          <div style={styles.empty}>No tweets yet</div>
        )}
      </div>
    </div>
  );
};

const styles = {
  loading: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--text-secondary)'
  },
  header: {
    borderBottom: '1px solid var(--border)'
  },
  banner: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    background: 'linear-gradient(45deg, #1d9bf0, #00ba7c)'
  },
  profileInfo: {
    padding: '16px',
    position: 'relative'
  },
  avatar: {
    width: '134px',
    height: '134px',
    borderRadius: '50%',
    border: '4px solid var(--bg)',
    position: 'absolute',
    top: '-67px',
    left: '16px',
    background: 'var(--bg)'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '8px'
  },
  displayName: {
    fontSize: '20px',
    fontWeight: '800',
    marginTop: '40px'
  },
  handle: {
    color: 'var(--text-secondary)'
  },
  bio: {
    marginTop: '12px'
  },
  stats: {
    marginTop: '12px',
    display: 'flex',
    gap: '20px',
    color: 'var(--text-secondary)'
  },
  tweets: {
    minHeight: '100vh'
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: 'var(--text-secondary)'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1050
  },
  modalContent: {
    background: 'var(--bg-secondary)',
    padding: '24px',
    borderRadius: '12px',
    width: '400px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  input: {
    width: '100%',
    marginBottom: '12px'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '16px'
  },
  avatarUpload: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  avatarPreview: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover'
  },
  fileInput: {
    color: 'var(--text-secondary)'
  }
};

export default Profile;
