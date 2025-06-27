import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAl0ikuXTAw_3u3GHVLRXcLANL9s3MBcxk',
  authDomain: 'xpensia-505ac.firebaseapp.com',
  projectId: 'xpensia-505ac',
  // Add other config fields as needed
  storageBucket: "xpensia-505ac.firebasestorage.app",
  messagingSenderId: "495648821355",
  appId: "1:495648821355:web:fe5e00798f7fd290cb212e",
  measurementId: "G-0LG7960PW8"
};

// Initialize Firebase app only once
export const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
