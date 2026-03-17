import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { db, auth } from '../firebase';

// Cache to avoid re-fetching the same user doc multiple times per session
const userCache = {};

async function resolveUser(uid) {
  if (userCache[uid]) return userCache[uid];
  
  // Retry logic: Firestore may reject reads briefly after auth token is issued
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        const userData = { _id: uid, ...docSnap.data() };
        userCache[uid] = userData;
        return userData;
      }
      // Doc doesn't exist — no point retrying
      break;
    } catch (err) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 800));
      }
    }
  }
  return { _id: uid, username: 'unknown', displayName: 'Unknown' };
}

// Call this to invalidate cache (e.g. after profile update)
export function clearUserCache(uid) {
  if (uid) {
    delete userCache[uid];
  } else {
    Object.keys(userCache).forEach(k => delete userCache[k]);
  }
}

async function hydrateTweet(tweetDoc) {
  const data = typeof tweetDoc.data === 'function' ? tweetDoc.data() : tweetDoc;
  const id = tweetDoc.id || data._id;
  const authorUid = data.author;
  const user = await resolveUser(authorUid);
  return { _id: id, ...data, user };
}

export const api = {
  async getTweets() {
    const q = query(collection(db, 'tweets'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return Promise.all(snapshot.docs.map(d => hydrateTweet(d)));
  },

  async getFeed() {
    const user = auth.currentUser;
    if (!user) return [];

    // Get current user's following list
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const following = userDoc.exists() ? (userDoc.data().following || []) : [];

    // Include the user's own tweets + followed users' tweets
    const feedAuthors = [user.uid, ...following];

    if (feedAuthors.length === 0) return [];

    // Firestore `in` queries support max 30 values, so batch if needed
    const batches = [];
    for (let i = 0; i < feedAuthors.length; i += 30) {
      const batch = feedAuthors.slice(i, i + 30);
      const q = query(
        collection(db, 'tweets'),
        where('author', 'in', batch),
        orderBy('createdAt', 'desc')
      );
      batches.push(getDocs(q));
    }

    const snapshots = await Promise.all(batches);
    const allDocs = snapshots.flatMap(s => s.docs);

    // Sort merged results by createdAt descending
    allDocs.sort((a, b) => {
      const aTime = a.data().createdAt || '';
      const bTime = b.data().createdAt || '';
      return bTime.localeCompare(aTime);
    });

    return Promise.all(allDocs.map(d => hydrateTweet(d)));
  },

  async getUserTweets(userId) {
    const q = query(
      collection(db, 'tweets'), 
      where('author', '==', userId), 
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return Promise.all(snapshot.docs.map(d => hydrateTweet(d)));
  },

  async getTweet(id) {
    const docRef = doc(db, 'tweets', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Tweet not found');
    return hydrateTweet(docSnap);
  },

  async createTweet(content, replyTo = null) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const newTweetData = {
      content,
      author: user.uid,
      likes: [],
      retweets: [],
      replies: [],
      replyTo,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'tweets'), newTweetData);
    
    // If it's a reply, update parent tweet's replies array
    if (replyTo) {
      const parentRef = doc(db, 'tweets', replyTo);
      await updateDoc(parentRef, {
        replies: arrayUnion(docRef.id)
      });
    }

    // Hydrate the newly created tweet with user data
    const authorData = await resolveUser(user.uid);
    return { _id: docRef.id, ...newTweetData, user: authorData };
  },

  async deleteTweet(id) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const tweetRef = doc(db, 'tweets', id);
    const tweetSnap = await getDoc(tweetRef);
    if (tweetSnap.exists() && tweetSnap.data().author === user.uid) {
      await deleteDoc(tweetRef);
      return { msg: 'Deleted' };
    }
    throw new Error('Unauthorized');
  },

  async likeTweet(id) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const tweetRef = doc(db, 'tweets', id);
    const tweetSnap = await getDoc(tweetRef);
    if (!tweetSnap.exists()) throw new Error('Tweet not found');

    const likes = tweetSnap.data().likes || [];
    if (likes.includes(user.uid)) {
      await updateDoc(tweetRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(tweetRef, { likes: arrayUnion(user.uid) });
    }
    const updatedSnap = await getDoc(tweetRef);
    // Return just the likes array to match what Tweet.jsx expects
    return updatedSnap.data().likes || [];
  },

  async retweet(id) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const tweetRef = doc(db, 'tweets', id);
    const tweetSnap = await getDoc(tweetRef);
    if (!tweetSnap.exists()) throw new Error('Tweet not found');

    const retweets = tweetSnap.data().retweets || [];
    if (retweets.includes(user.uid)) {
      await updateDoc(tweetRef, { retweets: arrayRemove(user.uid) });
    } else {
      await updateDoc(tweetRef, { retweets: arrayUnion(user.uid) });
    }
    const updatedSnap = await getDoc(tweetRef);
    // Return just the retweets array to match what Tweet.jsx expects
    return updatedSnap.data().retweets || [];
  },

  async replyToTweet(id, content) {
    return this.createTweet(content, id);
  },

  async getUser(id) {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('User not found');
    return { _id: docSnap.id, ...docSnap.data() };
  },

  async getUserByUsername(username) {
    const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) throw new Error('User not found');
    const userDoc = snapshot.docs[0];
    return { _id: userDoc.id, ...userDoc.data() };
  },

  async searchUsers(qStr) {
    const searchString = qStr.toLowerCase();
    const q = query(
      collection(db, 'users'), 
      where('username', '>=', searchString),
      where('username', '<=', searchString + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ _id: d.id, ...d.data() }));
  },

  async followUser(id) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const targetUserRef = doc(db, 'users', id);
    const currentUserRef = doc(db, 'users', user.uid);

    const [targetUserSnap, currentUserSnap] = await Promise.all([
      getDoc(targetUserRef), getDoc(currentUserRef)
    ]);

    if (!targetUserSnap.exists()) throw new Error('Target user not found');
    
    if (currentUserSnap.data().following?.includes(id)) {
      await updateDoc(currentUserRef, { following: arrayRemove(id) });
      await updateDoc(targetUserRef, { followers: arrayRemove(user.uid) });
    } else {
      await updateDoc(currentUserRef, { following: arrayUnion(id) });
      await updateDoc(targetUserRef, { followers: arrayUnion(user.uid) });
    }
    
    const updatedTargetSnap = await getDoc(targetUserRef);
    return { _id: updatedTargetSnap.id, ...updatedTargetSnap.data() };
  },

  async updateProfile(data) {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, data);
    
    // Clear cache for this user so fresh data is used
    delete userCache[user.uid];
    
    const updatedSnap = await getDoc(userRef);
    return { _id: updatedSnap.id, ...updatedSnap.data() };
  }
};
