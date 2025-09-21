import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/*
// Firebase Console의 Web App 설정값으로 교체
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MSG_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
*/
const firebaseConfig = {
  apiKey: "AIzaSyC5WPEOS2Z1Zy63XxPSSHnhqh8CUAGscN8",
  authDomain: "sbchoi-60016.firebaseapp.com",
  projectId: "sbchoi-60016",
  storageBucket: "sbchoi-60016.firebasestorage.app",
  messagingSenderId: "365315681853",
  appId: "1:365315681853:web:58008ce32d2e4934484454",
  measurementId: "G-3MLX42ZXHQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
