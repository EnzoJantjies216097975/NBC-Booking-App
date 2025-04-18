import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Alert } from 'react-native';
import { auth, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import * as Device from 'expo-device';
import { savePushToken } from '../utils/notifications';

// Define types for context
type UserDetails = {
  uid: string;
  email: string;
  name: string;
  role: 'producer' | 'booking_officer' | 'operator';
  specialization?: string;
  createdAt: any;
  lastSeen: any;
};

type AuthContextType = {
  currentUser: User | null;
  userDetails: UserDetails | null;
  register: (email: string, password: string, name: string, role: string, specialization?: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  fetchUserDetails: (uid: string) => Promise<UserDetails | null>;
  authInitialized: boolean;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth provider component
type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Register user with email and password
  async function register(email: string, password: string, name: string, role: string, specialization: string | undefined = undefined) {
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
      } as UserDetails;

      if (specialization && role === 'operator') {
        userData.specialization = specialization;
      }

      await setDoc(doc(db, 'users', user.uid), userData);
      
      // Save push notification token
      if (Device.isDevice) {
        await savePushToken(user.uid);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error("Registration error:", error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Login with email and password
  async function login(email: string, password: string) {
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
    } catch (error: any) {
      console.error("Login error:", error);
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
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Reset password
  async function resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Fetch user details from Firestore
  async function fetchUserDetails(uid: string) {
    console.log("Fetching user details for:", uid);
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      console.log("User doc exists:", userDoc.exists());
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserDetails;
        console.log("Got user data:", JSON.stringify(userData));
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
    console.log("Starting auth state check");
    let authTimeout: NodeJS.Timeout;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? `User logged in: ${user.uid}` : "No user");
      
      clearTimeout(authTimeout);
      setCurrentUser(user);
      
      if (user) {
        console.log("Fetching user details for ID:", user.uid);
        try {
          await fetchUserDetails(user.uid);
        } catch (error) {
          console.error("Error in fetchUserDetails:", error);
        }
      } else {
        setUserDetails(null);
      }
      
      setLoading(false);
      setAuthInitialized(true);
      console.log("Auth loading finished");
    });
    
    // Failsafe in case Firebase auth doesn't initialize properly
    authTimeout = setTimeout(() => {
      console.log("Auth timeout reached, proceeding with app");
      setLoading(false);
      setAuthInitialized(true);
    }, 5000);
  
    return () => {
      unsubscribe();
      clearTimeout(authTimeout);
    };
  }, []);

  const value = {
    currentUser,
    userDetails,
    register,
    login,
    logout,
    resetPassword,
    fetchUserDetails,
    authInitialized
  };

  // Don't render children until auth is initialized OR timeout is reached
  return (
    <AuthContext.Provider value={value}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
}