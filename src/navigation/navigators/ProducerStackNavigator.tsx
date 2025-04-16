import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useNotifications } from '../../contexts/NotificationContext';

// Producer Screens
import ProducerDashboardScreen from '../../screens/producer/DashboardScreen';
import ProducerScheduleScreen from '../../screens/producer/ScheduleScreen';
import CreateRequestScreen from '../../screens/producer/CreateRequestScreen';
import ProducerRequestDetailsScreen from '../../screens/producer/RequestDetailScreen';

// Common Screens
import ProfileScreen from '../../screens/common/ProfileScreen';
import NotificationsScreen from '../../screens/common/NotificationsScreen';
import MessageScreen from '../../screens/common/MessageScreen';
import ProductionDetailsScreen from '../../screens/common/ProductionDetailsScreen';

// Type definitions
export type ProducerStackParamList = {
  ProducerTabs: undefined;
  RequestDetails: { productionId: string };
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

const Stack = createStackNavigator<ProducerStackParamList>();
const Tab = createBottomTabNavigator<ProducerTabParamList>();

// Producer Tab Navigator Component
function ProducerTabNavigator() {
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