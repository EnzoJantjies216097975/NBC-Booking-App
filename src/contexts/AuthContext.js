// src/contexts/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import * as Device from 'expo-device';
import { savePushToken } from '../utils/notifications';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register user with email and password
  async function register(email, password, name, role, specialization = null) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      const userData = {
        uid: user.uid,
        email,
        name,
        role,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp()
      };

      if (specialization && role === 'operator') {
        userData.specialization = specialization;
      }

      await setDoc(doc(db, 'users', user.uid), userData);
      
      // Save push notification token
      if (Device.isDevice) {
        await savePushToken(user.uid);
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Login with email and password
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last seen
      const userRef = doc(db, 'users', userCredential.user.uid);
      await updateDoc(userRef, {
        lastSeen: serverTimestamp()
      });
      
      // Save push notification token
      if (Device.isDevice) {
        await savePushToken(userCredential.user.uid);
      }
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Logout
  async function logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Reset password
  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Fetch user details from Firestore
  async function fetchUserDetails(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserDetails(userData);
        return userData;
      } else {
        console.error('No user document found');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserDetails(user.uid);
      } else {
        setUserDetails(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userDetails,
    register,
    login,
    logout,
    resetPassword,
    fetchUserDetails,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}