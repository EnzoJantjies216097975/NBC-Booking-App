import { Stack } from 'expo-router';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/contexts/AuthContext';
import { NotificationProvider } from '../src/contexts/NotificationContext';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1976D2',
    accent: '#FF4081',
  },
};

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <AuthProvider>
          <NotificationProvider>
            <Stack />
          </NotificationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}