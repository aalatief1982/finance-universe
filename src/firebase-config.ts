import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAl0ikuXTAw_3u3GHVLRXcLANL9s3MBcxk",
  authDomain: "xpensia-505ac.firebaseapp.com",
  projectId: "xpensia-505ac",
  storageBucket: "xpensia-505ac.firebasestorage.app",
  messagingSenderId: "495648821355",
  appId: "1:495648821355:web:fe5e00798f7fd290cb212e",
  measurementId: "G-0LG7960PW8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export default app;