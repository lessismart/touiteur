import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Flag to prevent onAuthStateChanged from overwriting data set by register/login
  const skipNextAuthChange = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If register/login just set the user state, skip this callback
      if (skipNextAuthChange.current) {
        skipNextAuthChange.current = false;
        setLoading(false);
        return;
      }

      if (firebaseUser) {
        try {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...docSnap.data() });
          } else {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
          }
        } catch (err) {
          console.warn('Firestore read failed in auth listener:', err.message);
          // Still set basic user so the app doesn't get stuck on loading
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle setting the user
  };

  const register = async (username, email, password, displayName) => {
    let firebaseUser;
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      firebaseUser = userCredential.user;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, password);
          firebaseUser = cred.user;
          const existing = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (existing.exists()) {
            // Profile already exists — skip creation, let onAuthStateChanged handle it
            return;
          }
        } catch (loginErr) {
          throw new Error('An account with this email already exists. Please sign in.');
        }
      } else {
        throw err;
      }
    }
    
    // Create user profile in Firestore
    const userData = {
      username: username.toLowerCase(),
      email,
      displayName: displayName || username,
      profilePicture: '',
      bio: '',
      followers: [],
      following: [],
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    
    // Prevent onAuthStateChanged from overwriting our complete user data
    skipNextAuthChange.current = true;
    setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userData });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    // Check if the user already exists in Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      // First time Google sign in — create profile
      const usernameBase = firebaseUser.email.split('@')[0].toLowerCase();
      // Add random numbers to ensure uniqueness (simple approach)
      const username = `${usernameBase}${Math.floor(Math.random() * 10000)}`;

      const userData = {
        username: username,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || usernameBase,
        profilePicture: firebaseUser.photoURL || '',
        bio: '',
        followers: [],
        following: [],
        createdAt: new Date().toISOString()
      };
      
      await setDoc(userDocRef, userData);
      
      // Prevent onAuthStateChanged from overwriting user data
      skipNextAuthChange.current = true;
      setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...userData });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
