import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Chip, Divider, useTheme, ActivityIndicator, IconButton, Title } from 'react-native-paper';
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
        <View style={styles.cardHeader}>
          <Title style={styles.cardTitle}>{production.name}</Title>
          <Chip 
            mode="outlined" 
            style={{ backgroundColor: getStatusColor(production.status) }}
            textStyle={{ color: 'white' }}
          >
            {getStatusText(production.status)}
          </Chip>
        </View>
        
        <View style={styles.cardTimeInfo}>
          <Text style={styles.timeText}>{formatTime(production.startTime)} - {formatTime(production.endTime)}</Text>
          <Text style={styles.venueText}>{production.venue}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  // Render day column
  const renderDayColumn = (day: Date) => {
    const dayProductions = getProductionsForDay(day);
    const isSelectedDay = isSameDay(day, selectedDate);
    const isDayToday = isToday(day);
    
    return (
      <View 
        key={day.toISOString()} 
        style={[
          styles.dayColumn, 
          isSelectedDay && styles.selectedDayColumn,
          viewMode === 'day' && styles.singleDayColumn
        ]}
      >
        <TouchableOpacity
          style={[
            styles.dayHeader,
            isDayToday && styles.todayHeader,
            isSelectedDay && styles.selectedDayHeader
          ]}
          onPress={() => {
            setSelectedDate(day);
            setViewMode('day');
          }}
        >
          <Text style={[
            styles.dayName, 
            isDayToday && styles.todayText,
            isSelectedDay && styles.selectedDayText
          ]}>
            {format(day, 'EEE')}
          </Text>
          <Text style={[
            styles.dayNumber, 
            isDayToday && styles.todayText,
            isSelectedDay && styles.selectedDayText
          ]}>
            {format(day, 'd')}
          </Text>
        </TouchableOpacity>
        
        <ScrollView style={styles.dayContent}>
          {dayProductions.length > 0 ? (
            dayProductions.map(production => renderProductionItem(production))
          ) : (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayText}>No productions</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Render schedule content
  const renderScheduleContent = () => {
    const days = getDaysForView();
    
    if (viewMode === 'day') {
      return renderDayColumn(selectedDate);
    } else {
      return (
        <ScrollView 
          horizontal 
          pagingEnabled={viewMode === 'week'} 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.weekContainer}
        >
          {days.map(day => renderDayColumn(day))}
        </ScrollView>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.controlsContainer}>
        <Button onPress={() => changeDate(-7)}>
          <Ionicons name="chevron-back" size={20} />
        </Button>
        
        <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
          <Text style={styles.viewTitle}>{getViewTitle()}</Text>
        </TouchableOpacity>
        
        <Button onPress={() => changeDate(7)}>
          <Ionicons name="chevron-forward" size={20} />
        </Button>
      </View>
      
      <View style={styles.viewModeContainer}>
        <Button 
          mode={viewMode === 'day' ? 'contained' : 'outlined'} 
          onPress={() => toggleViewMode('day')}
          style={styles.viewModeButton}
        >
          Day
        </Button>
        <Button 
          mode={viewMode === 'week' ? 'contained' : 'outlined'} 
          onPress={() => toggleViewMode('week')}
          style={styles.viewModeButton}
        >
          Week
        </Button>
        <Button 
          mode={viewMode === 'month' ? 'contained' : 'outlined'} 
          onPress={() => toggleViewMode('month')}
          style={styles.viewModeButton}
        >
          Month
        </Button>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <View style={styles.scheduleContainer}>
          {renderScheduleContent()}
        </View>
      )}
      
      <Button 
        mode="contained" 
        icon="printer"
        onPress={() => navigation.navigate('Print')}
        style={styles.printButton}
      >
        Print Schedule
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  viewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewModeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  viewModeButton: {
    marginHorizontal: 5,
  },
  scheduleContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekContainer: {
    flexDirection: 'row',
  },
  dayColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    minWidth: 150,
  },
  singleDayColumn: {
    flex: 1,
    width: '100%',
  },
  selectedDayColumn: {
    backgroundColor: '#f5f9ff',
  },
  dayHeader: {
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  todayHeader: {
    backgroundColor: '#e3f2fd',
  },
  selectedDayHeader: {
    backgroundColor: '#2196F3',
  },
  dayName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  todayText: {
    color: '#1976D2',
  },
  selectedDayText: {
    color: '#fff',
  },
  dayContent: {
    padding: 8,
    flexGrow: 1,
  },
  productionCard: {
    marginBottom: 8,
  },
  requestedProductionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  cardTimeInfo: {
    marginTop: 4,
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  venueText: {
    fontSize: 14,
    color: '#666',
  },
  emptyDay: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginVertical: 10,
  },
  emptyDayText: {
    color: '#999',
    fontStyle: 'italic',
  },
  printButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 30,
  },
});