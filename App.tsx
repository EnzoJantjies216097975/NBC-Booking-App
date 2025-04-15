import React, { useEffect, useState  } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import Navigation from './src/navigation';
import { auth, db } from './src/config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';



// Define the app theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1976D2',
    accent: '#FF4081',
  },
};

// Just before you return the main app component
// DEVELOPMENT ONLY - REMOVE FOR PRODUCTION
export default function App() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const email = "test@example.com";
      const password = "password123";
      
      signInWithEmailAndPassword(auth, email, password)
        .then(() => console.log("Dev login successful"))
        .catch((error) => {
          console.log("Creating test account");
          createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
              const user = userCredential.user;
              const userRef = doc(db, 'users', user.uid);
              setDoc(userRef, {
                uid: user.uid,
                email,
                name: "Test User",
                role: "producer",
                createdAt: serverTimestamp(),
                lastSeen: serverTimestamp()
              });
            })
            .catch(e => console.error("Dev account setup failed:", e));
        });
    }
  }, []);

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <NavigationContainer>
              <Navigation />
            </NavigationContainer>
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

