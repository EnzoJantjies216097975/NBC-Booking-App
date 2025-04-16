import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import Constants from 'expo-constants';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey ?? "",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain ?? "bookingapp-429d2.firebaseapp.com",
  databaseURL: Constants.expoConfig?.extra?.firebaseDatabaseUrl ?? "https://bookingapp-429d2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId ?? "bookingapp-429d2",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket ?? "bookingapp-429d2.firebasestorage.app",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId ?? "853797141233",
  appId: Constants.expoConfig?.extra?.firebaseAppId ?? "1:853797141233:web:cf9715f6b7b6a622e18750",
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId ?? "G-1V32L44QX1"
};

let app = null;
let auth = null;
let db = null;
let storage = null;
let functions = null;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Consider adding fallback or recovery mechanism
}

// Export at the top level of the module
export { app, auth, db, storage, functions };