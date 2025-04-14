// src/screens/producer/DashboardScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function ProducerDashboardScreen({ navigation }) {
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Function to fetch productions from Firestore
  const fetchProductions = async () => {
    try {
      setLoading(true);
      
      const productionsRef = collection(db, 'productions');
      const q = query(
        productionsRef,
        where('requestedBy', '==', currentUser.uid),
        orderBy('date', 'desc')
      );
      
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

  // Initial fetch
  useEffect(() => {
    fetchProductions();
  }, []);

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
      onPress={() => navigation.navigate('RequestDetails', { productionId: item.id })}
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
          onPress={() => navigation.navigate('RequestDetails', { productionId: item.id })}
        >
          View Details
        </Button>
        
        {item.status === 'in_progress' && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Message', { 
              productionId: item.id,
              productionName: item.name
            })}
            style={styles.messageButton}
          >
            Report Overtime
          </Button>
        )}
      </Card.Actions>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.headerContainer}>
        <Title style={styles.header}>My Productions</Title>
        <Button 
          mode="contained" 
          icon="plus"
          onPress={() => navigation.navigate('Create')}
        >
          New Request
        </Button>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : productions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No productions yet</Text>
          <Text style={styles.emptySubtext}>
            Create a new production request to get started
          </Text>
          <Button 
            mode="contained" 
            icon="plus"
            onPress={() => navigation.navigate('Create')}
            style={styles.emptyButton}
          >
            New Request
          </Button>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
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
  messageButton: {
    backgroundColor: '#E53935',
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
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 16,
  },
});

// src/screens/producer/ScheduleScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SectionList } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow, isThisWeek, addDays, startOfDay } from 'date-fns';

export default function ProducerScheduleScreen({ navigation }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Fetch schedule data
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        
        const today = startOfDay(new Date());
        
        const productionsRef = collection(db, 'productions');
        const q = query(
          productionsRef,
          where('requestedBy', '==', currentUser.uid),
          where('date', '>=', today),
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
        
        // Group by date sections
        const groupedData = groupByDateSection(productionsList);
        
        setSchedule(groupedData);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  // Group productions by date section (Today, Tomorrow, This Week, Later)
  const groupByDateSection = (productionsList) => {
    const today = [];
    const tomorrow = [];
    const thisWeek = [];
    const later = [];
    
    productionsList.forEach(production => {
      if (!production.date) return;
      
      if (isToday(production.date)) {
        today.push(production);
      } else if (isTomorrow(production.date)) {
        tomorrow.push(production);
      } else if (isThisWeek(production.date)) {
        thisWeek.push(production);
      } else {
        later.push(production);
      }
    });
    
    const sections = [];
    
    if (today.length > 0) {
      sections.push({ title: 'Today', data: today });
    }
    
    if (tomorrow.length > 0) {
      sections.push({ title: 'Tomorrow', data: tomorrow });
    }
    
    if (thisWeek.length > 0) {
      sections.push({ title: 'This Week', data: thisWeek });
    }
    
    if (later.length > 0) {
      sections.push({ title: 'Upcoming', data: later });
    }
    
    return sections;
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

  // Render production item
  const renderProductionItem = ({ item }) => (
    <Card 
      style={styles.card}
      onPress={() => navigation.navigate('RequestDetails', { productionId: item.id })}
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
        
        <View style={styles.timeRow}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Call Time</Text>
            <Text style={styles.timeValue}>{formatTime(item.callTime)}</Text>
          </View>
          
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>Start</Text>
            <Text style={styles.timeValue}>{formatTime(item.startTime)}</Text>
          </View>
          
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>End</Text>
            <Text style={styles.timeValue}>{formatTime(item.endTime)}</Text>
          </View>
        </View>
        
        <View style={styles.venueContainer}>
          <Ionicons name="location-outline" size={16} />
          <Text style={styles.venueText}>
            {item.venue}
            {item.locationDetails ? ` - ${item.locationDetails}` : ''}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  // Render section header
  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {schedule.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No upcoming productions</Text>
          <Text style={styles.emptySubtext}>
            Create a new production request to see it in your schedule
          </Text>
          <Button 
            mode="contained" 
            icon="plus"
            onPress={() => navigation.navigate('Create')}
            style={styles.emptyButton}
          >
            New Request
          </Button>
        </View>
      ) : (
        <SectionList
          sections={schedule}
          keyExtractor={(item) => item.id}
          renderItem={renderProductionItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  sectionHeader: {
    backgroundColor: '#fff',
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2c3e50',
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 16,
    borderRadius: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeItem: {
    alignItems: 'center',
    flex: 1,
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
    marginBottom: 24,
  },
  emptyButton: {
    marginTop: 16,
  },
});

// src/screens/producer/CreateRequestScreen.js

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Title,
  HelperText,
  Divider,
  useTheme,
  Checkbox,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

export default function CreateRequestScreen({ navigation }) {
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Form state
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [callTime, setCallTime] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000)); // Default to 1 hour later
  const [venue, setVenue] = useState('Studio 1');
  const [locationDetails, setLocationDetails] = useState('');
  const [notes, setNotes] = useState('');
  
  // Requirements
  const [cameraCount, setCameraCount] = useState(0);
  const [soundCount, setSoundCount] = useState(0);
  const [lightingCount, setLightingCount] = useState(0);
  const [isOutsideBroadcast, setIsOutsideBroadcast] = useState(false);
  const [evsCount, setEvsCount] = useState(0);
  const [needsDirector, setNeedsDirector] = useState(false);
  const [needsStreamOperator, setNeedsStreamOperator] = useState(false);
  const [needsTechnician, setNeedsTechnician] = useState(false);
  const [needsElectrician, setNeedsElectrician] = useState(false);
  const [needsTransport, setNeedsTransport] = useState(false);
  
  // Date/time picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCallTimePicker, setShowCallTimePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [dateTimePickerMode, setDateTimePickerMode] = useState('date');
  const [currentPicker, setCurrentPicker] = useState('');

  // Loading state
  const [loading, setLoading] = useState(false);

  // Validate form
  const validateForm = () => {
    if (!name) {
      Alert.alert('Error', 'Please enter a production name');
      return false;
    }
    
    if (date < new Date()) {
      Alert.alert('Error', 'Production date cannot be in the past');
      return false;
    }
    
    if (startTime <= callTime) {
      Alert.alert('Error', 'Start time must be after call time');
      return false;
    }
    
    if (endTime <= startTime) {
      Alert.alert('Error', 'End time must be after start time');
      return false;
    }
    
    if (venue === 'Location' && !locationDetails) {
      Alert.alert('Error', 'Please enter location details for outside broadcasts');
      return false;
    }
    
    // Check if any crew is requested
    if (
      cameraCount === 0 &&
      soundCount === 0 &&
      lightingCount === 0 &&
      evsCount === 0 &&
      !needsDirector &&
      !needsStreamOperator &&
      !needsTechnician &&
      !needsElectrician &&
      !needsTransport
    ) {
      Alert.alert('Error', 'Please select at least one crew requirement');
      return false;
    }
    
    return true;
  };

  // Handle date/time picker changes
  const onDateTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      hideAllPickers();
    }
    
    if (selectedDate) {
      if (currentPicker === 'date') {
        setDate(selectedDate);
        if (Platform.OS === 'ios' && dateTimePickerMode === 'date') {
          setDateTimePickerMode('time');
        }
      } else if (currentPicker === 'callTime') {
        setCallTime(selectedDate);
      } else if (currentPicker === 'startTime') {
        setStartTime(selectedDate);
      } else if (currentPicker === 'endTime') {
        setEndTime(selectedDate);
      }
    }
  };

  // Show date picker
  const showDatePickerModal = () => {
    setDateTimePickerMode('date');
    setCurrentPicker('date');
    setShowDatePicker(true);
  };

  // Show call time picker
  const showCallTimePickerModal = () => {
    setDateTimePickerMode('time');
    setCurrentPicker('callTime');
    setShowCallTimePicker(true);
  };

  // Show start time picker
  const showStartTimePickerModal = () => {
    setDateTimePickerMode('time');
    setCurrentPicker('startTime');
    setShowStartTimePicker(true);
  };

  // Show end time picker
  const showEndTimePickerModal = () => {
    setDateTimePickerMode('time');
    setCurrentPicker('endTime');
    setShowEndTimePicker(true);
  };

  // Hide all pickers
  const hideAllPickers = () => {
    setShowDatePicker(false);
    setShowCallTimePicker(false);
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
  };

  // Format date for display
  const formatDateForDisplay = (date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  // Format time for display
  const formatTimeForDisplay = (date) => {
    return format(date, 'h:mm a');
  };

  // Submit request
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Create production document
      const productionData = {
        name,
        date,
        callTime,
        startTime,
        endTime,
        venue,
        locationDetails: venue === 'Location' ? locationDetails : '',
        status: 'requested',
        requestedBy: currentUser.uid,
        notes,
        isOutsideBroadcast,
        createdAt: serverTimestamp(),
      };
      
      const productionRef = await addDoc(collection(db, 'productions'), productionData);
      
      // Create requirements
      const requirementsData = [];
      
      if (cameraCount > 0) {
        requirementsData.push({
          productionId: productionRef.id,
          type: 'camera',
          count: cameraCount,
          details: '',
        });
      }
      
      if (soundCount > 0) {
        requirementsData.push({
          productionId: productionRef.id,
          type: 'sound',
          count: soundCount,
          details: '',
        });
      }
      
      if (lightingCount > 0) {
        requirementsData.push({
          productionId: productionRef.id,
          type: 'lighting',
          count: lightingCount,
          details: '',
        });
      }
      
      if (evsCount > 0) {
        requirementsData.push({
          productionId: productionRef.id,
          type: 'evs',
          count: evsCount,
          details: '',
        });
      }
      
      if (needsDirector) {
        requirementsData.push({
          productionId: productionRef.id,
          type: 'director',
          count: 1,
          details: '',
        });
      }
      
      if (needsStreamOperator) {
        requirementsData.push({
          productionId: productionRef.id,
          type: 'stream',
          count: 1,
          details: '',
        });
      }
      
      if (needsTechnician) {
        requirementsData.push({
          productionId: productionRef.id,
          type: 'technician',
          count: 1,
          details: '',
        });
      }
      
      if (needsElectrician) {
        requirementsData.push({
          productionId: productionRef.id,
          type: 'electrician',
          count: 1,
          details: '',
        });
      }
      
      if (needsTransport) {
        requirementsData.push({
          productionId: productionRef.id,
          type: 'transport',
          count: 1,
          details: '',
        });
      }
      
      // Add all requirements
      const requirementPromises = requirementsData.map(req => 
        addDoc(collection(db, 'requirements'), req)
      );
      
      await Promise.all(requirementPromises);
      
      Alert.alert(
        'Success',
        'Production request submitted successfully',
        [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
      );
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again