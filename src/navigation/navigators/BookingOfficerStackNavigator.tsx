import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useNotifications } from '../../contexts/NotificationContext';

// Booking Officer Screens
import BookingOfficerDashboardScreen from '../../screens/bookingOfficer/DashboardScreen';
import BookingOfficerScheduleScreen from '../../screens/bookingOfficer/ScheduleScreen';
import ManageRequestScreen from '../../screens/bookingOfficer/ManageRequestScreen';
import AssignOperatorsScreen from '../../screens/bookingOfficer/AssignOperatorScreen';
import PrintScheduleScreen from '../../screens/bookingOfficer/PrintScheduleScreen';

// Common Screens
import ProfileScreen from '../../screens/common/ProfileScreen';
import NotificationsScreen from '../../screens/common/NotificationsScreen';
import MessageScreen from '../../screens/common/MessageScreen';
import ProductionDetailsScreen from '../../screens/common/ProductionDetailsScreen';

// Type definitions
export type BookingOfficerStackParamList = {
  BookingOfficerTabs: undefined;
  ManageRequest: { productionId: string };
  AssignOperators: { productionId: string; requirements?: any[]; existingAssignments?: any[] };
  ProductionDetails: { productionId: string };
  Message: { productionId: string; productionName: string; messageType?: string };
  PrintSchedule: { productionId: string };
};

export type BookingOfficerTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Print: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<BookingOfficerStackParamList>();
const Tab = createBottomTabNavigator<BookingOfficerTabParamList>();

// Booking Officer Tab Navigator Component
function BookingOfficerTabNavigator() {
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
      <Stack.Screen name="PrintSchedule" component={PrintScheduleScreen} />
    </Stack.Navigator>
  );
}