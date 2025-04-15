import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Chip, Divider, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { collection, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isSameDay, isToday, isTomorrow, addDays, startOfWeek, endOfWeek, eachDayOfInterval, subDays } from 'date-fns';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BookingOfficerTabParamList, BookingOfficerStackParamList } from '../../navigation';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

type BookingOfficerScheduleScreenProps = CompositeScreenProps<
  BottomTabScreenProps<BookingOfficerTabParamList, 'Schedule'>,
  NativeStackScreenProps<BookingOfficerStackParamList>
>;

type Production = {
  id: string;
  name: string;
  date: Date;
  callTime: Date;
  startTime: Date;
  endTime: Date;
  venue: string;
  locationDetails?: string;
  status: string;
  requesterName: string;
  [key: string]: any;
};

type ViewMode = 'day' | 'week' | 'month';

export default function BookingOfficerScheduleScreen({ navigation }: BookingOfficerScheduleScreenProps) {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const theme = useTheme();

  // Fetch productions from Firestore
  const fetchProductions = async () => {
    try {
      setLoading(true);
      
      const productionsRef = collection(db, 'productions');
      const q = query(
        productionsRef,
        orderBy('date', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const productionsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to JS Date objects
          date: data.date ? (data.date as Timestamp).toDate() : new Date(),
          callTime: data.callTime ? (data.callTime as Timestamp).toDate() : new Date(),
          startTime: data.startTime ? (data.startTime as Timestamp).toDate() : new Date(),
          endTime: data.endTime ? (data.endTime as Timestamp).toDate() : new Date(),
        } as Production;
      });
      
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
  const getStatusColor = (status: string) => {
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
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  // Format date function
  const formatDate = (date: Date) => {
    return format(date, 'EEE, MMM d, yyyy');
  };

  // Get status text
  const getStatusText = (status: string) => {
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

  // Handle view mode changes
  const toggleViewMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  // Change selected date
  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Get days for current view
  const getDaysForView = (): Date[] => {
    if (viewMode === 'day') {
      return [selectedDate];
    } else if (viewMode === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    } else {
      // For month view, simplified to just show current week for now
      // In a real app, this would show a full month calendar
      const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    }
  };

  // Get title for current view
  const getViewTitle = (): string => {
    if (viewMode === 'day') {
      return formatDate(selectedDate);
    } else if (viewMode === 'week') {
      const days = getDaysForView();
      return `${format(days[0], 'MMM d')} - ${format(days[days.length - 1], 'MMM d, yyyy')}`;
    } else {
      return format(selectedDate, 'MMMM yyyy');
    }
  };

  // Get productions for a specific day
  const getProductionsForDay = (day: Date): Production[] => {
    return productions.filter(production => isSameDay(production.date, day));
  };

  // Handle view production details
  const handleViewProduction = (productionId: string) => {
    navigation.navigate('ManageRequest', { productionId });
  };

  // Render production item
  const renderProductionItem = (production: Production) => (
    <Card 
      key={production.id}
      style={[
        styles.productionCard,
        production.status === 'requested' && styles.requestedProductionCard
      ]}
      onPress={() => handleViewProduction(production.id)}
    >
      <Card.Content>
        <View style={styles.cardHeader}>< /View>
          <Title style={styles.cardTitle}>{production.name}</Title>
          <Chip 
            mode="outlined" 
            style={{ backgroundColor: getStatusColor(production.status) }}
            textStyle={{ color: 'white' }}
          >
            {getStatusText(production.status)}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}></View>
        <Text style={styles.headerText}>Schedule</Text>
      <View style={styles.content}>
        <View style={styles.viewModeContainer}>
          <TouchableOpacity onPress={() => toggleViewMode('day')} style={styles.viewModeButton}>
            <Text style={styles.viewModeButtonText}>Day</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleViewMode('week')} style={styles.viewModeButton}>
            <Text style={styles.viewModeButtonText}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => toggleViewMode('month')} style={styles.viewModeButton}>
            <Text style={styles.viewModeButtonText}>Month</Text>
          </TouchableOpacity>
        </View>
        {renderScheduleContent()}
      </View>
    </View>
  );
};