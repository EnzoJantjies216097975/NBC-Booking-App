import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import ProducerStackNavigator from './ProducerStackNavigator';
import BookingOfficerStackNavigator from './BookingOfficerStackNavigator';
import OperatorStackNavigator from './OperatorStackNavigator';

export default function Navigation() {
  const { currentUser, userDetails } = useAuth();

  // If no user is logged in, show auth screens
  if (!currentUser) {
    return <AuthNavigator />;
  }

  // If user is logged in but we don't have their details yet
  if (!userDetails) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1976D2" />
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
      return <AuthNavigator />;
  }
}