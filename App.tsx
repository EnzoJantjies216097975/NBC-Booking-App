import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import Navigation from './src/navigation';

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
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    // Auto-login for development
    const email = "test@example.com";
    const password = "password123";
    
    auth.signInWithEmailAndPassword(email, password)
      .then(() => console.log("Dev login successful"))
      .catch((error) => {
        console.log("Creating test account");
        auth.createUserWithEmailAndPassword(email, password)
          .then((userCredential) => {
            const user = userCredential.user;
            const userRef = doc(db, 'users', user.uid);
            setDoc(userRef, {
              uid: user.uid,
              email,
              name: "Test User",
              role: "producer", // Choose your test role
              createdAt: serverTimestamp(),
              lastSeen: serverTimestamp()
            });
          })
          .catch(e => console.error("Dev account setup failed:", e));
      });
  }
}, []);

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <NavigationContainer>
              <Navigation />
              <StatusBar style="auto" />
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

