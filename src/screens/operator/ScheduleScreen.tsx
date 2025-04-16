import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Button, Chip, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isSameDay, isToday, isTomorrow, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OperatorTabParamList, OperatorStackParamList } from '../../navigation';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

type OperatorScheduleScreenProps = CompositeScreenProps<
  BottomTabScreenProps<OperatorTabParamList, 'Schedule'>,
  NativeStackScreenProps<OperatorStackParamList>
>;

type Assignment = {
  id: string;
  productionId: string;
  userId: string;
  role: string;
  status: string;
  production?: Production;
  [key: string]: any;
};

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
  [key: string]: any;
};

type ViewMode = 'day' | 'week' | 'month';

export default function OperatorScheduleScreen({ navigation }: OperatorScheduleScreenProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Fetch assignments and related production data
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      if (!currentUser) return;
      
      // Get all assignments for the current user
      const assignmentsRef = collection(db, 'assignments');
      const q = query(
        assignmentsRef,
        where('userId', '==', currentUser.uid),
        where('status', '==', 'accepted') // Only show accepted assignments
      );
      
      const querySnapshot = await getDocs(q);
      const assignmentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assignment[];
      
      // Fetch production details for each assignment
      const assignmentsWithProductions = await Promise.all(
        assignmentsList.map(async (assignment) => {
          try {
            const productionDoc = await getDoc(doc(db, 'productions', assignment.productionId));
            
            if (productionDoc.exists()) {
              const data = productionDoc.data();
              const productionData = {
                id: productionDoc.id,
                ...data,
                // Convert Firestore timestamps to JS Date objects
                date: data.date ? (data.date as Timestamp).toDate() : new Date(),
                callTime: data.callTime ? (data.callTime as Timestamp).toDate() : new Date(),
                startTime: data.startTime ? (data.startTime as Timestamp).toDate() : new Date(),
                endTime: data.endTime ? (data.endTime as Timestamp).toDate() : new Date(),
              } as Production;
              
              return {
                ...assignment,
                production: productionData
              };
            }
            return assignment;
          } catch (error) {
            console.error('Error fetching production:', error);
            return assignment;
          }
        })
      );
      
      // Filter out assignments without productions and sort by date
      const validAssignments = assignmentsWithProductions
        .filter(a => a.production)
        .sort((a, b) => {
          if (!a.production?.date) return 1;
          if (!b.production?.date) return -1;
          return a.production.date.getTime() - b.production.date.getTime();
        });
      
      setAssignments(validAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAssignments();
  }, []);

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
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

  // Convert role to display name
  const getRoleName = (role: string) => {
    switch (role) {
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
        return role;
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

  // Get assignments for a specific day
  const getAssignmentsForDay = (day: Date): Assignment[] => {
    return assignments.filter(assignment => 
      assignment.production && isSameDay(assignment.production.date, day));
  };

  // Render assignment item
  const renderAssignmentItem = (assignment: Assignment) => {
    const production = assignment.production!;
    const isUpcoming = production.date && (isToday(production.date) || isTomorrow(production.date));
    
    return (
      <Card 
        key={assignment.id}
        style={[
          styles.assignmentCard,
          isUpcoming && styles.upcomingCard,
          production.status === 'in_progress' && styles.inProgressCard
        ]}
        onPress={() => navigation.navigate('AssignmentDetails', { assignmentId: assignment.id })}
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
          
          <View style={styles.roleContainer}>
            <Chip style={styles.roleChip}>{getRoleName(assignment.role)}</Chip>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.timeContainer}>
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Call Time:</Text>
              <Text style={styles.timeValue}>{formatTime(production.callTime)}</Text>
            </View>
            
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>Start:</Text>
              <Text style={styles.timeValue}>{formatTime(production.startTime)}</Text>
            </View>
            
            <View style={styles.timeInfo}>
              <Text style={styles.timeLabel}>End:</Text>
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
    );
  };

  // Render day column
  const renderDayColumn = (day: Date) => {
    const dayAssignments = getAssignmentsForDay(day);
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
          {dayAssignments.length > 0 ? (
            dayAssignments.map(assignment => renderAssignmentItem(assignment))
          ) : (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayText}>No assignments</Text>
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
      ) : assignments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No assignments</Text>
          <Text style={styles.emptySubtext}>
            You will see your assignments here once you have accepted them
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          {renderScheduleContent()}
        </ScrollView>
      )}
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
  scrollContainer: {
    flexGrow: 1,
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
  },
  assignmentCard: {
    marginBottom: 8,
  },
  upcomingCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  inProgressCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#2196F3',
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
  roleContainer: {
    marginBottom: 8,
  },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
  },
  divider: {
    marginVertical: 5,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  timeInfo: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 10,
    color: '#666',
  },
  timeValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  venueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  venueText: {
    fontSize: 12,
    marginLeft: 4,
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
});