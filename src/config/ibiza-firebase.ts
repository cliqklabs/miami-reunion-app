// Firebase configuration for Ibiza Mockery App
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_IBIZA_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_IBIZA_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_IBIZA_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_IBIZA_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_IBIZA_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_IBIZA_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_IBIZA_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase for Ibiza app
let app;
let db;
let storage;
let auth;
let analytics;

try {
  console.log('Ibiza Firebase Config Check:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  });
  
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig, 'ibiza-app'); // Named app instance
    db = getFirestore(app);
    storage = getStorage(app);
    auth = getAuth(app);
    
    // Analytics only works in browser environment
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
    
    console.log('Firebase initialized successfully for Ibiza Mockery');
  } else {
    console.log('Ibiza Firebase not configured - check environment variables');
    console.log('Missing environment variables. Expected: VITE_IBIZA_FIREBASE_API_KEY, etc.');
  }
} catch (error) {
  console.error('Failed to initialize Firebase for Ibiza:', error);
}

export { app, db, storage, auth, analytics };
