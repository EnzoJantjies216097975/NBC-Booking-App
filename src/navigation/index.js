// src/navigation/index.js (completed version with imports)

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Producer Screens
import ProducerDashboardScreen from '../screens/producer/DashboardScreen';
import ProducerScheduleScreen from '../screens/producer/ScheduleScreen';
import CreateRequestScreen from '../screens/producer/CreateRequestScreen';
import ProducerRequestDetailsScreen from '../screens/producer/RequestDetailsScreen';

// Booking Officer Screens
import BookingOfficerDashboardScreen from '../screens/bookingOfficer/DashboardScreen';
import BookingOfficerScheduleScreen from '../screens/bookingOfficer/ScheduleScreen';
import ManageRequestScreen from '../screens/bookingOfficer/ManageRequestScreen';
import AssignOperatorsScreen from '../screens/bookingOfficer/AssignOperatorsScreen';
import PrintScheduleScreen from '../screens/bookingOfficer/PrintScheduleScreen';

// Operator Screens
import OperatorDashboardScreen from '../screens/operator/DashboardScreen';
import OperatorScheduleScreen from '../screens/operator/ScheduleScreen';
import AssignmentDetailsScreen from '../screens/operator/AssignmentDetailsScreen';

// Common Screens
import ProfileScreen from '../screens/common/ProfileScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import MessageScreen from '../screens/common/MessageScreen';
import ProductionDetailsScreen from '../screens/common/ProductionDetailsScreen';

// Navigation Stacks
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// Producer Tab Navigator
function ProducerTabNavigator() {
  const theme = useTheme();
  const { unreadCount } = useNotifications();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Create') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={ProducerDashboardScreen} />
      <Tab.Screen name="Schedule" component={ProducerScheduleScreen} />
      <Tab.Screen name="Create" component={CreateRequestScreen} />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ 
          tabBarBadge: unreadCount > 0 ? unreadCount : null 
        }} 
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Producer Stack Navigator
function ProducerStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProducerTabs" 
        component={ProducerTabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen name="RequestDetails" component={ProducerRequestDetailsScreen} />
      <Stack.Screen name="ProductionDetails" component={ProductionDetailsScreen} />
      <Stack.Screen name="Message" component={MessageScreen} />
    </Stack.Navigator>
  );
}

// Booking Officer Tab Navigator
function BookingOfficerTabNavigator() {
  const theme = useTheme();
  const { unreadCount } = useNotifications();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Print') {
            iconName = focused ? 'print' : 'print-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={BookingOfficerDashboardScreen} />
      <Tab.Screen name="Schedule" component={BookingOfficerScheduleScreen} />
      <Tab.Screen name="Print" component={PrintScheduleScreen} />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ 
          tabBarBadge: unreadCount > 0 ? unreadCount : null 
        }} 
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Booking Officer Stack Navigator
function BookingOfficerStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="BookingOfficerTabs" 
        component={BookingOfficerTabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen name="ManageRequest" component={ManageRequestScreen} />
      <Stack.Screen name="AssignOperators" component={AssignOperatorsScreen} />
      <Stack.Screen name="ProductionDetails" component={ProductionDetailsScreen} />
      <Stack.Screen name="Message" component={MessageScreen} />
    </Stack.Navigator>
  );
}

// Operator Tab Navigator
function OperatorTabNavigator() {
  const theme = useTheme();
  const { unreadCount } = useNotifications();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Dashboard" component={OperatorDashboardScreen} />
      <Tab.Screen name="Schedule" component={OperatorScheduleScreen} />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ 
          tabBarBadge: unreadCount > 0 ? unreadCount : null 
        }} 
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Operator Stack Navigator
function OperatorStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="OperatorTabs" 
        component={OperatorTabNavigator} 
        options={{ headerShown: false }}
      />
      <Stack.Screen name="AssignmentDetails" component={AssignmentDetailsScreen} />
      <Stack.Screen name="ProductionDetails" component={ProductionDetailsScreen} />
      <Stack.Screen name="Message" component={MessageScreen} />
    </Stack.Navigator>
  );
}

// Main Navigation
export default function Navigation() {
  const { currentUser, userDetails } = useAuth();

  // If no user is logged in, show auth screens
  if (!currentUser) {
    return <AuthNavigator />;
  }

  // If user is logged in but we don't have their details yet
  if (!userDetails) {
    return null; // Or a loading screen
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
      // If role is not recognized, log out or show error
      return <AuthNavigator />;
  }
}

// src/utils/notifications.js (missing import in original code)
import { getDoc } from 'firebase/firestore';