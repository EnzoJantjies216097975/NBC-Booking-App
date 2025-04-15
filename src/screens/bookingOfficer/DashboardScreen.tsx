import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, useTheme, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday, isAfter, isBefore, startOfDay, addDays } from 'date-fns';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BookingOfficerTabParamList, BookingOfficerStackParamList } from '../../navigation';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

type BookingOfficerDashboardScreenProps = CompositeScreenProps<
  BottomTabScreenProps<BookingOfficerTabParamList, 'Dashboard'>,
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
  [key: string]: any;
};

type FilterType = 'pending' | 'today' | 'upcoming' | 'all';

export default function BookingOfficerDashboardScreen({ navigation }: BookingOfficerDashboardScreenProps) {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('pending');
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
        const tomorrowStart = addDays(today, 1);
        q = query(
          productionsRef,
          where('date', '>=', Timestamp.fromDate(today)),
          where('date', '<', Timestamp.fromDate(tomorrowStart)),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
      } else if (filter === 'upcoming') {
        q = query(
          productionsRef,
          where('date', '>=', Timestamp.fromDate(today)),
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

  // Render production card
  const renderProductionCard = ({ item }: { item: Production }) => (
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
          onValueChange={(value) => setFilter(value as FilterType)}
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