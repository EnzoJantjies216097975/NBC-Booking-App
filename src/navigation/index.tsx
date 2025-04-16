import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { AuthNavigator } from './navigators/AuthNavigators';
import { ProducerStackNavigator } from './navigators/ProducerStackNavigator';
import { BookingOfficerStackNavigator } from './navigators/BookingOfficerStackNavigator';
import { OperatorStackNavigator } from './navigators/OperatorStackNavigator';

// Main Navigation Component
export default function Navigation() {
  const { currentUser, userDetails, authInitialized } = useAuth();

  // If auth hasn't initialized yet, show a loading screen
  if (!authInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If no user is logged in, show auth screens
  if (!currentUser) {
    return <AuthNavigator />;
  }

  // If user is logged in but we don't have their details yet
  if (!userDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Otherwise, show the appropriate screens based on user role
  switch (userDetails.role) {
    case 'producer':
      return <ProducerStackNavigator />;
    case 'booking_officer':
      return <BookingOfficerStackNavigator />;
    case 'operator':
      return <OperatorStackNavigator />;
    default:
      // Fallback to auth navigator if role is unknown
      return <AuthNavigator />;
  }
}

// Export navigators for use elsewhere
export * from './navigators/AuthNavigator';
export * from './navigators/ProducerStackNavigator';
export * from './navigators/BookingOfficerStackNavigator';
export * from './navigators/OperatorStackNavigator';

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
});