import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import Constants from 'expo-constants';

// Get Firebase configuration from app.config.js
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || "AIzaSyBvtk_-n-GkX6yO5O9xfBi5o41q8hUGXBA",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || "bookingapp-429d2.firebaseapp.com",
  databaseURL: Constants.expoConfig?.extra?.firebaseDatabaseUrl || "https://bookingapp-429d2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || "bookingapp-429d2",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || "bookingapp-429d2.firebasestorage.app",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || "853797141233",
  appId: Constants.expoConfig?.extra?.firebaseAppId || "1:853797141233:web:cf9715f6b7b6a622e18750",
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId || "G-1V32L44QX1"
};

console.log("Firebase config:", firebaseConfig);

// Initialize Firebase with proper error handling
let app;
let auth;
let db;
let storage;
let functions;

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
  // Using placeholder empty objects as fallbacks to prevent app crashes
  if (!app) app = {};
  if (!auth) auth = {};
  if (!db) db = {};
  if (!storage) storage = {};
  if (!functions) functions = {};
}

// Export at the top level of the module
export { app, auth, db, storage, functions };