// src/screens/operator/DashboardScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isTomorrow } from 'date-fns';

export default function OperatorDashboardScreen({ navigation }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Fetch assignments and related production data
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      
      // Get all assignments for the current user
      const assignmentsRef = collection(db, 'assignments');
      const q = query(
        assignmentsRef,
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const assignmentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch production details for each assignment
      const assignmentsWithProductions = await Promise.all(
        assignmentsList.map(async (assignment) => {
          try {
            const productionDoc = await getDocs(collection(db, 'productions'), assignment.productionId);
            
            if (productionDoc.exists()) {
              const productionData = {
                ...productionDoc.data(),
                id: productionDoc.id,
                // Convert Firestore timestamps to JS Date objects
                date: productionDoc.data().date ? productionDoc.data().date.toDate() : null,
                callTime: productionDoc.data().callTime ? productionDoc.data().callTime.toDate() : null,
                startTime: productionDoc.data().startTime ? productionDoc.data().startTime.toDate() : null,
                endTime: productionDoc.data().endTime ? productionDoc.data().endTime.toDate() : null,
              };
              
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
          if (!a.production.date) return 1;
          if (!b.production.date) return -1;
          return a.production.date - b.production.date;
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

  // Convert role to display name
  const getRoleName = (role) => {
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

  // Render assignment card
  const renderAssignmentCard = ({ item }) => {
    const production = item.production;
    const isUpcoming = production.date && (isToday(production.date) || isTomorrow(production.date));
    
    return (
      <Card 
        style={[styles.card, isUpcoming && styles.upcomingCard]}
        onPress={() => navigation.navigate('AssignmentDetails', { assignmentId: item.id })}
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
          
          <View style={styles.roleContainer}>
            <Chip style={styles.roleChip}>{getRoleName(item.role)}</Chip>
          </View>
          
          <Paragraph style={styles.dateText}>
            <Ionicons name="calendar-outline" size={16} /> {formatDate(production.date)}
          </Paragraph>
          
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
          
          <Divider style={styles.divider} />
          
          <View style={styles.venueContainer}>
            <Ionicons name="location-outline" size={16} />
            <Text style={styles.venueText}>
              {production.venue}
              {production.locationDetails ? ` - ${production.locationDetails}` : ''}
            </Text>
          </View>
        </Card.Content>
        
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="text"
            onPress={() => navigation.navigate('AssignmentDetails', { assignmentId: item.id })}
          >
            View Details
          </Button>
          
          {production.status === 'in_progress' && (
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Message', { 
                productionId: production.id,
                productionName: production.name,
                messageType: 'overtime'
              })}
              style={styles.reportButton}
            >
              Report Overtime
            </Button>
          )}
        </Card.Actions>
      </Card>
    );
  };

  // Get upcoming assignments (today and tomorrow)
  const upcomingAssignments = assignments.filter(a => 
    a.production.date && 
    (isToday(a.production.date) || isTomorrow(a.production.date)) &&
    ['confirmed', 'in_progress'].includes(a.production.status)
  );

  // Get future assignments (not today or tomorrow)
  const futureAssignments = assignments.filter(a => 
    a.production.date && 
    !isToday(a.production.date) && 
    !isTomorrow(a.production.date) &&
    new Date() < a.production.date &&
    ['confirmed', 'requested'].includes(a.production.status)
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : assignments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No assignments yet</Text>
          <Text style={styles.emptySubtext}>
            You will see your assignments here once you are booked for a production
          </Text>
        </View>
      ) : (
        <FlatList
          data={[
            { type: 'header', title: 'Upcoming Assignments', data: upcomingAssignments },
            { type: 'header', title: 'Future Assignments', data: futureAssignments }
          ]}
          keyExtractor={(item, index) => `section-${index}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              if (item.data.length === 0) return null;
              
              return (
                <View>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{item.title}</Text>
                  </View>
                  
                  {item.data.map(assignment => (
                    <View key={assignment.id} style={styles.assignmentContainer}>
                      {renderAssignmentCard({ item: assignment })}
                    </View>
                  ))}
                </View>
              );
            }
            return null;
          }}
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
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    backgroundColor: '#fff',
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2c3e50',
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  assignmentContainer: {
    marginBottom: 16,
  },
  card: {
    elevation: 4,
  },
  upcomingCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleContainer: {
    marginBottom: 8,
  },
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
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
  reportButton: {
    backgroundColor: '#E53935',
  },
});

// src/screens/operator/ScheduleScreen.js

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Title, Chip, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
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

export default function OperatorScheduleScreen({ navigation }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Start on Monday
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Get dates for the week
  const weekDates = eachDayOfInterval({
    start: currentWeekStart,
    end: addDays(currentWeekStart, 6)
  });

  // Fetch assignments and related production data
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        
        // Get all assignments for the current user
        const assignmentsRef = collection(db, 'assignments');
        const q = query(
          assignmentsRef,
          where('userId', '==', currentUser.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const assignmentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Fetch production details for each assignment
        const assignmentsWithProductions = await Promise.all(
          assignmentsList.map(async (assignment) => {
            try {
              const productionDoc = await getDocs(collection(db, 'productions'), assignment.productionId);
              
              if (productionDoc.exists()) {
                const productionData = {
                  ...productionDoc.data(),
                  id: productionDoc.id,
                  // Convert Firestore timestamps to JS Date objects
                  date: productionDoc.data().date ? productionDoc.data().date.toDate() : null,
                  callTime: productionDoc.data().callTime ? productionDoc.data().callTime.toDate() : null,
                  startTime: productionDoc.data().startTime ? productionDoc.data().startTime.toDate() : null,
                  endTime: productionDoc.data().endTime ? productionDoc.data().endTime.toDate() : null,
                };