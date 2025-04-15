import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, set } from 'date-fns';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProducerTabParamList, ProducerStackParamList } from '../../navigation';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

type CreateRequestScreenProps = CompositeScreenProps<
  BottomTabScreenProps<ProducerTabParamList, 'Create'>,
  NativeStackScreenProps<ProducerStackParamList>
>;

type DateTimePickerMode = 'date' | 'time';

export default function CreateRequestScreen({ navigation }: CreateRequestScreenProps) {
  const { currentUser, userDetails } = useAuth();
  const theme = useTheme();
  
  // Form state
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [callTime, setCallTime] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [venue, setVenue] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [requirements, setRequirements] = useState([
    { type: 'camera', count: 2 },
    { type: 'sound', count: 1 },
    { type: 'lighting', count: 1 }
  ]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCallTimePicker, setShowCallTimePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [activePicker, setActivePicker] = useState<'date' | 'callTime' | 'startTime' | 'endTime'>('date');
  
  // Validation state
  const [nameError, setNameError] = useState('');
  const [venueError, setVenueError] = useState('');
  
  // Date/time picker handlers
  const showPicker = (pickerType: 'date' | 'callTime' | 'startTime' | 'endTime') => {
    setActivePicker(pickerType);
    
    switch (pickerType) {
      case 'date':
        setShowDatePicker(true);
        break;
      case 'callTime':
        setShowCallTimePicker(true);
        break;
      case 'startTime':
        setShowStartTimePicker(true);
        break;
      case 'endTime':
        setShowEndTimePicker(true);
        break;
    }
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setShowCallTimePicker(false);
      setShowStartTimePicker(false);
      setShowEndTimePicker(false);
    }
    
    if (selectedDate) {
      switch (activePicker) {
        case 'date':
          // Keep time component the same when changing date
          setDate(selectedDate);
          break;
        case 'callTime':
          // Set only time component
          setCallTime(
            set(callTime, {
              hours: selectedDate.getHours(),
              minutes: selectedDate.getMinutes()
            })
          );
          break;
        case 'startTime':
          // Set only time component
          setStartTime(
            set(startTime, {
              hours: selectedDate.getHours(),
              minutes: selectedDate.getMinutes()
            })
          );
          break;
        case 'endTime':
          // Set only time component
          setEndTime(
            set(endTime, {
              hours: selectedDate.getHours(),
              minutes: selectedDate.getMinutes()
            })
          );
          break;
      }
    }
  };
  
  // Handle operator requirements
  const updateRequirementCount = (type: string, value: number) => {
    const updatedRequirements = requirements.map(req => {
      if (req.type === type) {
        return { ...req, count: value };
      }
      return req;
    });
    setRequirements(updatedRequirements);
  };
  
  // Validate form
  const validateForm = () => {
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      setNameError('Production name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    // Validate venue
    if (!venue.trim()) {
      setVenueError('Venue is required');
      isValid = false;
    } else {
      setVenueError('');
    }
    
    // Validate times
    if (endTime <= startTime) {
      Alert.alert('Error', 'End time must be after start time');
      isValid = false;
    }
    
    if (startTime < callTime) {
      Alert.alert('Error', 'Start time should be after call time');
      isValid = false;
    }
    
    return isValid;
  };
  
  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a production request');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare operator requirements - filter out zero counts
      const filteredRequirements = requirements.filter(req => req.count > 0);
      
      // Create production document
      const productionsRef = collection(db, 'productions');
      const productionData = {
        name,
        date: Timestamp.fromDate(
          set(date, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
        ),
        callTime: Timestamp.fromDate(
          set(date, {
            hours: callTime.getHours(),
            minutes: callTime.getMinutes(),
            seconds: 0,
            milliseconds: 0
          })
        ),
        startTime: Timestamp.fromDate(
          set(date, {
            hours: startTime.getHours(),
            minutes: startTime.getMinutes(),
            seconds: 0,
            milliseconds: 0
          })
        ),
        endTime: Timestamp.fromDate(
          set(date, {
            hours: endTime.getHours(),
            minutes: endTime.getMinutes(),
            seconds: 0,
            milliseconds: 0
          })
        ),
        venue,
        locationDetails,
        notes,
        requirements: filteredRequirements,
        status: 'requested',
        requestedBy: currentUser.uid,
        requesterName: userDetails?.name || 'Unknown Producer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(productionsRef, productionData);
      
      Alert.alert(
        'Success',
        'Production request has been submitted!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('RequestDetails', { productionId: docRef.id }) 
          }
        ]
      );
    } catch (error) {
      console.error('Error creating production request:', error);
      Alert.alert('Error', 'Failed to create production request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date/time for display
  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };
  
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };
  
  // Get requirement type display name
  const getTypeName = (type: string) => {
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
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Create Production Request</Text>
          
          <Text style={styles.sectionTitle}>Production Details</Text>
          
          <TextInput
            label="Production Name *"
            value={name}
            onChangeText={text => {
              setName(text);
              if (text.trim()) setNameError('');
            }}
            style={styles.input}
            mode="outlined"
            error={!!nameError}
          />
          {nameError ? <HelperText type="error">{nameError}</HelperText> : null}
          
          <View style={styles.dateInputContainer}>
            <Text style={styles.inputLabel}>Production Date *</Text>
            <Button 
              mode="outlined" 
              onPress={() => showPicker('date')}
              style={styles.dateButton}
            >
              {formatDate(date)}
            </Button>
          </View>
          
          <View style={styles.timeInputsContainer}>
            <View style={styles.timeInputWrapper}>
              <Text style={styles.inputLabel}>Call Time</Text>
              <Button 
                mode="outlined" 
                onPress={() => showPicker('callTime')}
                style={styles.timeButton}
              >
                {formatTime(callTime)}
              </Button>
            </View>
            
            <View style={styles.timeInputWrapper}>
              <Text style={styles.inputLabel}>Start Time</Text>
              <Button 
                mode="outlined" 
                onPress={() => showPicker('startTime')}
                style={styles.timeButton}
              >
                {formatTime(startTime)}
              </Button>
            </View>
            
            <View style={styles.timeInputWrapper}>
              <Text style={styles.inputLabel}>End Time</Text>
              <Button 
                mode="outlined" 
                onPress={() => showPicker('endTime')}
                style={styles.timeButton}
              >
                {formatTime(endTime)}
              </Button>
            </View>
          </View>
          
          <TextInput
            label="Venue *"
            value={venue}
            onChangeText={text => {
              setVenue(text);
              if (text.trim()) setVenueError('');
            }}
            style={styles.input}
            mode="outlined"
            error={!!venueError}
          />
          {venueError ? <HelperText type="error">{venueError}</HelperText> : null}
          
          <TextInput
            label="Location Details (optional)"
            value={locationDetails}
            onChangeText={setLocationDetails}
            style={styles.input}
            mode="outlined"
            placeholder="Studio number, specific room, etc."
          />
          
          <Text style={styles.sectionTitle}>Crew Requirements</Text>
          
          {requirements.map((req, index) => (
            <View key={req.type} style={styles.requirementRow}>
              <Text style={styles.requirementType}>
                {getTypeName(req.type)}
              </Text>
              
              <View style={styles.counterContainer}>
                <IconButton
                  icon="minus"
                  size={20}
                  onPress={() => {
                    if (req.count > 0) {
                      updateRequirementCount(req.type, req.count - 1);
                    }
                  }}
                />
                <Text style={styles.requirementCount}>{req.count}</Text>
                <IconButton
                  icon="plus"
                  size={20}
                  onPress={() => updateRequirementCount(req.type, req.count + 1)}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};