import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, Title, Button, Chip, Divider, useTheme, IconButton, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProducerStackParamList } from '../../navigation';

type RequestDetailsScreenProps = NativeStackScreenProps<ProducerStackParamList, 'RequestDetails'>;

type Production = {
  id: string;
  name: string;
  date: Date;
  callTime: Date;
  startTime: Date;
  endTime: Date;
  venue: string;
  locationDetails?: string;
  notes?: string;
  status: string;
  requirements: Array<{
    type: string;
    count: number;
  }>;
  assignments?: Array<{
    id: string;
    userId: string;
    role: string;
    status: string;
    userDetails?: {
      name: string;
      [key: string]: any;
    };
  }>;
  [key: string]: any;
};

export default function RequestDetailsScreen({ route, navigation }: RequestDetailsScreenProps) {
  const { productionId } = route.params;
  const { currentUser } = useAuth();
  const theme = useTheme();
  
  const [production, setProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
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
        
        // Fetch assignments if production is confirmed
        if (['confirmed', 'in_progress', 'completed'].includes(productionData.status)) {
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
            const userDoc = await getDoc(doc(db, 'users', assignmentData.userId));
            
            if (userDoc.exists()) {
              assignmentData.userDetails = userDoc.data();
            }
            
            return assignmentData;
          }));
          
          productionData.assignments = assignmentsList;
        }
        
        setProduction(productionData);
      } catch (error) {
        console.error('Error fetching production details:', error);
        Alert.alert('Error', 'Failed to load production details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductionDetails();
  }, [productionId]);

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

  // Get type display name
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

  // Cancel production request
  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this production request?',
      [
        {
          text: 'No',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setDeleting(true);
              
              await updateDoc(doc(db, 'productions', productionId), {
                status: 'cancelled',
                updatedAt: serverTimestamp()
              });
              
              // Update local state
              if (production) {
                setProduction({
                  ...production,
                  status: 'cancelled'
                });
              }
              
              Alert.alert('Success', 'Production request cancelled successfully');
            } catch (error) {
              console.error('Error cancelling production:', error);
              Alert.alert('Error', 'Failed to cancel production request');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  // Delete production request
  const handleDeleteRequest = () => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this production request? This action cannot be undone.',
      [
        {
          text: 'No',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              setDeleting(true);
              
              await deleteDoc(doc(db, 'productions', productionId));
              
              Alert.alert(
                'Success', 
                'Production request deleted successfully',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting production:', error);
              Alert.alert('Error', 'Failed to delete production request');
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  // Send message
  const handleSendMessage = () => {
    if (!production) return;
    
    navigation.navigate('Message', {
      productionId: production.id,
      productionName: production.name
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

  const canCancel = production.status === 'requested';
  const canDelete = production.status === 'requested' || production.status === 'cancelled';
  const canReportOvertime = production.status === 'in_progress';

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
              
              {production.requirements.map((req) => (
                <View key={req.type} style={styles.requirementRow}>
                  <Ionicons name={getTypeIcon(req.type)} size={18} color="#555" />
                  <Text style={styles.requirementText}>
                    {getTypeName(req.type)}: {req.count}
                  </Text>
                </View>
              ))}
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
            
            {production.assignments && production.assignments.length > 0 && (
              <>
                <Divider style={styles.divider} />
                
                <List.Accordion
                  title="Assigned Crew"
                  expanded={expanded}
                  onPress={() => setExpanded(!expanded)}
                  style={styles.accordion}
                >
                  {production.assignments.map((assignment) => (
                    <View key={assignment.id} style={styles.assignmentRow}>
                      <Ionicons name={getTypeIcon(assignment.role)} size={18} color="#555" />
                      <Text style={styles.assignmentText}>
                        {getTypeName(assignment.role)}: {assignment.userDetails?.name || 'Unassigned'}
                      </Text>
                    </View>
                  ))}
                </List.Accordion>
              </>
            )}
          </Card.Content>
        </Card>
        
        <View style={styles.actionButtonsContainer}>
          <Button
            mode="outlined"
            icon="message-outline"
            onPress={handleSendMessage}
            style={styles.messageButton}
          >
            Send Message
          </Button>
          
          {canReportOvertime && (
            <Button
              mode="contained"
              icon="clock-outline"
              onPress={() => navigation.navigate('Message', { 
                productionId, 
                productionName: production.name, 
                messageType: 'overtime'
              })}
              style={styles.overtimeButton}
            >
              Report Overtime
            </Button>
          )}
          
          {canCancel && (
            <Button
              mode="outlined"
              icon="close-circle-outline"
              onPress={handleCancelRequest}
              style={styles.cancelButton}
              loading={deleting}
              disabled={deleting}
            >
              Cancel Request
            </Button>
          )}
          
          {canDelete && (
            <Button
              mode="contained"
              icon="delete-outline"
              onPress={handleDeleteRequest}
              style={styles.deleteButton}
              loading={deleting}
              disabled={deleting}
            >
              Delete Request
            </Button>
          )}
        </View>
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
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 16,
  },
  notesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  accordion: {
    padding: 0,
    backgroundColor: '#f5f5f5',
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginLeft: 16,
  },
  assignmentText: {
    marginLeft: 8,
    fontSize: 16,
  },
  actionButtonsContainer: {
    marginBottom: 24,
  },
  messageButton: {
    marginBottom: 12,
  },
  overtimeButton: {
    backgroundColor: '#E53935',
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 12,
    borderColor: '#f44336',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
});