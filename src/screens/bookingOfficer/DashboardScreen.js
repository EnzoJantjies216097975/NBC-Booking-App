// src/screens/bookingOfficer/DashboardScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, useTheme, ActivityIndicator, Badge, SegmentedButtons } from 'react-native-paper';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isAfter, isBefore, startOfDay, addDays } from 'date-fns';

export default function BookingOfficerDashboardScreen({ navigation }) {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending');
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Function to fetch productions from Firestore
  const fetchProductions = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const today = startOfDay(now);
      const productionsRef = collection(db, 'productions');
      
      let q;
      
      // Apply filter
      if (filter === 'pending') {
        q = query(
          productionsRef,
          where('status', '==', 'requested'),
          orderBy('date', 'asc')
        );
      } else if (filter === 'today') {
        q = query(
          productionsRef,
          where('date', '>=', today),
          where('date', '<', Timestamp.fromDate(addDays(today, 1))),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
      } else if (filter === 'upcoming') {
        q = query(
          productionsRef,
          where('date', '>=', today),
          where('status', 'in', ['confirmed', 'requested']),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
      } else if (filter === 'all') {
        q = query(
          productionsRef,
          orderBy('date', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const productionsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to JS Date objects
        date: doc.data().date ? doc.data().date.toDate() : null,
        callTime: doc.data().callTime ? doc.data().callTime.toDate() : null,
        startTime: doc.data().startTime ? doc.data().startTime.toDate() : null,
        endTime: doc.data().endTime ? doc.data().endTime.toDate() : null,
      }));
      
      setProductions(productionsList);
    } catch (error) {
      console.error('Error fetching productions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch and on filter change
  useEffect(() => {
    fetchProductions();
  }, [filter]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchProductions();
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

  // Format time function
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return format(date, 'h:mm a');
  };

  // Format date function
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(date, 'EEE, MMM d, yyyy');
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

  // Render production card
  const renderProductionCard = ({ item }) => (
    <Card 
      style={styles.card}
      onPress={() => navigation.navigate('ManageRequest', { productionId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title>{item.name}</Title>
          <Chip 
            mode="outlined" 
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: 'white' }}
          >
            {getStatusText(item.status)}
          </Chip>
        </View>
        
        <Paragraph style={styles.dateText}>
          <Ionicons name="calendar-outline" size={16} /> {formatDate(item.date)}
        </Paragraph>
        
        <Divider style={styles.divider} />
        
        <View style={styles.timeContainer}>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Call Time:</Text>
            <Text style={styles.timeValue}>{formatTime(item.callTime)}</Text>
          </View>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Start:</Text>
            <Text style={styles.timeValue}>{formatTime(item.startTime)}</Text>
          </View>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>End:</Text>
            <Text style={styles.timeValue}>{formatTime(item.endTime)}</Text>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.venueContainer}>
          <Ionicons name="location-outline" size={16} />
          <Text style={styles.venueText}>
            {item.venue}
            {item.locationDetails ? ` - ${item.locationDetails}` : ''}
          </Text>
        </View>
      </Card.Content>
      
      <Card.Actions style={styles.cardActions}>
        <Button
          mode="text"
          onPress={() => navigation.navigate('ManageRequest', { productionId: item.id })}
        >
          View Details
        </Button>
        
        {item.status === 'requested' && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AssignOperators', { productionId: item.id })}
          >
            Assign Crew
          </Button>
        )}
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'pending', label: 'Pending', icon: 'clock-outline' },
            { value: 'today', label: 'Today', icon: 'calendar-today' },
            { value: 'upcoming', label: 'Upcoming', icon: 'calendar-month' },
            { value: 'all', label: 'All', icon: 'view-list' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : productions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No productions found</Text>
          <Text style={styles.emptySubtext}>
            {filter === 'pending' 
              ? 'There are no pending production requests' 
              : filter === 'today'
                ? 'There are no productions scheduled for today'
                : filter === 'upcoming'
                  ? 'There are no upcoming productions'
                  : 'No productions available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={productions}
          keyExtractor={item => item.id}
          renderItem={renderProductionCard}
          contentContainerStyle={styles.listContent}
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  segmentedButtons: {
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInfo: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueText: {
    marginLeft: 4,
  },
  cardActions: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

// src/screens/bookingOfficer/ScheduleScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Chip, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { 
  format, 
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  isToday
} from 'date-fns';

export default function BookingOfficerScheduleScreen({ navigation }) {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Start on Monday
  const [selectedDate, setSelectedDate] = useState(new Date());
  const theme = useTheme();

  // Get dates for the week
  const weekDates = eachDayOfInterval({
    start: currentWeekStart,
    end: addDays(currentWeekStart, 6)
  });

  // Fetch schedule data for the selected week
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        
        const weekStart = currentWeekStart;
        const weekEnd = addDays(weekStart, 7); // One week interval
        
        const productionsRef = collection(db, 'productions');
        const q = query(
          productionsRef,
          where('date', '>=', Timestamp.fromDate(weekStart)),
          where('date', '<', Timestamp.fromDate(weekEnd)),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const productionsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date ? doc.data().date.toDate() : null,
          callTime: doc.data().callTime ? doc.data().callTime.toDate() : null,
          startTime: doc.data().startTime ? doc.data().startTime.toDate() : null,
          endTime: doc.data().endTime ? doc.data().endTime.toDate() : null,
        }));
        
        setProductions(productionsList);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [currentWeekStart]);

  // Next week
  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  // Previous week
  const goToPrevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  // Format time function
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return format(date, 'h:mm a');
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

  // Get productions for the selected date
  const getProductionsForDate = (date) => {
    return productions.filter(production => 
      production.date && isSameDay(production.date, date)
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const selectedDateProductions = getProductionsForDate(selectedDate);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPrevWeek} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <Text style={styles.monthYear}>
          {format(currentWeekStart, 'MMMM yyyy')}
        </Text>
        
        <TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.weekContainer}>
        {weekDates.map((date) => {
          const dateProductions = getProductionsForDate(date);
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentDay = isToday(date);
          
          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.dayContainer,
                isSelected && styles.selectedDay,
                isCurrentDay && styles.currentDay
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={styles.dayName}>{format(date, 'EEE')}</Text>
              <Text style={[
                styles.dayNumber,
                isSelected && styles.selectedDayText,
                isCurrentDay && styles.currentDayText
              ]}>
                {format(date, 'd')}
              </Text>
              {dateProductions.length > 0 && (
                <View style={styles.productionIndicator}>
                  <Text style={styles.productionCount}>{dateProductions.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      <Divider />
      
      <View style={styles.dateHeaderContainer}>
        <Text style={styles.dateHeader}>
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.productionsContainer}>
        {selectedDateProductions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No productions scheduled</Text>
          </View>
        ) : (
          selectedDateProductions.map(production => (
            <Card 
              key={production.id}
              style={styles.productionCard}
              onPress={() => navigation.navigate('ManageRequest', { productionId: production.id })}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Title>{production.name}</Title>
                  <Chip 
                    mode="outlined" 
                    style={{ backgroundColor: getStatusColor(production.status) }}
                    textStyle={{ color: 'white' }}
                  >
                    {getStatusText(production.status)}
                  </Chip>
                </View>
                
                <View style={styles.timeRow}>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Call</Text>
                    <Text style={styles.timeValue}>{formatTime(production.callTime)}</Text>
                  </View>
                  
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Start</Text>
                    <Text style={styles.timeValue}>{formatTime(production.startTime)}</Text>
                  </View>
                  
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>End</Text>
                    <Text style={styles.timeValue}>{formatTime(production.endTime)}</Text>
                  </View>
                </View>
                
                <View style={styles.venueContainer}>
                  <Ionicons name="location-outline" size={16} />
                  <Text style={styles.venueText}>
                    {production.venue}
                    {production.locationDetails ? ` - ${production.locationDetails}` : ''}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  navButton: {
    padding: 4,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingBottom: 12,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  selectedDay: {
    backgroundColor: theme.colors.primary,
  },
  currentDay: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  dayName: {
    fontSize: 14,
    color: '#666',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  selectedDayText: {
    color: '#fff',
  },
  currentDayText: {
    color: theme.colors.primary,
  },
  productionIndicator: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productionCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateHeaderContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productionsContainer: {
    padding: 16,
  },
  productionCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueText: {
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
});

// src/screens/bookingOfficer/ManageRequestScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  List,
  Avatar,
  useTheme,
  Menu,
  IconButton,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function ManageRequestScreen({ route, navigation }) {
  const { productionId } = route.params;
  const { currentUser } = useAuth();
  const theme = useTheme();

  const [production, setProduction] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // Fetch production details and related data
  useEffect(() => {
    const fetchProductionDetails = async () => {
      try {
        setLoading(true);

        // Fetch production
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

        // Fetch requirements
        const requirementsRef = collection(db, 'requirements');
        const requirementsQuery = query(
          requirementsRef,
          where('productionId', '==', productionId)
        );

        const requirementsSnapshot = await getDocs(requirementsQuery);
        const requirementsList = requirementsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRequirements(requirementsList);

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

  // Update production status
  const updateStatus = async (newStatus) => {
    try {
      setStatusLoading(true);
      
      await updateDoc(doc(db, 'productions', productionId), {
        status: newStatus,
        confirmedBy: currentUser.uid,
        updatedAt: serverTimestamp()
      });

      // If confirming, send notifications to all assigned operators
      if (newStatus === 'confirmed') {
        await sendAssignmentNotifications();
      } else if (newStatus === 'cancelled') {
        await sendCancellationNotifications();
      }

      // Update local state
      setProduction({
        ...production,
        status: newStatus,
        confirmedBy: currentUser.uid
      });

      Alert.alert('Success', `Production ${newStatus === 'confirmed' ? 'confirmed' : newStatus === 'cancelled' ? 'cancelled' : 'updated'} successfully`);
    } catch (error) {
      console.error('Error updating production status:', error);
      Alert.alert('Error', 'Failed to update production status');
    } finally {
      setStatusLoading(false);
      setMenuVisible(false);
      setCancelDialogVisible(false);
    }
  };

  // Send notifications to assigned operators
  const sendAssignmentNotifications = async () => {
    try {
      // Add a notification for the producer
      if (production.requestedBy) {
        await addDoc(collection(db, 'notifications'), {
          userId: production.requestedBy,
          type: 'confirmation',
          title: 'Production Confirmed',
          body: `Your request for "${production.name}" has been confirmed.`,
          productionId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Add notifications for each assigned operator
      for (const assignment of assignments) {
        if (assignment.userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: assignment.userId,
            type: 'assignment',
            title: 'New Production Assignment',
            body: `You have been assigned to "${production.name}" on ${format(production.date, 'EEE, MMM d')} at ${formatTime(production.callTime)}.`,
            productionId,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  // Send cancellation notifications
  const sendCancellationNotifications = async () => {
    try {
      // Add a// src/screens/bookingOfficer/DashboardScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, useTheme, ActivityIndicator, Badge, SegmentedButtons } from 'react-native-paper';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isAfter, isBefore, startOfDay, addDays } from 'date-fns';

export default function BookingOfficerDashboardScreen({ navigation }) {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending');
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Function to fetch productions from Firestore
  const fetchProductions = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const today = startOfDay(now);
      const productionsRef = collection(db, 'productions');
      
      let q;
      
      // Apply filter
      if (filter === 'pending') {
        q = query(
          productionsRef,
          where('status', '==', 'requested'),
          orderBy('date', 'asc')
        );
      } else if (filter === 'today') {
        q = query(
          productionsRef,
          where('date', '>=', today),
          where('date', '<', Timestamp.fromDate(addDays(today, 1))),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
      } else if (filter === 'upcoming') {
        q = query(
          productionsRef,
          where('date', '>=', today),
          where('status', 'in', ['confirmed', 'requested']),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
      } else if (filter === 'all') {
        q = query(
          productionsRef,
          orderBy('date',   'asc'),
          orderBy('startTime', 'asc')    
        );
      }

      // Send cancellation notifications
  const sendCancellationNotifications = async () => {
    try {
      // Add a notification for the producer
      if (production.requestedBy) {
        await addDoc(collection(db, 'notifications'), {
          userId: production.requestedBy,
          type: 'cancellation',
          title: 'Production Cancelled',
          body: `Your production "${production.name}" has been cancelled. Reason: ${cancellationReason || 'Not specified'}`,
          productionId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Add notifications for each assigned operator
      for (const assignment of assignments) {
        if (assignment.userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: assignment.userId,
            type: 'cancellation',
            title: 'Production Cancelled',
            body: `The production "${production.name}" scheduled for ${format(production.date, 'EEE, MMM d')} has been cancelled.`,
            productionId,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error sending cancellation notifications:', error);
    }
  };

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

  // Handle assign operators
  const handleAssignOperators = () => {
    navigation.navigate('AssignOperators', { 
      productionId, 
      requirements,
      existingAssignments: assignments
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
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Crew Requirements</Text>
              
              {requirements.length === 0 ? (
                <Text style={styles.emptyText}>No crew requirements specified</Text>
              ) : (
                requirements.map(req => (
                  <View key={req.id} style={styles.requirementRow}>
                    <View style={styles.requirementInfo}>
                      <Ionicons name={getTypeIcon(req.type)} size={20} color="#555" />
                      <Text style={styles.requirementText}>
                        {getTypeName(req.type)}
                      </Text>
                    </View>
                    <Text style={styles.requirementCount}>{req.count}</Text>
                  </View>
                ))
              )}
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
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailsSection}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Assigned Crew</Text>
                
                {(production.status === 'requested' || production.status === 'confirmed') && (
                  <Button 
                    mode="outlined"
                    onPress={handleAssignOperators}
                    style={styles.assignButton}
                  >
                    {assignments.length > 0 ? 'Edit Assignments' : 'Assign Crew'}
                  </Button>
                )}
              </View>
              
              {assignments.length === 0 ? (
                <Text style={styles.emptyText}>No crew assigned yet</Text>
              ) : (
                assignments.map(assignment => (
                  <List.Item
                    key={assignment.id}
                    title={assignment.userDetails?.name || 'Unknown'}
                    description={getTypeName(assignment.role)}
                    left={props => (
                      <Avatar.Icon 
                        {...props} 
                        icon={getTypeIcon(assignment.role)}
                        size={40}
                        color="#fff"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                    )}
                    style={styles.assignmentItem}
                  />
                ))
              )}
            </View>
          </Card.Content>
        </Card>
        
        {production.status === 'requested' && (
          <View style={styles.actionButtonsContainer}>
            <Button 
              mode="contained"
              icon="check"
              onPress={() => updateStatus('confirmed')}
              style={[styles.actionButton, styles.confirmButton]}
              loading={statusLoading}
              disabled={statusLoading || assignments.length === 0}
            >
              Confirm Production
            </Button>
            
            <Button 
              mode="outlined"
              icon="close"
              onPress={() => setCancelDialogVisible(true)}
              style={styles.actionButton}
              loading={statusLoading}
              disabled={statusLoading}
            >
              Cancel Production
            </Button>
          </View>
        )}
        
        {production.status === 'confirmed' && (
          <View style={styles.actionButtonsContainer}>
            <Button 
              mode="contained"
              icon="printer"
              onPress={() => navigation.navigate('PrintSchedule', { productionId: production.id })}
              style={styles.actionButton}
            >
              Print Details
            </Button>
            
            <Button 
              mode="outlined"
              icon="dots-horizontal"
              onPress={() => setMenuVisible(true)}
              style={styles.actionButton}
            >
              More Options
            </Button>
          </View>
        )}
        
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<View />}
          style={styles.menu}
        >
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              updateStatus('in_progress');
            }} 
            title="Mark as In Progress" 
            icon="play"
          />
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              updateStatus('completed');
            }} 
            title="Mark as Completed" 
            icon="check-circle"
          />
          <Menu.Item 
            onPress={() => setCancelDialogVisible(true)} 
            title="Cancel Production" 
            icon="cancel"
          />
          <Divider />
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('Message', { 
                productionId: production.id,
                productionName: production.name
              });
            }} 
            title="Send Message" 
            icon="message"
          />
        </Menu>
        
        <Portal>
          <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
            <Dialog.Title>Cancel Production</Dialog.Title>
            <Dialog.Content>
              <Paragraph>Are you sure you want to cancel this production?</Paragraph>
              <TextInput
                label="Reason for cancellation (optional)"
                value={cancellationReason}
                onChangeText={setCancellationReason}
                style={styles.reasonInput}
                multiline
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setCancelDialogVisible(false)}>No</Button>
              <Button 
                onPress={() => updateStatus('cancelled')}
                loading={statusLoading}
                disabled={statusLoading}
              >
                Yes, Cancel
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
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
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignButton: {
    marginTop: -8,
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
  requirementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 16,
  },
  requirementCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  assignmentItem: {
    padding: 0,
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 0.48,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  menu: {
    position: 'absolute',
    right: 16,
    bottom: 72,
  },
  reasonInput: {
    marginTop: 12,
  },
});

// src/screens/bookingOfficer/AssignOperatorsScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import {
  Text,
  Title,
  Divider,
  List,
  Button,
  Searchbar,
  Chip,
  Avatar,
  Dialog,
  Portal,
  Paragraph,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';

export default function AssignOperatorsScreen({ route, navigation }) {
  const { productionId, requirements: initialRequirements, existingAssignments } = route.params;
  const theme = useTheme();

  // State
  const [production, setProduction] = useState(null);
  const [requirements, setRequirements] = useState(initialRequirements || []);
  const [operators, setOperators] = useState([]);
  const [filteredOperators, setFilteredOperators] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Conflict dialog
  const [conflictDialogVisible, setConflictDialogVisible] = useState(false);
  const [conflictingOperator, setConflictingOperator] = useState(null);
  const [conflictingProduction, setConflictingProduction] = useState(null);
  
  // Load production data
  useEffect(() => {
    const fetchProductionData = async () => {
      try {
        setLoading(true);
        
        // Get production details
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
        
        // If requirements weren't passed in props, fetch them
        if (!initialRequirements) {
          const requirementsRef = collection(db, 'requirements');
          const requirementsQuery = query(
            requirementsRef,
            where('productionId', '==', productionId)
          );
          
          const requirementsSnapshot = await getDocs(requirementsQuery);
          const requirementsList = requirementsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setRequirements(requirementsList);
        }
        
        // If existing assignments weren't passed in props, fetch them
        if (!existingAssignments) {
          const assignmentsRef = collection(db, 'assignments');
          const assignmentsQuery = query(
            assignmentsRef,
            where('productionId', '==', productionId)
          );
          
          const assignmentsSnapshot = await getDocs(assignmentsQuery);
          const assignmentsList = assignmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setCurrentAssignments(assignmentsList);
        } else {
          setCurrentAssignments(existingAssignments);
        }
      } catch (error) {
        console.error('Error fetching production data:', error);
        Alert.alert('Error', 'Failed to load production data');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductionData();
  }, [productionId, initialRequirements, existingAssignments]);

  // Convert type to display name
  const getTypeName = (type) => {
    switch (type) {
      case 'camera':
        return 'Camera Operators';
      case 'sound':
        return 'Sound Operators';
      case 'lighting':
        return 'Lighting Operators';
      case 'evs':
        return 'EVS Operators';
      case 'director':
        return 'Directors';
      case 'stream':
        return 'Stream Operators';
      case 'technician':
        return 'Technicians';
      case 'electrician':
        return 'Electricians';
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

  // Handle role selection
  const handleRoleSelect = async (role) => {
    try {
      setSelectedRole(role);
      setOperatorsLoading(true);
      
      // Fetch operators with the selected specialization
      const operatorsRef = collection(db, 'users');
      const operatorsQuery = query(
        operatorsRef,
        where('role', '==', 'operator'),
        where('specialization', '==', role)
      );
      
      const operatorsSnapshot = await getDocs(operatorsQuery);
      const operatorsList = operatorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Check if already assigned
        assigned: currentAssignments.some(
          assignment => assignment.userId === doc.id && assignment.role === role
        )
      }));
      
      setOperators(operatorsList);
      setFilteredOperators(operatorsList);
    } catch (error) {
      console.error('Error fetching operators:', error);
      Alert.alert('Error', 'Failed to load operators');
    } finally {
      setOperatorsLoading(false);
    }
  };

  // Handle search
  const onChangeSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredOperators(operators);
    } else {
      const filtered = operators.filter(operator =>
        operator.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredOperators(filtered);
    }
  };
  
  // Check for schedule conflicts
  const checkForConflicts = async (operatorId) => {
    try {
      if (!production || !production.date) return null;
      
      // Get the date range for the production
      const productionDate = production.date;
      
      // Find assignments for the same date
      const assignmentsRef = collection(db, 'assignments');
      const assignmentsQuery = query(
        assignmentsRef,
        where('userId', '==', operatorId)
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      
      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignment = assignmentDoc.data();
        
        // Skip if it's an assignment for this production
        if (assignment.productionId === productionId) continue;
        
        // Get production details to check time conflict
        const conflictProdDoc = await getDoc(doc(db, 'productions', assignment.productionId));
        
        if (conflictProdDoc.exists()) {
          const conflictProd = conflictProdDoc.data();
          
          // Check if dates are the same
          if (conflictProd.date && 
              conflictProd.date.toDate().toDateString() === productionDate.toDateString()) {
            
            // If on same date, this is a potential conflict
            return {
              assignmentId: assignmentDoc.id,
              production: {
                id: conflictProdDoc.id,
                ...conflictProd,
                date: conflictProd.date.toDate(),
                callTime: conflictProd.callTime ? conflictProd.callTime.toDate() : null,
                startTime: conflictProd.startTime ? conflictProd.startTime.toDate() : null,
                endTime: conflictProd.endTime ? conflictProd.endTime.toDate() : null,
              }
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return null;
    }
  };

  // Toggle operator assignment
  const toggleOperatorAssignment = async (operator) => {
    if (operator.assigned) {
      // Unassign operator
      const assignmentToRemove = currentAssignments.find(
        a => a.userId === operator.id && a.role === selectedRole
      );
      
      if (assignmentToRemove) {
        const newAssignments = currentAssignments.filter(a => a.id !== assignmentToRemove.id);
        setCurrentAssignments(newAssignments);
        
        const updatedOperators = operators.map(op => 
          op.id === operator.id ? { ...op, assigned: false } : op
        );
        setOperators(updatedOperators);
        setFilteredOperators(updatedOperators.filter(op => 
          op.name.toLowerCase().includes(searchQuery.toLowerCase())
        ));
      }
    } else {
      // Before assigning, check for conflicts
      const conflict = await checkForConflicts(operator.id);
      
      if (conflict) {
        setConflictingOperator(operator);
        setConflictingProduction(conflict.production);
        setConflictDialogVisible(true);
        return;
      }
      
      // Assign operator
      const newAssignment = {
        id: `temp-${Date.now()}`, // Temporary ID until saved
        productionId,
        userId: operator.id,
        role: selectedRole,
        status: 'pending',
        notificationsSent: []
      };
      
      setCurrentAssignments([...currentAssignments, newAssignment]);
      
      const updatedOperators = operators.map(op => 
        op.id === operator.id ? { ...op, assigned: true } : op
      );
      setOperators(updatedOperators);
      setFilteredOperators(updatedOperators.filter(op => 
        op.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  };

  // Proceed with assignment despite conflict
  const proceedWithAssignment = () => {
    if (!conflictingOperator) return;
    
    // Assign operator despite conflict
    const newAssignment = {
      id: `temp-${Date.now()}`, // Temporary ID until saved
      productionId,
      userId: conflictingOperator.id,
      role: selectedRole,
      status: 'pending',
      notificationsSent: []
    };
    
    setCurrentAssignments([...currentAssignments, newAssignment]);
    
    const updatedOperators = operators.map(op => 
      op.id === conflictingOperator.id ? { ...op, assigned: true } : op
    );
    setOperators(updatedOperators);
    setFilteredOperators(updatedOperators.filter(op => 
      op.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));
    
    setConflictDialogVisible(false);
    setConflictingOperator(null);
    setConflictingProduction(null);
  };

  // Format time function
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return format(date, 'h:mm a');
  };

  // Save assignments
  const saveAssignments = async () => {
    try {
      setSaving(true);
      
      // Get existing assignments in Firestore
      const assignmentsRef = collection(db, 'assignments');
      const existingAssignmentsQuery = query(
        assignmentsRef,
        where('productionId', '==', productionId)
      );
      
      const existingAssignmentsSnapshot = await getDocs(existingAssignmentsQuery);
      const existingAssignmentsMap = {};
      
      existingAssignmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        existingAssignmentsMap[`${data.userId}-${data.role}`] = doc.id;
      });
      
      // Determine which assignments to add or remove
      const assignmentsToAdd = [];
      const assignmentsToKeep = [];
      
      for (const assignment of currentAssignments) {
        const key = `${assignment.userId}-${assignment.role}`;
        
        if (existingAssignmentsMap[key]) {
          // Assignment already exists in Firestore
          assignmentsToKeep.push(existingAssignmentsMap[key]);
        } else if (!assignment.id.startsWith('temp-')) {
          // Assignment has a real ID but isn't in Firestore (edge case)
          assignmentsToKeep.push(assignment.id);
        } else {
          // New assignment to add
          assignmentsToAdd.push({
            productionId,
            userId: assignment.userId,
            role: assignment.role,
            status: 'pending',
            createdAt: serverTimestamp(),
            notificationsSent: []
          });
        }
      }
      
      // Assignments to delete (in Firestore but not in currentAssignments)
      const assignmentsToDelete = [];
      
      existingAssignmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.userId}-${data.role}`;
        
        if (!currentAssignments.some(a => `${a.userId}-${a.role}` === key)) {
          assignmentsToDelete.push(doc.id);
        }
      });
      
      // Execute all operations
      // src/screens/bookingOfficer/DashboardScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, useTheme, ActivityIndicator, Badge, SegmentedButtons } from 'react-native-paper';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isAfter, isBefore, startOfDay, addDays } from 'date-fns';

export default function BookingOfficerDashboardScreen({ navigation }) {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending');
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Function to fetch productions from Firestore
  const fetchProductions = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const today = startOfDay(now);
      const productionsRef = collection(db, 'productions');
      
      let q;
      
      // Apply filter
      if (filter === 'pending') {
        q = query(
          productionsRef,
          where('status', '==', 'requested'),
          orderBy('date', 'asc')
        );
      } else if (filter === 'today') {
        q = query(
          productionsRef,
          where('date', '>=', today),
          where('date', '<', Timestamp.fromDate(addDays(today, 1))),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
      } else if (filter === 'upcoming') {
        q = query(
          productionsRef,
          where('date', '>=', today),
          where('status', 'in', ['confirmed', 'requested']),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
      } else if (filter === 'all') {
        q = query(
          productionsRef,
          orderBy('date', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const productionsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to JS Date objects
        date: doc.data().date ? doc.data().date.toDate() : null,
        callTime: doc.data().callTime ? doc.data().callTime.toDate() : null,
        startTime: doc.data().startTime ? doc.data().startTime.toDate() : null,
        endTime: doc.data().endTime ? doc.data().endTime.toDate() : null,
      }));
      
      setProductions(productionsList);
    } catch (error) {
      console.error('Error fetching productions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch and on filter change
  useEffect(() => {
    fetchProductions();
  }, [filter]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchProductions();
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

  // Format time function
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return format(date, 'h:mm a');
  };

  // Format date function
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(date, 'EEE, MMM d, yyyy');
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

  // Render production card
  const renderProductionCard = ({ item }) => (
    <Card 
      style={styles.card}
      onPress={() => navigation.navigate('ManageRequest', { productionId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title>{item.name}</Title>
          <Chip 
            mode="outlined" 
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: 'white' }}
          >
            {getStatusText(item.status)}
          </Chip>
        </View>
        
        <Paragraph style={styles.dateText}>
          <Ionicons name="calendar-outline" size={16} /> {formatDate(item.date)}
        </Paragraph>
        
        <Divider style={styles.divider} />
        
        <View style={styles.timeContainer}>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Call Time:</Text>
            <Text style={styles.timeValue}>{formatTime(item.callTime)}</Text>
          </View>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Start:</Text>
            <Text style={styles.timeValue}>{formatTime(item.startTime)}</Text>
          </View>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>End:</Text>
            <Text style={styles.timeValue}>{formatTime(item.endTime)}</Text>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.venueContainer}>
          <Ionicons name="location-outline" size={16} />
          <Text style={styles.venueText}>
            {item.venue}
            {item.locationDetails ? ` - ${item.locationDetails}` : ''}
          </Text>
        </View>
      </Card.Content>
      
      <Card.Actions style={styles.cardActions}>
        <Button
          mode="text"
          onPress={() => navigation.navigate('ManageRequest', { productionId: item.id })}
        >
          View Details
        </Button>
        
        {item.status === 'requested' && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AssignOperators', { productionId: item.id })}
          >
            Assign Crew
          </Button>
        )}
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'pending', label: 'Pending', icon: 'clock-outline' },
            { value: 'today', label: 'Today', icon: 'calendar-today' },
            { value: 'upcoming', label: 'Upcoming', icon: 'calendar-month' },
            { value: 'all', label: 'All', icon: 'view-list' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : productions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No productions found</Text>
          <Text style={styles.emptySubtext}>
            {filter === 'pending' 
              ? 'There are no pending production requests' 
              : filter === 'today'
                ? 'There are no productions scheduled for today'
                : filter === 'upcoming'
                  ? 'There are no upcoming productions'
                  : 'No productions available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={productions}
          keyExtractor={item => item.id}
          renderItem={renderProductionCard}
          contentContainerStyle={styles.listContent}
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  segmentedButtons: {
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInfo: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueText: {
    marginLeft: 4,
  },
  cardActions: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

// src/screens/bookingOfficer/ScheduleScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Chip, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { 
  format, 
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  isToday
} from 'date-fns';

export default function BookingOfficerScheduleScreen({ navigation }) {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Start on Monday
  const [selectedDate, setSelectedDate] = useState(new Date());
  const theme = useTheme();

  // Get dates for the week
  const weekDates = eachDayOfInterval({
    start: currentWeekStart,
    end: addDays(currentWeekStart, 6)
  });

  // Fetch schedule data for the selected week
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        
        const weekStart = currentWeekStart;
        const weekEnd = addDays(weekStart, 7); // One week interval
        
        const productionsRef = collection(db, 'productions');
        const q = query(
          productionsRef,
          where('date', '>=', Timestamp.fromDate(weekStart)),
          where('date', '<', Timestamp.fromDate(weekEnd)),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const productionsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date ? doc.data().date.toDate() : null,
          callTime: doc.data().callTime ? doc.data().callTime.toDate() : null,
          startTime: doc.data().startTime ? doc.data().startTime.toDate() : null,
          endTime: doc.data().endTime ? doc.data().endTime.toDate() : null,
        }));
        
        setProductions(productionsList);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [currentWeekStart]);

  // Next week
  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  // Previous week
  const goToPrevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  // Format time function
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return format(date, 'h:mm a');
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

  // Get productions for the selected date
  const getProductionsForDate = (date) => {
    return productions.filter(production => 
      production.date && isSameDay(production.date, date)
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const selectedDateProductions = getProductionsForDate(selectedDate);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPrevWeek} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <Text style={styles.monthYear}>
          {format(currentWeekStart, 'MMMM yyyy')}
        </Text>
        
        <TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.weekContainer}>
        {weekDates.map((date) => {
          const dateProductions = getProductionsForDate(date);
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentDay = isToday(date);
          
          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.dayContainer,
                isSelected && styles.selectedDay,
                isCurrentDay && styles.currentDay
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={styles.dayName}>{format(date, 'EEE')}</Text>
              <Text style={[
                styles.dayNumber,
                isSelected && styles.selectedDayText,
                isCurrentDay && styles.currentDayText
              ]}>
                {format(date, 'd')}
              </Text>
              {dateProductions.length > 0 && (
                <View style={styles.productionIndicator}>
                  <Text style={styles.productionCount}>{dateProductions.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      <Divider />
      
      <View style={styles.dateHeaderContainer}>
        <Text style={styles.dateHeader}>
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.productionsContainer}>
        {selectedDateProductions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No productions scheduled</Text>
          </View>
        ) : (
          selectedDateProductions.map(production => (
            <Card 
              key={production.id}
              style={styles.productionCard}
              onPress={() => navigation.navigate('ManageRequest', { productionId: production.id })}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Title>{production.name}</Title>
                  <Chip 
                    mode="outlined" 
                    style={{ backgroundColor: getStatusColor(production.status) }}
                    textStyle={{ color: 'white' }}
                  >
                    {getStatusText(production.status)}
                  </Chip>
                </View>
                
                <View style={styles.timeRow}>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Call</Text>
                    <Text style={styles.timeValue}>{formatTime(production.callTime)}</Text>
                  </View>
                  
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Start</Text>
                    <Text style={styles.timeValue}>{formatTime(production.startTime)}</Text>
                  </View>
                  
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>End</Text>
                    <Text style={styles.timeValue}>{formatTime(production.endTime)}</Text>
                  </View>
                </View>
                
                <View style={styles.venueContainer}>
                  <Ionicons name="location-outline" size={16} />
                  <Text style={styles.venueText}>
                    {production.venue}
                    {production.locationDetails ? ` - ${production.locationDetails}` : ''}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  navButton: {
    padding: 4,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingBottom: 12,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  selectedDay: {
    backgroundColor: theme.colors.primary,
  },
  currentDay: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  dayName: {
    fontSize: 14,
    color: '#666',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  selectedDayText: {
    color: '#fff',
  },
  currentDayText: {
    color: theme.colors.primary,
  },
  productionIndicator: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productionCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateHeaderContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productionsContainer: {
    padding: 16,
  },
  productionCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueText: {
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
});

// src/screens/bookingOfficer/ManageRequestScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  List,
  Avatar,
  useTheme,
  Menu,
  IconButton,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function ManageRequestScreen({ route, navigation }) {
  const { productionId } = route.params;
  const { currentUser } = useAuth();
  const theme = useTheme();

  const [production, setProduction] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // Fetch production details and related data
  useEffect(() => {
    const fetchProductionDetails = async () => {
      try {
        setLoading(true);

        // Fetch production
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

        // Fetch requirements
        const requirementsRef = collection(db, 'requirements');
        const requirementsQuery = query(
          requirementsRef,
          where('productionId', '==', productionId)
        );

        const requirementsSnapshot = await getDocs(requirementsQuery);
        const requirementsList = requirementsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRequirements(requirementsList);

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

  // Update production status
  const updateStatus = async (newStatus) => {
    try {
      setStatusLoading(true);
      
      await updateDoc(doc(db, 'productions', productionId), {
        status: newStatus,
        confirmedBy: currentUser.uid,
        updatedAt: serverTimestamp()
      });

      // If confirming, send notifications to all assigned operators
      if (newStatus === 'confirmed') {
        await sendAssignmentNotifications();
      } else if (newStatus === 'cancelled') {
        await sendCancellationNotifications();
      }

      // Update local state
      setProduction({
        ...production,
        status: newStatus,
        confirmedBy: currentUser.uid
      });

      Alert.alert('Success', `Production ${newStatus === 'confirmed' ? 'confirmed' : newStatus === 'cancelled' ? 'cancelled' : 'updated'} successfully`);
    } catch (error) {
      console.error('Error updating production status:', error);
      Alert.alert('Error', 'Failed to update production status');
    } finally {
      setStatusLoading(false);
      setMenuVisible(false);
      setCancelDialogVisible(false);
    }
  };

  // Send notifications to assigned operators
  const sendAssignmentNotifications = async () => {
    try {
      // Add a notification for the producer
      if (production.requestedBy) {
        await addDoc(collection(db, 'notifications'), {
          userId: production.requestedBy,
          type: 'confirmation',
          title: 'Production Confirmed',
          body: `Your request for "${production.name}" has been confirmed.`,
          productionId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Add notifications for each assigned operator
      for (const assignment of assignments) {
        if (assignment.userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: assignment.userId,
            type: 'assignment',
            title: 'New Production Assignment',
            body: `You have been assigned to "${production.name}" on ${format(production.date, 'EEE, MMM d')} at ${formatTime(production.callTime)}.`,
            productionId,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

// Send cancellation notifications
const sendCancellationNotifications = async () => {
    try {
      // Add a notification for the producer
      if (production.requestedBy) {
        await addDoc(collection(db, 'notifications'), {
          userId: production.requestedBy,
          type: 'cancellation',
          title: 'Production Cancelled',
          body: `Your production "${production.name}" has been cancelled. Reason: ${cancellationReason || 'Not specified'}`,
          productionId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Add notifications for each assigned operator
      for (const assignment of assignments) {
        if (assignment.userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: assignment.userId,
            type: 'cancellation',
            title: 'Production Cancelled',
            body: `The production "${production.name}" scheduled for ${format(production.date, 'EEE, MMM d')} has been cancelled.`,
            productionId,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error sending cancellation notifications:', error);
    }
  };

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

  // Handle assign operators
  const handleAssignOperators = () => {
    navigation.navigate('AssignOperators', { 
      productionId, 
      requirements,
      existingAssignments: assignments
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
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Crew Requirements</Text>
              
              {requirements.length === 0 ? (
                <Text style={styles.emptyText}>No crew requirements specified</Text>
              ) : (
                requirements.map(req => (
                  <View key={req.id} style={styles.requirementRow}>
                    <View style={styles.requirementInfo}>
                      <Ionicons name={getTypeIcon(req.type)} size={20} color="#555" />
                      <Text style={styles.requirementText}>
                        {getTypeName(req.type)}
                      </Text>
                    </View>
                    <Text style={styles.requirementCount}>{req.count}</Text>
                  </View>
                ))
              )}
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
            
            <Divider style={styles.divider} />
            
            <View style={styles.detailsSection}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Assigned Crew</Text>
                
                {(production.status === 'requested' || production.status === 'confirmed') && (
                  <Button 
                    mode="outlined"
                    onPress={handleAssignOperators}
                    style={styles.assignButton}
                  >
                    {assignments.length > 0 ? 'Edit Assignments' : 'Assign Crew'}
                  </Button>
                )}
              </View>
              
              {assignments.length === 0 ? (
                <Text style={styles.emptyText}>No crew assigned yet</Text>
              ) : (
                assignments.map(assignment => (
                  <List.Item
                    key={assignment.id}
                    title={assignment.userDetails?.name || 'Unknown'}
                    description={getTypeName(assignment.role)}
                    left={props => (
                      <Avatar.Icon 
                        {...props} 
                        icon={getTypeIcon(assignment.role)}
                        size={40}
                        color="#fff"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                    )}
                    style={styles.assignmentItem}
                  />
                ))
              )}
            </View>
          </Card.Content>
        </Card>
        
        {production.status === 'requested' && (
          <View style={styles.actionButtonsContainer}>
            <Button 
              mode="contained"
              icon="check"
              onPress={() => updateStatus('confirmed')}
              style={[styles.actionButton, styles.confirmButton]}
              loading={statusLoading}
              disabled={statusLoading || assignments.length === 0}
            >
              Confirm Production
            </Button>
            
            <Button 
              mode="outlined"
              icon="close"
              onPress={() => setCancelDialogVisible(true)}
              style={styles.actionButton}
              loading={statusLoading}
              disabled={statusLoading}
            >
              Cancel Production
            </Button>
          </View>
        )}
        
        {production.status === 'confirmed' && (
          <View style={styles.actionButtonsContainer}>
            <Button 
              mode="contained"
              icon="printer"
              onPress={() => navigation.navigate('PrintSchedule', { productionId: production.id })}
              style={styles.actionButton}
            >
              Print Details
            </Button>
            
            <Button 
              mode="outlined"
              icon="dots-horizontal"
              onPress={() => setMenuVisible(true)}
              style={styles.actionButton}
            >
              More Options
            </Button>
          </View>
        )}
        
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<View />}
          style={styles.menu}
        >
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              updateStatus('in_progress');
            }} 
            title="Mark as In Progress" 
            icon="play"
          />
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              updateStatus('completed');
            }} 
            title="Mark as Completed" 
            icon="check-circle"
          />
          <Menu.Item 
            onPress={() => setCancelDialogVisible(true)} 
            title="Cancel Production" 
            icon="cancel"
          />
          <Divider />
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('Message', { 
                productionId: production.id,
                productionName: production.name
              });
            }} 
            title="Send Message" 
            icon="message"
          />
        </Menu>
        
        <Portal>
          <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
            <Dialog.Title>Cancel Production</Dialog.Title>
            <Dialog.Content>
              <Paragraph>Are you sure you want to cancel this production?</Paragraph>
              <TextInput
                label="Reason for cancellation (optional)"
                value={cancellationReason}
                onChangeText={setCancellationReason}
                style={styles.reasonInput}
                multiline
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setCancelDialogVisible(false)}>No</Button>
              <Button 
                onPress={() => updateStatus('cancelled')}
                loading={statusLoading}
                disabled={statusLoading}
              >
                Yes, Cancel
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
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
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignButton: {
    marginTop: -8,
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
  requirementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 16,
  },
  requirementCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  assignmentItem: {
    padding: 0,
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 0.48,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  menu: {
    position: 'absolute',
    right: 16,
    bottom: 72,
  },
  reasonInput: {
    marginTop: 12,
  },
});

// src/screens/bookingOfficer/AssignOperatorsScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import {
  Text,
  Title,
  Divider,
  List,
  Button,
  Searchbar,
  Chip,
  Avatar,
  Dialog,
  Portal,
  Paragraph,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';

export default function AssignOperatorsScreen({ route, navigation }) {
  const { productionId, requirements: initialRequirements, existingAssignments } = route.params;
  const theme = useTheme();

  // State
  const [production, setProduction] = useState(null);
  const [requirements, setRequirements] = useState(initialRequirements || []);
  const [operators, setOperators] = useState([]);
  const [filteredOperators, setFilteredOperators] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [operatorsLoading, setOperatorsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Conflict dialog
  const [conflictDialogVisible, setConflictDialogVisible] = useState(false);
  const [conflictingOperator, setConflictingOperator] = useState(null);
  const [conflictingProduction, setConflictingProduction] = useState(null);
  
  // Load production data
  useEffect(() => {
    const fetchProductionData = async () => {
      try {
        setLoading(true);
        
        // Get production details
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
        
        // If requirements weren't passed in props, fetch them
        if (!initialRequirements) {
          const requirementsRef = collection(db, 'requirements');
          const requirementsQuery = query(
            requirementsRef,
            where('productionId', '==', productionId)
          );
          
          const requirementsSnapshot = await getDocs(requirementsQuery);
          const requirementsList = requirementsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setRequirements(requirementsList);
        }
        
        // If existing assignments weren't passed in props, fetch them
        if (!existingAssignments) {
          const assignmentsRef = collection(db, 'assignments');
          const assignmentsQuery = query(
            assignmentsRef,
            where('productionId', '==', productionId)
          );
          
          const assignmentsSnapshot = await getDocs(assignmentsQuery);
          const assignmentsList = assignmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setCurrentAssignments(assignmentsList);
        } else {
          setCurrentAssignments(existingAssignments);
        }
      } catch (error) {
        console.error('Error fetching production data:', error);
        Alert.alert('Error', 'Failed to load production data');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductionData();
  }, [productionId, initialRequirements, existingAssignments]);

  // Convert type to display name
  const getTypeName = (type) => {
    switch (type) {
      case 'camera':
        return 'Camera Operators';
      case 'sound':
        return 'Sound Operators';
      case 'lighting':
        return 'Lighting Operators';
      case 'evs':
        return 'EVS Operators';
      case 'director':
        return 'Directors';
      case 'stream':
        return 'Stream Operators';
      case 'technician':
        return 'Technicians';
      case 'electrician':
        return 'Electricians';
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

  // Handle role selection
  const handleRoleSelect = async (role) => {
    try {
      setSelectedRole(role);
      setOperatorsLoading(true);
      
      // Fetch operators with the selected specialization
      const operatorsRef = collection(db, 'users');
      const operatorsQuery = query(
        operatorsRef,
        where('role', '==', 'operator'),
        where('specialization', '==', role)
      );
      
      const operatorsSnapshot = await getDocs(operatorsQuery);
      const operatorsList = operatorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Check if already assigned
        assigned: currentAssignments.some(
          assignment => assignment.userId === doc.id && assignment.role === role
        )
      }));
      
      setOperators(operatorsList);
      setFilteredOperators(operatorsList);
    } catch (error) {
      console.error('Error fetching operators:', error);
      Alert.alert('Error', 'Failed to load operators');
    } finally {
      setOperatorsLoading(false);
    }
  };

  // Handle search
  const onChangeSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredOperators(operators);
    } else {
      const filtered = operators.filter(operator =>
        operator.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredOperators(filtered);
    }
  };
  
  // Check for schedule conflicts
  const checkForConflicts = async (operatorId) => {
    try {
      if (!production || !production.date) return null;
      
      // Get the date range for the production
      const productionDate = production.date;
      
      // Find assignments for the same date
      const assignmentsRef = collection(db, 'assignments');
      const assignmentsQuery = query(
        assignmentsRef,
        where('userId', '==', operatorId)
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      
      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const assignment = assignmentDoc.data();
        
        // Skip if it's an assignment for this production
        if (assignment.productionId === productionId) continue;
        
        // Get production details to check time conflict
        const conflictProdDoc = await getDoc(doc(db, 'productions', assignment.productionId));
        
        if (conflictProdDoc.exists()) {
          const conflictProd = conflictProdDoc.data();
          
          // Check if dates are the same
          if (conflictProd.date && 
              conflictProd.date.toDate().toDateString() === productionDate.toDateString()) {
            
            // If on same date, this is a potential conflict
            return {
              assignmentId: assignmentDoc.id,
              production: {
                id: conflictProdDoc.id,
                ...conflictProd,
                date: conflictProd.date.toDate(),
                callTime: conflictProd.callTime ? conflictProd.callTime.toDate() : null,
                startTime: conflictProd.startTime ? conflictProd.startTime.toDate() : null,
                endTime: conflictProd.endTime ? conflictProd.endTime.toDate() : null,
              }
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return null;
    }
  };

  // Toggle operator assignment
  const toggleOperatorAssignment = async (operator) => {
    if (operator.assigned) {
      // Unassign operator
      const assignmentToRemove = currentAssignments.find(
        a => a.userId === operator.id && a.role === selectedRole
      );
      
      if (assignmentToRemove) {
        const newAssignments = currentAssignments.filter(a => a.id !== assignmentToRemove.id);
        setCurrentAssignments(newAssignments);
        
        const updatedOperators = operators.map(op => 
          op.id === operator.id ? { ...op, assigned: false } : op
        );
        setOperators(updatedOperators);
        setFilteredOperators(updatedOperators.filter(op => 
          op.name.toLowerCase().includes(searchQuery.toLowerCase())
        ));
      }
    } else {
      // Before assigning, check for conflicts
      const conflict = await checkForConflicts(operator.id);
      
      if (conflict) {
        setConflictingOperator(operator);
        setConflictingProduction(conflict.production);
        setConflictDialogVisible(true);
        return;
      }
      
      // Assign operator
      const newAssignment = {
        id: `temp-${Date.now()}`, // Temporary ID until saved
        productionId,
        userId: operator.id,
        role: selectedRole,
        status: 'pending',
        notificationsSent: []
      };
      
      setCurrentAssignments([...currentAssignments, newAssignment]);
      
      const updatedOperators = operators.map(op => 
        op.id === operator.id ? { ...op, assigned: true } : op
      );
      setOperators(updatedOperators);
      setFilteredOperators(updatedOperators.filter(op => 
        op.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  };

  // Proceed with assignment despite conflict
  const proceedWithAssignment = () => {
    if (!conflictingOperator) return;
    
    // Assign operator despite conflict
    const newAssignment = {
      id: `temp-${Date.now()}`, // Temporary ID until saved
      productionId,
      userId: conflictingOperator.id,
      role: selectedRole,
      status: 'pending',
      notificationsSent: []
    };
    
    setCurrentAssignments([...currentAssignments, newAssignment]);
    
    const updatedOperators = operators.map(op => 
      op.id === conflictingOperator.id ? { ...op, assigned: true } : op
    );
    setOperators(updatedOperators);
    setFilteredOperators(updatedOperators.filter(op => 
      op.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));
    
    setConflictDialogVisible(false);
    setConflictingOperator(null);
    setConflictingProduction(null);
  };

  // Format time function
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return format(date, 'h:mm a');
  };

  // Save assignments
  const saveAssignments = async () => {
    try {
      setSaving(true);
      
      // Get existing assignments in Firestore
      const assignmentsRef = collection(db, 'assignments');
      const existingAssignmentsQuery = query(
        assignmentsRef,
        where('productionId', '==', productionId)
      );
      
      const existingAssignmentsSnapshot = await getDocs(existingAssignmentsQuery);
      const existingAssignmentsMap = {};
      
      existingAssignmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        existingAssignmentsMap[`${data.userId}-${data.role}`] = doc.id;
      });
      
      // Determine which assignments to add or remove
      const assignmentsToAdd = [];
      const assignmentsToKeep = [];
      
      for (const assignment of currentAssignments) {
        const key = `${assignment.userId}-${assignment.role}`;
        
        if (existingAssignmentsMap[key]) {
          // Assignment already exists in Firestore
          assignmentsToKeep.push(existingAssignmentsMap[key]);
        } else if (!assignment.id.startsWith('temp-')) {
          // Assignment has a real ID but isn't in Firestore (edge case)
          assignmentsToKeep.push(assignment.id);
        } else {
          // New assignment to add
          assignmentsToAdd.push({
            productionId,
            userId: assignment.userId,
            role: assignment.role,
            status: 'pending',
            createdAt: serverTimestamp(),
            notificationsSent: []
          });
        }
      }
      
      // Assignments to delete (in Firestore but not in currentAssignments)
      const assignmentsToDelete = [];
      
      existingAssignmentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.userId}-${data.role}`;
        
        if (!currentAssignments.some(a => `${a.userId}-${a.role}` === key)) {
          assignmentsToDelete.push(doc.id);
        }
      });
      
      // Execute all operations
      // src/screens/bookingOfficer/DashboardScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, useTheme, ActivityIndicator, Badge, SegmentedButtons } from 'react-native-paper';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isAfter, isBefore, startOfDay, addDays } from 'date-fns';

export default function BookingOfficerDashboardScreen({ navigation }) {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending');
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Function to fetch productions from Firestore
  const fetchProductions = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const today = startOfDay(now);
      const productionsRef = collection(db, 'productions');
      
      let q;
      
      // Apply filter
      if (filter === 'pending') {
        q = query(
          productionsRef,
          where('status', '==', 'requested'),
          orderBy('date', 'asc')
        );
      } else if (filter === 'today') {
        q = query(
          productionsRef,
          where('date', '>=', today),
          where('date', '<', Timestamp.fromDate(addDays(today, 1))),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
      } else if (filter === 'upcoming') {
        q = query(
          productionsRef,
          where('date', '>=', today),
          where('status', 'in', ['confirmed', 'requested']),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
      } else if (filter === 'all') {
        q = query(
          productionsRef,
          orderBy('date', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const productionsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamps to JS Date objects
        date: doc.data().date ? doc.data().date.toDate() : null,
        callTime: doc.data().callTime ? doc.data().callTime.toDate() : null,
        startTime: doc.data().startTime ? doc.data().startTime.toDate() : null,
        endTime: doc.data().endTime ? doc.data().endTime.toDate() : null,
      }));
      
      setProductions(productionsList);
    } catch (error) {
      console.error('Error fetching productions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch and on filter change
  useEffect(() => {
    fetchProductions();
  }, [filter]);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchProductions();
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

  // Format time function
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return format(date, 'h:mm a');
  };

  // Format date function
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return format(date, 'EEE, MMM d, yyyy');
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

  // Render production card
  const renderProductionCard = ({ item }) => (
    <Card 
      style={styles.card}
      onPress={() => navigation.navigate('ManageRequest', { productionId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title>{item.name}</Title>
          <Chip 
            mode="outlined" 
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: 'white' }}
          >
            {getStatusText(item.status)}
          </Chip>
        </View>
        
        <Paragraph style={styles.dateText}>
          <Ionicons name="calendar-outline" size={16} /> {formatDate(item.date)}
        </Paragraph>
        
        <Divider style={styles.divider} />
        
        <View style={styles.timeContainer}>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Call Time:</Text>
            <Text style={styles.timeValue}>{formatTime(item.callTime)}</Text>
          </View>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Start:</Text>
            <Text style={styles.timeValue}>{formatTime(item.startTime)}</Text>
          </View>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>End:</Text>
            <Text style={styles.timeValue}>{formatTime(item.endTime)}</Text>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.venueContainer}>
          <Ionicons name="location-outline" size={16} />
          <Text style={styles.venueText}>
            {item.venue}
            {item.locationDetails ? ` - ${item.locationDetails}` : ''}
          </Text>
        </View>
      </Card.Content>
      
      <Card.Actions style={styles.cardActions}>
        <Button
          mode="text"
          onPress={() => navigation.navigate('ManageRequest', { productionId: item.id })}
        >
          View Details
        </Button>
        
        {item.status === 'requested' && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AssignOperators', { productionId: item.id })}
          >
            Assign Crew
          </Button>
        )}
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'pending', label: 'Pending', icon: 'clock-outline' },
            { value: 'today', label: 'Today', icon: 'calendar-today' },
            { value: 'upcoming', label: 'Upcoming', icon: 'calendar-month' },
            { value: 'all', label: 'All', icon: 'view-list' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : productions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No productions found</Text>
          <Text style={styles.emptySubtext}>
            {filter === 'pending' 
              ? 'There are no pending production requests' 
              : filter === 'today'
                ? 'There are no productions scheduled for today'
                : filter === 'upcoming'
                  ? 'There are no upcoming productions'
                  : 'No productions available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={productions}
          keyExtractor={item => item.id}
          renderItem={renderProductionCard}
          contentContainerStyle={styles.listContent}
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  segmentedButtons: {
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInfo: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueText: {
    marginLeft: 4,
  },
  cardActions: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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

// src/screens/bookingOfficer/ScheduleScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Chip, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { 
  format, 
  addDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  isToday
} from 'date-fns';

export default function BookingOfficerScheduleScreen({ navigation }) {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Start on Monday
  const [selectedDate, setSelectedDate] = useState(new Date());
  const theme = useTheme();

  // Get dates for the week
  const weekDates = eachDayOfInterval({
    start: currentWeekStart,
    end: addDays(currentWeekStart, 6)
  });

  // Fetch schedule data for the selected week
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        
        const weekStart = currentWeekStart;
        const weekEnd = addDays(weekStart, 7); // One week interval
        
        const productionsRef = collection(db, 'productions');
        const q = query(
          productionsRef,
          where('date', '>=', Timestamp.fromDate(weekStart)),
          where('date', '<', Timestamp.fromDate(weekEnd)),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const productionsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date ? doc.data().date.toDate() : null,
          callTime: doc.data().callTime ? doc.data().callTime.toDate() : null,
          startTime: doc.data().startTime ? doc.data().startTime.toDate() : null,
          endTime: doc.data().endTime ? doc.data().endTime.toDate() : null,
        }));
        
        setProductions(productionsList);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [currentWeekStart]);

  // Next week
  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  // Previous week
  const goToPrevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  // Format time function
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return format(date, 'h:mm a');
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

  // Get productions for the selected date
  const getProductionsForDate = (date) => {
    return productions.filter(production => 
      production.date && isSameDay(production.date, date)
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const selectedDateProductions = getProductionsForDate(selectedDate);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={goToPrevWeek} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <Text style={styles.monthYear}>
          {format(currentWeekStart, 'MMMM yyyy')}
        </Text>
        
        <TouchableOpacity onPress={goToNextWeek} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.weekContainer}>
        {weekDates.map((date) => {
          const dateProductions = getProductionsForDate(date);
          const isSelected = isSameDay(date, selectedDate);
          const isCurrentDay = isToday(date);
          
          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[
                styles.dayContainer,
                isSelected && styles.selectedDay,
                isCurrentDay && styles.currentDay
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={styles.dayName}>{format(date, 'EEE')}</Text>
              <Text style={[
                styles.dayNumber,
                isSelected && styles.selectedDayText,
                isCurrentDay && styles.currentDayText
              ]}>
                {format(date, 'd')}
              </Text>
              {dateProductions.length > 0 && (
                <View style={styles.productionIndicator}>
                  <Text style={styles.productionCount}>{dateProductions.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      <Divider />
      
      <View style={styles.dateHeaderContainer}>
        <Text style={styles.dateHeader}>
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.productionsContainer}>
        {selectedDateProductions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No productions scheduled</Text>
          </View>
        ) : (
          selectedDateProductions.map(production => (
            <Card 
              key={production.id}
              style={styles.productionCard}
              onPress={() => navigation.navigate('ManageRequest', { productionId: production.id })}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <Title>{production.name}</Title>
                  <Chip 
                    mode="outlined" 
                    style={{ backgroundColor: getStatusColor(production.status) }}
                    textStyle={{ color: 'white' }}
                  >
                    {getStatusText(production.status)}
                  </Chip>
                </View>
                
                <View style={styles.timeRow}>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Call</Text>
                    <Text style={styles.timeValue}>{formatTime(production.callTime)}</Text>
                  </View>
                  
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Start</Text>
                    <Text style={styles.timeValue}>{formatTime(production.startTime)}</Text>
                  </View>
                  
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>End</Text>
                    <Text style={styles.timeValue}>{formatTime(production.endTime)}</Text>
                  </View>
                </View>
                
                <View style={styles.venueContainer}>
                  <Ionicons name="location-outline" size={16} />
                  <Text style={styles.venueText}>
                    {production.venue}
                    {production.locationDetails ? ` - ${production.locationDetails}` : ''}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  navButton: {
    padding: 4,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  weekContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingBottom: 12,
  },
  dayContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  selectedDay: {
    backgroundColor: theme.colors.primary,
  },
  currentDay: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  dayName: {
    fontSize: 14,
    color: '#666',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  selectedDayText: {
    color: '#fff',
  },
  currentDayText: {
    color: theme.colors.primary,
  },
  productionIndicator: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productionCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateHeaderContainer: {
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productionsContainer: {
    padding: 16,
  },
  productionCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueText: {
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
});

// src/screens/bookingOfficer/ManageRequestScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  List,
  Avatar,
  useTheme,
  Menu,
  IconButton,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function ManageRequestScreen({ route, navigation }) {
  const { productionId } = route.params;
  const { currentUser } = useAuth();
  const theme = useTheme();

  const [production, setProduction] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  // Fetch production details and related data
  useEffect(() => {
    const fetchProductionDetails = async () => {
      try {
        setLoading(true);

        // Fetch production
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

        // Fetch requirements
        const requirementsRef = collection(db, 'requirements');
        const requirementsQuery = query(
          requirementsRef,
          where('productionId', '==', productionId)
        );

        const requirementsSnapshot = await getDocs(requirementsQuery);
        const requirementsList = requirementsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setRequirements(requirementsList);

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

  // Update production status
  const updateStatus = async (newStatus) => {
    try {
      setStatusLoading(true);
      
      await updateDoc(doc(db, 'productions', productionId), {
        status: newStatus,
        confirmedBy: currentUser.uid,
        updatedAt: serverTimestamp()
      });

      // If confirming, send notifications to all assigned operators
      if (newStatus === 'confirmed') {
        await sendAssignmentNotifications();
      } else if (newStatus === 'cancelled') {
        await sendCancellationNotifications();
      }

      // Update local state
      setProduction({
        ...production,
        status: newStatus,
        confirmedBy: currentUser.uid
      });

      Alert.alert('Success', `Production ${newStatus === 'confirmed' ? 'confirmed' : newStatus === 'cancelled' ? 'cancelled' : 'updated'} successfully`);
    } catch (error) {
      console.error('Error updating production status:', error);
      Alert.alert('Error', 'Failed to update production status');
    } finally {
      setStatusLoading(false);
      setMenuVisible(false);
      setCancelDialogVisible(false);
    }
  };

  // Send notifications to assigned operators
  const sendAssignmentNotifications = async () => {
    try {
      // Add a notification for the producer
      if (production.requestedBy) {
        await addDoc(collection(db, 'notifications'), {
          userId: production.requestedBy,
          type: 'confirmation',
          title: 'Production Confirmed',
          body: `Your request for "${production.name}" has been confirmed.`,
          productionId,
          read: false,
          createdAt: serverTimestamp()
        });
      }

      // Add notifications for each assigned operator
      for (const assignment of assignments) {
        if (assignment.userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: assignment.userId,
            type: 'assignment',
            title: 'New Production Assignment',
            body: `You have been assigned to "${production.name}" on ${format(production.date, 'EEE, MMM d')} at ${formatTime(production.callTime)}.`,
            productionId,
            read: false,
            createdAt: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  // Send cancellation notifications
  const sendCancellationNotifications = async () => {
    try {


import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, useTheme, ActivityIndicator, Badge, SegmentedButtons } from 'react-native-paper';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isAfter, isBefore, startOfDay, addDays } from 'date-fns';

export default function BookingOfficerDashboardScreen({ navigation }) {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('pending');
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Function to fetch productions from Firestore
  const fetchProductions = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const today = startOfDay(now);
      const productionsRef = collection(db, 'productions');
      
      let q;
      
      // Apply filter
      if (filter === 'pending') {
        q = query(
          productionsRef,
          where('status', '==', 'requested'),
          orderBy('date', 'asc')
        );
      } else if (filter === 'today') {
        q = query(
          productionsRef,
          where('date', '>=', today),
          where('date', '<', Timestamp.fromDate(addDays(today, 1))),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
      } else if (filter === 'upcoming') {
        q = query(
          productionsRef,
          where('date', '>=', today),
          where('status', 'in', ['confirmed', 'requested']),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
      } else if (filter === 'all') {
        q = query(
          productionsRef,
          orderBy('date',