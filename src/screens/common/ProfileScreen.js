// src/screens/common/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Title, Button, TextInput, Avatar, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { currentUser, userDetails, logout, fetchUserDetails } = useAuth();
  const theme = useTheme();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Load user details
  useEffect(() => {
    if (userDetails) {
      setName(userDetails.name || '');
      setEmail(userDetails.email || '');
    } else {
      setLoading(true);
      fetchUserDetails(currentUser.uid)
        .then(details => {
          if (details) {
            setName(details.name || '');
            setEmail(details.email || '');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [userDetails, currentUser]);

  // Get role display name
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'producer':
        return 'Producer';
      case 'booking_officer':
        return 'Booking Officer';
      case 'operator':
        return 'Operator';
      default:
        return role;
    }
  };

  // Get specialization display name
  const getSpecializationDisplayName = (specialization) => {
    switch (specialization) {
      case 'camera':
        return 'Camera Operator';
      case 'sound':
        return 'Sound Operator';
      case 'lighting':
        return 'Lighting Operator';
      case 'evs':
        return 'EVS Operator';
      case 'director':
        return 'Director';
      case 'stream':
        return 'Stream Operator';
      case 'technician':
        return 'Technician';
      case 'electrician':
        return 'Electrician';
      case 'transport':
        return 'Transport';
      default:
        return specialization;
    }
  };

  // Save profile changes
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      setSaveLoading(true);
      
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name
      });
      
      await fetchUserDetails(currentUser.uid);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      const result = await logout();
      
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to log out');
      }
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          <Avatar.Icon 
            icon="account" 
            size={80} 
            style={styles.avatar}
            color="#fff"
          />
        </View>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Profile Information</Title>
            
            {editing ? (
              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                mode="outlined"
              />
            ) : (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{name}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role:</Text>
              <Text style={styles.infoValue}>
                {userDetails ? getRoleDisplayName(userDetails.role) : ''}
              </Text>
            </View>
            
            {userDetails && userDetails.role === 'operator' && userDetails.specialization && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Specialization:</Text>
                <Text style={styles.infoValue}>
                  {getSpecializationDisplayName(userDetails.specialization)}
                </Text>
              </View>
            )}
            
            {editing ? (
              <View style={styles.editButtons}>
                <Button 
                  mode="text" 
                  onPress={() => {
                    setName(userDetails?.name || '');
                    setEditing(false);
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
                
                <Button 
                  mode="contained" 
                  onPress={handleSave}
                  loading={saveLoading}
                  disabled={saveLoading}
                  style={styles.saveButton}
                >
                  Save
                </Button>
              </View>
            ) : (
              <Button 
                mode="outlined" 
                onPress={() => setEditing(true)}
                icon="pencil"
                style={styles.editButton}
              >
                Edit Profile
              </Button>
            )}
          </Card.Content>
        </Card>
        
        <Button 
          mode="outlined"
          icon="logout"
          onPress={handleLogout}
          loading={logoutLoading}
          disabled={logoutLoading}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
        >
          Log Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    backgroundColor: '#2c3e50',
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoLabel: {
    width: 120,
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    marginRight: 8,
  },
  saveButton: {
    minWidth: 100,
  },
  editButton: {
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 8,
    borderColor: '#E53935',
  },
  logoutButtonContent: {
    height: 48,
  },
});

// src/screens/common/NotificationsScreen.js

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Button, IconButton, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsScreen({ navigation }) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const { userDetails } = useAuth();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

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
  const getNotificationIcon = (type) => {
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
  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return '';
    
    // Convert Firestore timestamp to Date
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;
    
    return formatDistanceToNow(date, { addSuffix: true });
  };

  // Handle notification press
  const handleNotificationPress = async (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate based on notification type and user role
    if (notification.productionId) {
      if (userDetails.role === 'producer') {
        navigation.navigate('RequestDetails', { productionId: notification.productionId });
      } else if (userDetails.role === 'booking_officer') {
        navigation.navigate('ManageRequest', { productionId: notification.productionId });
      } else if (userDetails.role === 'operator') {
        // Find related assignment to navigate to assignment details
        // For simplicity, we'll just navigate to the production details
        navigation.navigate('ProductionDetails', { productionId: notification.productionId });
      }
    }
  };

  // Render notification item
  const renderNotificationItem = ({ item }) => (
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

// src/screens/common/MessageScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, RadioButton, Title } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Alert } from 'react-native';

export default function MessageScreen({ route, navigation }) {
  const { productionId, productionName, messageType = 'general' } = route.params;
  const { currentUser, userDetails } = useAuth();
  const theme = useTheme();
  
  const [message, setMessage] = useState('');
  const [overtimeReason, setOvertimeReason] = useState('technical-issues');
  const [loading, setLoading] = useState(false);
  const [production, setProduction] = useState(null);

  // Load production details if needed
  useEffect(() => {
    const fetchProductionDetails = async () => {
      try {
        const productionDoc = await getDoc(doc(db, 'productions', productionId));
        
        if (productionDoc.exists()) {
          setProduction({
            id: productionDoc.id,
            ...productionDoc.data()
          });
        }
      } catch (error) {
        console.error('Error fetching production details:', error);
      }
    };

    fetchProductionDetails();
  }, [productionId]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!message.trim() && messageType !== 'overtime') {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    try {
      setLoading(true);
      
      if (messageType === 'overtime') {
        // Update production with overtime information
        await updateDoc(doc(db, 'productions', productionId), {
          actualEndTime: null, // This would be the actual time in a real implementation
          overtimeReason: message || getOvertimeReasonText(overtimeReason),
          overtime: true,
          updatedAt: serverTimestamp()
        });
        
        // Create a notification for the booking officer
        await addDoc(collection(db, 'notifications'), {
          userId: production?.confirmedBy || 'booking_officer', // This would be more specific in a real implementation
          type: 'overtime',
          title: 'Production Overtime',
          body: `${productionName} is going overtime. Reason: ${message || getOvertimeReasonText(overtimeReason)}`,
          productionId,
          read: false,
          createdAt: serverTimestamp()
        });
        
        Alert.alert(
          'Success',
          'Overtime report sent successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Create a message
        await addDoc(collection(db, 'messages'), {
          productionId,
          senderId: currentUser.uid,
          senderName: userDetails?.name || 'Unknown',
          senderRole: userDetails?.role || 'unknown',
          text: message,
          timestamp: serverTimestamp()
        });
        
        // Create a notification for the booking officer
        await addDoc(collection(db, 'notifications'), {
          userId: production?.confirmedBy || 'booking_officer', // This would be more specific in a real implementation
          type: 'message',
          title: 'New Message',
          body: `${userDetails?.name || 'Someone'} sent a message about "${productionName}": ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
          productionId,
          read: false,
          createdAt: serverTimestamp()
        });
        
        Alert.alert(
          'Success',
          'Message sent successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Get overtime reason text
  const getOvertimeReasonText = (reason) => {
    switch (reason) {
      case 'technical-issues':
        return 'Technical Issues';
      case 'script-changes':
        return 'Script Changes';
      case 'talent-delays':
        return 'Talent Delays';
      case 'equipment-failure':
        return 'Equipment Failure';
      case 'weather-conditions':
        return 'Weather Conditions';
      case 'other':
        return 'Other';
      default:
        return reason;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.content}>
          <Title style={styles.title}>
            {messageType === 'overtime' ? 'Report Overtime' : 'Send Message'}
          </Title>
          
          <Text style={styles.productionName}>{productionName}</Text>
          
          {messageType === 'overtime' && (
            <View style={styles.overtimeSection}>
              <Text style={styles.sectionTitle}>Reason for Overtime:</Text>
              
              <RadioButton.Group
                onValueChange={value => setOvertimeReason(value)}
                value={overtimeReason}
              >
                <View style={styles.radioOption}>
                  <RadioButton.Item 
                    label="Technical Issues" 
                    value="technical-issues"
                    position="leading"
                    style={styles.radioItem}
                  />
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton.Item 
                    label="Script Changes" 
                    value="script-changes"
                    position="leading"
                    style={styles.radioItem}
                  />
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton.Item 
                    label="Talent Delays" 
                    value="talent-delays"
                    position="leading"
                    style={styles.radioItem}
                  />
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton.Item 
                    label="Equipment Failure" 
                    value="equipment-failure"
                    position="leading"
                    style={styles.radioItem}
                  />
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton.Item 
                    label="Weather Conditions" 
                    value="weather-conditions"
                    position="leading"
                    style={styles.radioItem}
                  />
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton.Item 
                    label="Other" 
                    value="other"
                    position="leading"
                    style={styles.radioItem}
                  />
                </View>
              </RadioButton.Group>
            </View>
          )}
          
          <TextInput
            label={messageType === 'overtime' ? 'Additional Details (Optional)' : 'Message'}
            value={message}
            onChangeText={setMessage}
            mode="outlined"
            multiline
            numberOfLines={5}
            style={styles.messageInput}
            placeholder={
              messageType === 'overtime' 
                ? 'Provide any additional information about the overtime...' 
                : 'Type your message here...'
            }
          />
          
          <Button
            mode="contained"
            onPress={handleSendMessage}
            loading={loading}
            disabled={loading}
            style={styles.sendButton}
            contentStyle={styles.sendButtonContent}
          >
            {messageType === 'overtime' ? 'Report Overtime' : 'Send Message'}
          </Button>
          
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  productionName: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  overtimeSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  radioOption: {
    marginVertical: -8,
  },
  radioItem: {
    paddingLeft: 0,
  },
  messageInput: {
    marginBottom: 16,
    height: 120,
  },
  sendButton: {
    marginBottom: 12,
  },
  sendButtonContent: {
    height: 48,
  },
  cancelButton: {
    marginBottom: 16,
  },
});

// src/screens/common/ProductionDetailsScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function ProductionDetailsScreen({ route, navigation }) {
  const { productionId } = route.params;
  const { currentUser, userDetails } = useAuth();
  const theme = useTheme();
  
  const [production, setProduction] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [myAssignment, setMyAssignment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch production details and assignments
  useEffect(() => {
    const fetchProductionDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch production details
        const productionDoc = await getDoc(doc(db, 'productions', productionId));
        
        if (!productionDoc.exists()) {
          Alert.alert('Error', 'Production not found');
          navigation.goBack();
          return;
        }
        
        const productionData = {
          id: productionDoc.id,
          ...productionDoc.data(),
          date: productionDoc.data().date ? productionDoc.data().date.toDate() : null,
          callTime: productionDoc.data().callTime ? productionDoc.data().callTime.toDate() : null,
          startTime: productionDoc.data().startTime ? productionDoc.data().startTime.toDate() : null,
          endTime: productionDoc.data().endTime ? productionDoc.data().endTime.toDate() : null,
        };
        
        setProduction(productionData);
        
        // Fetch assignments
        const assignmentsRef = collection(db, 'assignments');
        const assignmentsQuery = query(
          assignmentsRef,
          where('productionId', '==', productionId)
        );
        
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        const assignmentsList = await Promise.all(assignmentsSnapshot.docs.map(async doc => {
          const assignmentData = {
            id: doc.id,
            ...doc.data()
          };
          
          // Fetch user details for each assignment
          const userDoc = await getDoc(doc.data().userId ? doc(db, 'users', doc.data().userId) : null);
          
          if (userDoc && userDoc.exists()) {
            assignmentData.userDetails = userDoc.data();
          }
          
          // Check if this is the current user's assignment
          if (doc.data().userId === currentUser.uid) {
            setMyAssignment(assignmentData);
          }
          
          return assignmentData;
        }));
        
        setAssignments(assignmentsList);
      } catch (error) {
        console.error('Error fetching production details:', error);
        Alert.alert('Error', 'Failed to load production details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductionDetails();
  }, [productionId]);

  // Format time function
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return format(date, 'h:mm a');
  };

  // Format date function
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'requested':
        return '#FFC107'; // Amber
      case 'confirmed':
        return '#4CAF50'; // Green
      case 'in_progress':
        return '#2196F3'; // Blue
      case 'completed':
        return '#9E9E9E'; // Grey
      case 'cancelled':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'requested':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Convert type to display name
  const getTypeName = (type) => {
    switch (type) {
      case 'camera':
        return 'Camera Operator';
      case 'sound':
        return 'Sound Operator';
      case 'lighting':
        return 'Lighting Operator';
      case 'evs':
        return 'EVS Operator';
      case 'director':
        return 'Director';
      case 'stream':
        return 'Stream Operator';
      case 'technician':
        return 'Technician';
      case 'electrician':
        return 'Electrician';
      case 'transport':
        return 'Transport';
      default:
        return type;
    }
  };

  // Get icon for operator type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'camera':
        return 'camera-outline';
      case 'sound':
        return 'mic-outline';
      case 'lighting':
        return 'flashlight-outline';
      case 'evs':
        return 'tv-outline';
      case 'director':
        return 'film-outline';
      case 'stream':
        return 'wifi-outline';
      case 'technician':
        return 'construct-outline';
      case 'electrician':
        return 'flash-outline';
      case 'transport':
        return 'car-outline';
      default:
        return 'person-outline';
    }
  };

  // Handle view assignment
  const handleViewAssignment = () => {
    if (myAssignment) {
      navigation.navigate('AssignmentDetails', { assignmentId: myAssignment.id });
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    navigation.navigate('Message', { 
      productionId: production.id,
      productionName: production.name
    });
  };

  // Handle report overtime
  const handleReportOvertime = () => {
    navigation.navigate('Message', { 
      productionId: production.id,
      productionName: production.name,
      messageType: 'overtime'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!production) {
    return (
      <View style={styles.errorContainer}>
        <Text>Production not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Title style={styles.title}>{production.name}</Title>
              <Chip 
                mode="outlined" 
                style={{ backgroundColor: getStatusColor(production.status) }}
                textStyle={{ color: 'white' }}
              >
                {getStatusText(production.status)}
              </Chip>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Date & Time</Text>
              
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#555" />
                <Text style={styles.detailText}>{formatDate(production.date)}</Text>
              </View>
              
              <View style={styles.timeRow}>
                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>Call Time</Text>
                  <Text style={styles.timeValue}>{formatTime(production.callTime)}</Text>
                </View>
                
                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>Start</Text>
                  <Text style={styles.timeValue}>{formatTime(production.startTime)}</Text>
                </View>
                
                <View style={styles.timeInfo}>
                  <Text style={styles.timeLabel}>End</Text>
                  <Text style={styles.timeValue}>{formatTime(production.endTime)}</Text>
                </View>
              </View>
              
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color="#555" />
                <Text style={styles.detailText}>
                  {production.venue}
                  {production.locationDetails ? ` - ${production.locationDetails}` : ''}
                </Text>
              </View>
            </View>
            
            {production.notes && (
              <>
                <Divider style={styles.divider} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.notesText}>{production.notes}</Text>
                </View>
              </>
            )}
            
            {userDetails.role !== 'producer' && (
              <>
                <Divider style={styles.divider} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Assigned Crew</Text>
                  
                  {assignments.length === 0 ? (
                    <Text style={styles.emptyText}>No crew assigned yet</Text>
                  ) : (
                    <View>
                      {assignments.map(assignment => (
                        <View key={assignment.id} style={styles.assignmentRow}>
                          <Ionicons name={getTypeIcon(assignment.role)} size={18} color="#555" />
                          <Text style={styles.assignmentText}>
                            {getTypeName(assignment.role)}: {assignment.userDetails?.name || 'Unknown'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
            
            {myAssignment && (
              <>
                <Divider style={styles.divider} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Your Assignment</Text>
                  
                  <View style={styles.myAssignmentContainer}>
                    <Chip style={styles.myRoleChip}>{getTypeName(myAssignment.role)}</Chip>
                    <Text style={styles.assignmentStatusText}>
                      Status: {
                        myAssignment.status === 'accepted' ? 'Accepted' : 
                        myAssignment.status === 'declined' ? 'Declined' : 
                        'Pending'
                      }
                    </Text>
                    
                    <Button
                      mode="contained"
                      onPress={handleViewAssignment}
                      style={styles.viewAssignmentButton}
                    >
                      View Assignment Details
                    </Button>
                  </View>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
        
        {userDetails.role === 'operator' && production.status === 'in_progress' && (
          <Button
            mode="contained"
            icon="clock-outline"
            onPress={handleReportOvertime}
            style={styles.overtimeButton}
          >
            Report Overtime
          </Button>
        )}
        
        <Button
          mode="outlined"
          icon="message-outline"
          onPress={handleSendMessage}
          style={styles.messageButton}
        >
          Send Message
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    flex: 1,
    marginRight: 12,
  },
  divider: {
    marginVertical: 16,
  },
  detailsSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeInfo: {
    alignItems: 'center',
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentText: {
    marginLeft: 8,
    fontSize: 16,
  },
  myAssignmentContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  myRoleChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#e0e0e0',
  },
  assignmentStatusText: {
    fontSize: 16,
    marginBottom: 12,
  },
  viewAssignmentButton: {
    marginTop: 8,
  },
  overtimeButton: {
    backgroundColor: '#E53935',
    marginBottom: 12,
  },
  messageButton: {
    marginBottom: 24,
  },
});