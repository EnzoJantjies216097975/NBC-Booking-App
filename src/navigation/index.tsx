import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Producer Screens
import ProducerDashboardScreen from '../screens/producer/DashboardScreen';
import ProducerScheduleScreen from '../screens/producer/ScheduleScreen';
import CreateRequestScreen from '../screens/producer/CreateRequestScreen';
import ProducerRequestDetailsScreen from '../screens/producer/RequestDetailScreen';

// Booking Officer Screens
import BookingOfficerDashboardScreen from '../screens/bookingOfficer/DashboardScreen';
import BookingOfficerScheduleScreen from '../screens/bookingOfficer/ScheduleScreen';
import ManageRequestScreen from '../screens/bookingOfficer/ManageRequestScreen';
import AssignOperatorsScreen from '../screens/bookingOfficer/AssignOperatorScreen';
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

// Define param types for the navigators
export type RootStackParamList = {
  Auth: undefined;
  ProducerStack: undefined;
  BookingOfficerStack: undefined;
  OperatorStack: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type ProducerStackParamList = {
  ProducerTabs: undefined;
  RequestDetails: { productionId: string };
  ProductionDetails: { productionId: string };
  Message: { productionId: string; productionName: string; messageType?: string };
};

export type BookingOfficerStackParamList = {
  BookingOfficerTabs: undefined;
  ManageRequest: { productionId: string };
  AssignOperators: { productionId: string; requirements?: any[]; existingAssignments?: any[] };
  ProductionDetails: { productionId: string };
  Message: { productionId: string; productionName: string; messageType?: string };
  PrintSchedule: { productionId: string };
};

export type OperatorStackParamList = {
  OperatorTabs: undefined;
  AssignmentDetails: { assignmentId: string };
  ProductionDetails: { productionId: string };
  Message: { productionId: string; productionName: string; messageType?: string };
};

export type ProducerTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Create: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type BookingOfficerTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Print: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type OperatorTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Notifications: undefined;
  Profile: undefined;
};

// Create the navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Navigator Component
export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

// Producer Tab Navigator Component
export function ProducerTabNavigator() {
  const theme = useTheme();
  const { unreadCount } = useNotifications();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

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

// Producer Stack Navigator Component
export function ProducerStackNavigator() {
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

// Booking Officer Tab Navigator Component
export function BookingOfficerTabNavigator() {
  const theme = useTheme();
  const { unreadCount } = useNotifications();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

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

// Booking Officer Stack Navigator Component
export function BookingOfficerStackNavigator() {
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

// Operator Tab Navigator Component
export function OperatorTabNavigator() {
  const theme = useTheme();
  const { unreadCount } = useNotifications();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

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

// Operator Stack Navigator Component
export function OperatorStackNavigator() {
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

// Main Navigation Component
export function Navigation() {
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

// Export the Navigation component as default
export default Navigation;