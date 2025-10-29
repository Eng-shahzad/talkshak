// Updated for Firebase v9+ (modular SDK)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCmHtVXzcN4BIs4Eu33uSJ1drXlnwDypqc",
  authDomain: "talkshak-app.firebaseapp.com",
  projectId: "talkshak-app",
  storageBucket: "talkshak-app.firebasestorage.app",
  messagingSenderId: "507355222941",
  appId: "1:507355222941:web:030ec6a86f2d0b5cc19574",
  measurementId: "G-EM4CRY9B5X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
