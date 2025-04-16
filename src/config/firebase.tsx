import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import Constants from 'expo-constants';

// Your web app's Firebase configuration
// Replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey ?? "AIzaSyCOcFalnN75Ta7FbM9yYDOSPQRXeTK4vxo",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain ?? "bookingapp-429d2.firebaseapp.com",
  databaseURL: Constants.expoConfig?.extra?.firebaseDatabaseUrl ?? "https://bookingapp-429d2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId ?? "bookingapp-429d2",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket ?? "bookingapp-429d2.firebasestorage.app",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId ?? "853797141233",
  appId: Constants.expoConfig?.extra?.firebaseAppId ?? "1:853797141233:web:cf9715f6b7b6a622e18750",
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId ?? "G-1V32L44QX1"
};

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

export { app, auth, db, storage, functions };
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Consider adding fallback or recovery mechanism
}