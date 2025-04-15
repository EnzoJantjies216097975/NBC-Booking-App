import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, Title, Paragraph, Button, Chip, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProducerStackParamList, BookingOfficerStackParamList, OperatorStackParamList } from '../../navigation';

type ProductionDetailsScreenProps = NativeStackScreenProps<
  ProducerStackParamList & BookingOfficerStackParamList & OperatorStackParamList,
  'ProductionDetails'
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
  notes?: string;
  [key: string]: any;
};

type Assignment = {
  id: string;
  userId: string;
  productionId: string;
  role: string;
  status: string;
  userDetails?: {
    name: string;
    [key: string]: any;
  };
  [key: string]: any;
};

export default function ProductionDetailsScreen({ route, navigation }: ProductionDetailsScreenProps) {
  const { productionId } = route.params;
  const { currentUser, userDetails } = useAuth();
  const theme = useTheme();
  
  const [production, setProduction] = useState<Production | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [myAssignment, setMyAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch production details and assignments
  useEffect(() => {
    const fetchProductionDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch production details
        const productionDoc = await getDoc(doc(db, 'productions', productionId));
        
        if (!productionDoc.exists()) {
          Alert.alert('Error', 'Production not found');
          navigation.goBack();
          return;
        }
        
        const data = productionDoc.data();
        const productionData = {
          id: productionDoc.id,
          ...data,
          date: data.date ? (data.date as Timestamp).toDate() : new Date(),
          callTime: data.callTime ? (data.callTime as Timestamp).toDate() : new Date(),
          startTime: data.startTime ? (data.startTime as Timestamp).toDate() : new Date(),
          endTime: data.endTime ? (data.endTime as Timestamp).toDate() : new Date(),
        } as Production;
        
        setProduction(productionData);
        
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
          } as Assignment;
          
          // Fetch user details for each assignment
          const userDoc = await getDoc(doc(db, 'users', assignmentData.userId));
          
          if (userDoc.exists()) {
            assignmentData.userDetails = userDoc.data() as { name: string; [key: string]: any };
          }
          
          // Check if this is the current user's assignment
          if (currentUser && assignmentData.userId === currentUser.uid) {
            setMyAssignment(assignmentData);
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
  }, [productionId, currentUser]);

  // Format time function
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  // Format date function
  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
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

  // Convert type to display name
  const getTypeName = (type: string) => {
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
  const getTypeIcon = (type: string) => {
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

  // Handle view assignment
  const handleViewAssignment = () => {
    if (myAssignment) {
      navigation.navigate('AssignmentDetails', { assignmentId: myAssignment.id });
    }
  };

  // Handle send message
  const handleSendMessage = () => {
    if (production) {
      navigation.navigate('Message', { 
        productionId: production.id,
        productionName: production.name
      });
    }
  };

  // Handle report overtime
  const handleReportOvertime = () => {
    if (production) {
      navigation.navigate('Message', { 
        productionId: production.id,
        productionName: production.name,
        messageType: 'overtime'
      });
    }
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
            
            {production.notes && (
              <>
                <Divider style={styles.divider} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  <Text style={styles.notesText}>{production.notes}</Text>
                </View>
              </>
            )}
            
            {userDetails && userDetails.role !== 'producer' && (
              <>
                <Divider style={styles.divider} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Assigned Crew</Text>
                  
                  {assignments.length === 0 ? (
                    <Text style={styles.emptyText}>No crew assigned yet</Text>
                  ) : (
                    <View>
                      {assignments.map(assignment => (
                        <View key={assignment.id} style={styles.assignmentRow}>
                          <Ionicons name={getTypeIcon(assignment.role)} size={18} color="#555" />
                          <Text style={styles.assignmentText}>
                            {getTypeName(assignment.role)}: {assignment.userDetails?.name || 'Unknown'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
            
            {myAssignment && (
              <>
                <Divider style={styles.divider} />
                
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Your Assignment</Text>
                  
                  <View style={styles.myAssignmentContainer}>
                    <Chip style={styles.myRoleChip}>{getTypeName(myAssignment.role)}</Chip>
                    <Text style={styles.assignmentStatusText}>
                      Status: {
                        myAssignment.status === 'accepted' ? 'Accepted' : 
                        myAssignment.status === 'declined' ? 'Declined' : 
                        'Pending'
                      }
                    </Text>
                    
                    <Button
                      mode="contained"
                      onPress={handleViewAssignment}
                      style={styles.viewAssignmentButton}
                    >
                      View Assignment Details
                    </Button>
                  </View>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
        
        {userDetails && userDetails.role === 'operator' && production.status === 'in_progress' && (
          <Button
            mode="contained"
            icon="clock-outline"
            onPress={handleReportOvertime}
            style={styles.overtimeButton}
          >
            Report Overtime
          </Button>
        )}
        
        <Button
          mode="outlined"
          icon="message-outline"
          onPress={handleSendMessage}
          style={styles.messageButton}
        >
          Send Message
        </Button>
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
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentText: {
    marginLeft: 8,
    fontSize: 16,
  },
  myAssignmentContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
  },
  myRoleChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    backgroundColor: '#e0e0e0',
  },
  assignmentStatusText: {
    fontSize: 16,
    marginBottom: 12,
  },
  viewAssignmentButton: {
    marginTop: 8,
  },
  overtimeButton: {
    backgroundColor: '#E53935',
    marginBottom: 12,
  },
  messageButton: {
    marginBottom: 24,
  },
});