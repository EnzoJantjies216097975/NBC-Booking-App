import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useNotifications } from '../../contexts/NotificationContext';

// Operator Screens
import OperatorDashboardScreen from '../../screens/operator/DashboardScreen';
import OperatorScheduleScreen from '../../screens/operator/ScheduleScreen';
import AssignmentDetailsScreen from '../../screens/operator/AssignmentDetailsScreen';

// Common Screens
import ProfileScreen from '../../screens/common/ProfileScreen';
import NotificationsScreen from '../../screens/common/NotificationsScreen';
import MessageScreen from '../../screens/common/MessageScreen';
import ProductionDetailsScreen from '../../screens/common/ProductionDetailsScreen';

// Type definitions
export type OperatorStackParamList = {
  OperatorTabs: undefined;
  AssignmentDetails: { assignmentId: string };
  ProductionDetails: { productionId: string };
  Message: { productionId: string; productionName: string; messageType?: string };
};

export type OperatorTabParamList = {
  Dashboard: undefined;
  Schedule: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<OperatorStackParamList>();
const Tab = createBottomTabNavigator<OperatorTabParamList>();

// Operator Tab Navigator Component
function OperatorTabNavigator() {
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