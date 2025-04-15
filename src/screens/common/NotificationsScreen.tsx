import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, IconButton, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { ProducerStackParamList, BookingOfficerStackParamList, OperatorStackParamList } from '../../navigation';

type NotificationType = {
  id: string;
  userId: string;
  productionId?: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Timestamp;
};

export default function NotificationsScreen() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const { userDetails } = useAuth();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<
    NativeStackNavigationProp<
      ProducerStackParamList & BookingOfficerStackParamList & OperatorStackParamList
    >
  >();

  useEffect(() => {
    // Mark all as read when the screen is focused
    const markAllReadOnFocus = navigation.addListener('focus', () => {
      if (unreadCount > 0) {
        markAllAsRead();
      }
    });

    return markAllReadOnFocus;
  }, [navigation, unreadCount]);

  // Refresh notifications
  const onRefresh = async () => {
    setRefreshing(true);
    // Wait for a short time to show the refresh indicator
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'calendar-check-outline';
      case 'reminder':
        return 'alarm-outline';
      case 'confirmation':
        return 'checkmark-circle-outline';
      case 'cancellation':
        return 'close-circle-outline';
      case 'message':
        return 'mail-outline';
      case 'overtime':
        return 'time-outline';
      case 'change':
        return 'refresh-outline';
      default:
        return 'notifications-outline';
    }
  };

  // Format notification time
  const formatNotificationTime = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '';
    
    // Convert Firestore timestamp to Date
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Handle notification press
  const handleNotificationPress = async (notification: NotificationType) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type and user role
    if (notification.productionId) {
      if (userDetails?.role === 'producer') {
        navigation.navigate('RequestDetails', { productionId: notification.productionId });
      } else if (userDetails?.role === 'booking_officer') {
        navigation.navigate('ManageRequest', { productionId: notification.productionId });
      } else if (userDetails?.role === 'operator') {
        // For simplicity, we'll just navigate to the production details
        navigation.navigate('ProductionDetails', { productionId: notification.productionId });
      }
    }
  };

  // Render notification item
  const renderNotificationItem = ({ item }: { item: NotificationType }) => (
    <Card 
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => handleNotificationPress(item)}
    >
      <Card.Content style={styles.notificationContent}>
        <View style={styles.notificationIconContainer}>
          <Ionicons 
            name={getNotificationIcon(item.type)} 
            size={24} 
            color={theme.colors.primary}
          />
        </View>
        
        <View style={styles.notificationTextContainer}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationBody}>{item.body}</Text>
          <Text style={styles.notificationTime}>
            {formatNotificationTime(item.createdAt)}
          </Text>
        </View>
        
        {!item.read && (
          <View style={styles.unreadIndicator} />
        )}
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        
        {notifications.length > 0 && (
          <Button 
            mode="text"
            compact
            onPress={markAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </View>
      
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>
            You'll see notifications here when there are updates to your productions or assignments
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  notificationCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  unreadCard: {
    backgroundColor: '#f0f7ff',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIconContainer: {
    marginRight: 12,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginTop: 4,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});