import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBhUtmu2Lt4ebeLTsBzEK1i3yzXwUduknM",
  authDomain: "touiteur-dev-12345.firebaseapp.com",
  projectId: "touiteur-dev-12345",
  storageBucket: "touiteur-dev-12345.firebasestorage.app",
  messagingSenderId: "351354268156",
  appId: "1:351354268156:web:ebf9fbf72b8260b970aa79"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
