import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBk_6hPIlrmynRs1LY1gmHO2SSlVIYuwPQ",
  authDomain: "xpensia-505ac.firebaseapp.com",
  projectId: "xpensia-505ac",
  storageBucket: "xpensia-505ac.firebasestorage.app",
  messagingSenderId: "495648821355",
  appId: "1:495648821355:web:YOUR_WEB_APP_ID", // Replace with actual web app ID from Firebase console
  measurementId: "G-XXXXXXXXXX" // Replace with actual measurement ID from Firebase console
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export default app;