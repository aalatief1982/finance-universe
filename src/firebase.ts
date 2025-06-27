import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  // Add other config fields as needed
};

// Initialize Firebase app only once
export const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
