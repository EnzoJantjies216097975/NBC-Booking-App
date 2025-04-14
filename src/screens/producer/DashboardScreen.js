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
      Alert.alert('Error', 'Failed to submit request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Title style={styles.title}>Create Production Request</Title>
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Production Details</Text>
            
            <TextInput
              label="Production Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              mode="outlined"
            />
            
            <Text style={styles.inputLabel}>Production Date</Text>
            <Button
              mode="outlined"
              onPress={showDatePickerModal}
              style={styles.datePickerButton}
              icon="calendar"
            >
              {formatDateForDisplay(date)}
            </Button>
            
            <View style={styles.timePickers}>
              <View style={styles.timePickerItem}>
                <Text style={styles.inputLabel}>Call Time</Text>
                <Button
                  mode="outlined"
                  onPress={showCallTimePickerModal}
                  style={styles.timePickerButton}
                  icon="clock-outline"
                >
                  {formatTimeForDisplay(callTime)}
                </Button>
              </View>
              
              <View style={styles.timePickerItem}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <Button
                  mode="outlined"
                  onPress={showStartTimePickerModal}
                  style={styles.timePickerButton}
                  icon="clock-outline"
                >
                  {formatTimeForDisplay(startTime)}
                </Button>
              </View>
              
              <View style={styles.timePickerItem}>
                <Text style={styles.inputLabel}>End Time</Text>
                <Button
                  mode="outlined"
                  onPress={showEndTimePickerModal}
                  style={styles.timePickerButton}
                  icon="clock-outline"
                >
                  {formatTimeForDisplay(endTime)}
                </Button>
              </View>
            </View>
            
            <Text style={styles.inputLabel}>Venue</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={venue}
                onValueChange={(itemValue) => {
                  setVenue(itemValue);
                  if (itemValue === 'Location') {
                    setIsOutsideBroadcast(true);
                  }
                }}
              >
                <Picker.Item label="Studio 1" value="Studio 1" />
                <Picker.Item label="Studio 2" value="Studio 2" />
                <Picker.Item label="Studio 3" value="Studio 3" />
                <Picker.Item label="Studio 4" value="Studio 4" />
                <Picker.Item label="Location (OB)" value="Location" />
              </Picker>
            </View>
            
            {venue === 'Location' && (
              <TextInput
                label="Location Details"
                value={locationDetails}
                onChangeText={setLocationDetails}
                style={styles.input}
                mode="outlined"
                placeholder="Address or location details"
              />
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Crew Requirements</Text>
            
            <View style={styles.crewSection}>
              <Text style={styles.crewTypeTitle}>Camera Operators</Text>
              <View style={styles.countSelector}>
                <Button
                  mode="outlined"
                  onPress={() => setCameraCount(Math.max(0, cameraCount - 1))}
                  style={styles.countButton}
                  disabled={cameraCount === 0}
                >
                  -
                </Button>
                <Text style={styles.countValue}>{cameraCount}</Text>
                <Button
                  mode="outlined"
                  onPress={() => setCameraCount(cameraCount + 1)}
                  style={styles.countButton}
                >
                  +
                </Button>
              </View>
            </View>
            
            <View style={styles.crewSection}>
              <Text style={styles.crewTypeTitle}>Sound Operators</Text>
              <View style={styles.countSelector}>
                <Button
                  mode="outlined"
                  onPress={() => setSoundCount(Math.max(0, soundCount - 1))}
                  style={styles.countButton}
                  disabled={soundCount === 0}
                >
                  -
                </Button>
                <Text style={styles.countValue}>{soundCount}</Text>
                <Button
                  mode="outlined"
                  onPress={() => setSoundCount(soundCount + 1)}
                  style={styles.countButton}
                >
                  +
                </Button>
              </View>
            </View>
            
            <View style={styles.crewSection}>
              <Text style={styles.crewTypeTitle}>Lighting Operators</Text>
              <View style={styles.countSelector}>
                <Button
                  mode="outlined"
                  onPress={() => setLightingCount(Math.max(0, lightingCount - 1))}
                  style={styles.countButton}
                  disabled={lightingCount === 0}
                >
                  -
                </Button>
                <Text style={styles.countValue}>{lightingCount}</Text>
                <Button
                  mode="outlined"
                  onPress={() => setLightingCount(lightingCount + 1)}
                  style={styles.countButton}
                >
                  +
                </Button>
              </View>
            </View>
            
            <View style={styles.crewSection}>
              <Text style={styles.crewTypeTitle}>EVS Operators</Text>
              <View style={styles.countSelector}>
                <Button
                  mode="outlined"
                  onPress={() => setEvsCount(Math.max(0, evsCount - 1))}
                  style={styles.countButton}
                  disabled={evsCount === 0}
                >
                  -
                </Button>
                <Text style={styles.countValue}>{evsCount}</Text>
                <Button
                  mode="outlined"
                  onPress={() => setEvsCount(evsCount + 1)}
                  style={styles.countButton}
                >
                  +
                </Button>
              </View>
            </View>
            
            <View style={styles.checkboxRow}>
              <Checkbox
                status={needsDirector ? 'checked' : 'unchecked'}
                onPress={() => setNeedsDirector(!needsDirector)}
              />
              <Text style={styles.checkboxLabel}>Director</Text>
            </View>
            
            <View style={styles.checkboxRow}>
              <Checkbox
                status={needsStreamOperator ? 'checked' : 'unchecked'}
                onPress={() => setNeedsStreamOperator(!needsStreamOperator)}
              />
              <Text style={styles.checkboxLabel}>Stream Operator</Text>
            </View>
            
            <View style={styles.checkboxRow}>
              <Checkbox
                status={needsTechnician ? 'checked' : 'unchecked'}
                onPress={() => setNeedsTechnician(!needsTechnician)}
              />
              <Text style={styles.checkboxLabel}>Technician</Text>
            </View>
            
            <View style={styles.checkboxRow}>
              <Checkbox
                status={needsElectrician ? 'checked' : 'unchecked'}
                onPress={() => setNeedsElectrician(!needsElectrician)}
              />
              <Text style={styles.checkboxLabel}>Electrician</Text>
            </View>
            
            <View style={styles.checkboxRow}>
              <Checkbox
                status={needsTransport ? 'checked' : 'unchecked'}
                onPress={() => setNeedsTransport(!needsTransport)}
              />
              <Text style={styles.checkboxLabel}>Transport</Text>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            <TextInput
              label="Notes or Remarks"
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Any additional details, requirements, or information"
            />
          </View>
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            loading={loading}
            disabled={loading}
          >
            Submit Request
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Date & Time Pickers */}
      {(Platform.OS === 'ios' || showDatePicker) && (
        <DateTimePicker
          value={date}
          mode={dateTimePickerMode}
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateTimeChange}
          minimumDate={new Date()}
        />
      )}
      
      {(Platform.OS === 'ios' || showCallTimePicker) && (
        <DateTimePicker
          value={callTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateTimeChange}
        />
      )}
      
      {(Platform.OS === 'ios' || showStartTimePicker) && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateTimeChange}
        />
      )}
      
      {(Platform.OS === 'ios' || showEndTimePicker) && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateTimeChange}
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
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  datePickerButton: {
    marginBottom: 16,
  },
  timePickers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timePickerItem: {
    flex: 1,
    marginRight: 8,
  },
  timePickerButton: {
    justifyContent: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 8,
  },
  crewSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  crewTypeTitle: {
    fontSize: 16,
  },
  countSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countButton: {
    width: 40,
    marginHorizontal: 8,
  },
  countValue: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 32,
    paddingVertical: 8,
  },
});

// src/screens/producer/RequestDetailsScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, List, Avatar, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

export default function RequestDetailsScreen({ route, navigation }) {
  const { productionId } = route.params;
  const { currentUser } = useAuth();
  const theme = useTheme();
  
  const [production, setProduction] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch production details, requirements, and assignments
  useEffect(() => {
    const fetchProductionDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch production data
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

  // Format time
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return format(date, 'h:mm a');
  };

  // Format date
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

  // Handle report overtime
  const handleReportOvertime = () => {
    if (!production) return;
    
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
            
            {production.status === 'confirmed' && (
              <>
                <Divider style={styles.divider} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Assigned Crew</Text>
                  
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
              </>
            )}
          </Card.Content>
        </Card>
        
        {production.status === 'in_progress' && (
          <Button
            mode="contained"
            icon="clock-outline"
            onPress={handleReportOvertime}
            style={styles.overtimeButton}
          >
            Report Overtime
          </Button>
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
  overtimeButton: {
    marginTop: 8,
    backgroundColor: '#E53935',
  },
});