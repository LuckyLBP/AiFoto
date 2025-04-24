import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyD9JDLjtgeYW4RMrJIUWQZuk2WVaOcEsCU',
  authDomain: 'aifoto-9666a.firebaseapp.com',
  projectId: 'aifoto-9666a',
  storageBucket: 'aifoto-9666a.appspot.com',
  messagingSenderId: '568135978293',
  appId: '1:568135978293:web:bf5275cd6e72c6d177507c',
};

// Check if Firebase app is already initialized to avoid duplicate app initialization error
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // If already initialized, use that one
}

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

export default app;
