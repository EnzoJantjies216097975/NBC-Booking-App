import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProducerTabParamList, ProducerStackParamList } from '../../navigation';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

type ProducerDashboardScreenProps = CompositeScreenProps<
  BottomTabScreenProps<ProducerTabParamList, 'Dashboard'>,
  NativeStackScreenProps<ProducerStackParamList>
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

export default function ProducerDashboardScreen({ navigation }: ProducerDashboardScreenProps) {
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { currentUser } = useAuth();
  const theme = useTheme();

  // Function to fetch productions from Firestore
  const fetchProductions = async () => {
    try {
      setLoading(true);
      
      if (!currentUser) return;
      
      const productionsRef = collection(db, 'productions');
      const q = query(
        productionsRef,
        where('requestedBy', '==', currentUser.uid),
        orderBy('date', 'desc')
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

  // Render production card
  const renderProductionCard = ({ item }: { item: Production }) => (
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