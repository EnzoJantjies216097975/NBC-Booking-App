import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, Title, Button, Chip, Divider, useTheme, List, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BookingOfficerStackParamList } from '../../navigation';

type ManageRequestScreenProps = NativeStackScreenProps<BookingOfficerStackParamList, 'ManageRequest'>;

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
  requestedBy: string;
  requesterName: string;
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

export default function ManageRequestScreen({ route, navigation }: ManageRequestScreenProps) {
  const { productionId } = route.params;
  const { currentUser } = useAuth();
  const theme = useTheme();
  
  const [production, setProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [assignmentsExpanded, setAssignmentsExpanded] = useState(true);
  const [requirementsExpanded, setRequirementsExpanded] = useState(true);
  
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
        
        // Set notes input from existing notes
        if (productionData.notes) {
          setNotesInput(productionData.notes);
        }
        
        // Fetch assignments if they exist
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
  }, [productionId, navigation]);

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

  // Approve production
  const handleApproveProduction = async () => {
    if (!production) return;
    
    if (!production.assignments || production.assignments.length === 0) {
      navigation.navigate('AssignOperators', { 
        productionId: production.id,
        requirements: production.requirements
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      await updateDoc(doc(db, 'productions', productionId), {
        status: 'confirmed',
        confirmedBy: currentUser?.uid,
        confirmedAt: serverTimestamp(),
        notes: notesInput,
        updatedAt: serverTimestamp()
      });
      
      // Create notification for the producer
      await addDoc(collection(db, 'notifications'), {
        userId: production.requestedBy,
        type: 'confirmation',
        title: 'Production Confirmed',
        body: `Your production "${production.name}" scheduled for ${formatDate(production.date)} has been confirmed`,
        productionId,
        read: false,
        createdAt: serverTimestamp()
      });
      
      // Create notifications for all assigned operators
      if (production.assignments && production.assignments.length > 0) {
        const notificationPromises = production.assignments.map(assignment => 
          addDoc(collection(db, 'notifications'), {
            userId: assignment.userId,
            type: 'assignment',
            title: 'New Assignment',
            body: `You have been assigned as ${getTypeName(assignment.role)} for "${production.name}" on ${formatDate(production.date)}`,
            productionId,
            assignmentId: assignment.id,
            read: false,
            createdAt: serverTimestamp()
          })
        );
        
        await Promise.all(notificationPromises);
      }
      
      Alert.alert(
        'Success',
        'Production has been confirmed',
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh production data
              navigation.replace('ManageRequest', { productionId });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error confirming production:', error);
      Alert.alert('Error', 'Failed to confirm production');
    } finally {
      setSubmitting(false);
    }
  };

  // Mark production as in progress
  const handleMarkInProgress = async () => {
    if (!production) return;
    
    try {
      setSubmitting(true);
      
      await updateDoc(doc(db, 'productions', productionId), {
        status: 'in_progress',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Create notification for the producer
      await addDoc(collection(db, 'notifications'), {
        userId: production.requestedBy,
        type: 'update',
        title: 'Production Started',
        body: `Your production "${production.name}" is now in progress`,
        productionId,
        read: false,
        createdAt: serverTimestamp()
      });
      
      Alert.alert(
        'Success',
        'Production has been marked as in progress',
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh production data
              navigation.replace('ManageRequest', { productionId });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error updating production status:', error);
      Alert.alert('Error', 'Failed to update production status');
    } finally {
      setSubmitting(false);
    }
  };

  // Mark production as completed
  const handleMarkCompleted = async () => {
    if (!production) return;
    
    try {
      setSubmitting(true);
      
      await updateDoc(doc(db, 'productions', productionId), {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Create notification for the producer
      await addDoc(collection(db, 'notifications'), {
        userId: production.requestedBy,
        type: 'completion',
        title: 'Production Completed',
        body: `Your production "${production.name}" has been marked as completed`,
        productionId,
        read: false,
        createdAt: serverTimestamp()
      });
      
      Alert.alert(
        'Success',
        'Production has been marked as completed',
        [
          {
            text: 'OK',
            onPress: () => {
              // Refresh production data
              navigation.replace('ManageRequest', { productionId });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error updating production status:', error);
      Alert.alert('Error', 'Failed to update production status');
    } finally {
      setSubmitting(false);
    }
  };

  // Reject production
  const handleRejectProduction = async () => {
    if (!production) return;
    
    Alert.alert(
      'Reject Production',
      'Are you sure you want to reject this production request?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              
              await updateDoc(doc(db, 'productions', productionId), {
                status: 'cancelled',
                cancelledBy: currentUser?.uid,
                cancelledAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              
              // Create notification for the producer
              await addDoc(collection(db, 'notifications'), {
                userId: production.requestedBy,
                type: 'cancellation',
                title: 'Production Rejected',
                body: `Your production request "${production.name}" scheduled for ${formatDate(production.date)} has been rejected`,
                productionId,
                read: false,
                createdAt: serverTimestamp()
              });
              
              Alert.alert(
                'Success',
                'Production has been rejected',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Refresh production data
                      navigation.replace('ManageRequest', { productionId });
                    }
                  }
                ]
              );
            } catch (error) {
              console.error('Error rejecting production:', error);
              Alert.alert('Error', 'Failed to reject production');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!production) return;
    
    try {
      setSubmitting(true);
      
      await updateDoc(doc(db, 'productions', productionId), {
        notes: notesInput,
        updatedAt: serverTimestamp()
      });
      
      Alert.alert('Success', 'Notes saved successfully');
      setNotesExpanded(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes');
    } finally {
      setSubmitting(false);
    }
  };

  // Assign crew
  const handleAssignCrew = () => {
    if (!production) return;
    
    navigation.navigate('AssignOperators', { 
      productionId: production.id,
      requirements: production.requirements,
      existingAssignments: production.assignments
    });
  };

  // Print schedule
  const handlePrintSchedule = () => {
    if (!production) return;
    
    navigation.navigate('PrintSchedule', { productionId: production.id });
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
            
            <List.Accordion
              title="Crew Requirements"
              expanded={requirementsExpanded}
              onPress={() => setRequirementsExpanded(!requirementsExpanded)}
              style={styles.accordion}
            >
              {production.requirements.map(req => (
                <View key={req.type} style={styles.requirementRow}>
                  <Ionicons name={getTypeIcon(req.type)} size={18} color="#555" />
                  <Text style={styles.requirementText}>
                    {getTypeName(req.type)}: {req.count}
                  </Text>
                </View>
              ))}
            </List.Accordion>
            
            {production.assignments && production.assignments.length > 0 && (
              <>
                <Divider style={styles.divider} />
                
                <List.Accordion
                  title="Assigned Crew"
                  expanded={assignmentsExpanded}
                  onPress={() => setAssignmentsExpanded(!assignmentsExpanded)}
                  style={styles.accordion}
                >
                  {production.assignments.map(assignment => (
                    <View key={assignment.id} style={styles.assignmentRow}>
                      <Ionicons name={getTypeIcon(assignment.role)} size={18} color="#555" />
                      <Text style={styles.assignmentText}>
                        {getTypeName(assignment.role)}: {assignment.userDetails?.name || 'Unknown'}
                      </Text>
                      <Chip 
                        style={[
                          styles.statusChip,
                          assignment.status === 'accepted' ? styles.acceptedChip : 
                          assignment.status === 'declined' ? styles.declinedChip : 
                          styles.pendingChip
                        ]}
                      >
                        {assignment.status}
                      </Chip>
                    </View>
                  ))}
                </List.Accordion>
              </>
            )}
            
            <Divider style={styles.divider} />
            
            <List.Accordion
              title={production.notes ? "Notes" : "Add Notes"}
              expanded={notesExpanded}
              onPress={() => setNotesExpanded(!notesExpanded)}
              style={styles.accordion}
            >
              <TextInput
                value={notesInput}
                onChangeText={setNotesInput}
                mode="outlined"
                multiline
                numberOfLines={5}
                style={styles.notesInput}
                placeholder="Add production notes here..."
              />
              
              <Button
                mode="contained"
                onPress={handleSaveNotes}
                style={styles.saveNotesButton}
                loading={submitting}
                disabled={submitting}
              >
                Save Notes
              </Button>
            </List.Accordion>
          </Card.Content>
        </Card>
        
        <View style={styles.actionsContainer}>
          {production.status === 'requested' && (
            <>
              <Button
                mode="contained"
                icon="check"
                onPress={handleApproveProduction}
                style={[styles.actionButton, styles.approveButton]}
                loading={submitting}
                disabled={submitting}
              >
                Approve Production
              </Button>
              
              <Button
                mode="outlined"
                icon="close"
                onPress={handleRejectProduction}
                style={[styles.actionButton, styles.rejectButton]}
                loading={submitting}
                disabled={submitting}
              >
                Reject Production
              </Button>
            </>
          )}
          
          {production.status === 'confirmed' && (
            <Button
              mode="contained"
              icon="play"
              onPress={handleMarkInProgress}
              style={[styles.actionButton, styles.startButton]}
              loading={submitting}
              disabled={submitting}
            >
              Mark as In Progress
            </Button>
          )}
          
          {production.status === 'in_progress' && (
            <Button
              mode="contained"
              icon="check-circle"
              onPress={handleMarkCompleted}
              style={[styles.actionButton, styles.completeButton]}
              loading={submitting}
              disabled={submitting}
            >
              Mark as Completed
            </Button>
          )}
          
          {['confirmed', 'in_progress'].includes(production.status) && (
            <>
              <Button
                mode="outlined"
                icon="account-multiple"
                onPress={handleAssignCrew}
                style={styles.actionButton}
              >
                Manage Crew
              </Button>
              
              <Button
                mode="outlined"
                icon="printer"
                onPress={handlePrintSchedule}
                style={styles.actionButton}
              >
                Print Schedule
              </Button>
            </>
          )}
          
          <Button
            mode="outlined"
            icon="message"
            onPress={handleSendMessage}
            style={styles.actionButton}
          >
            Send Message
          </Button>
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
    paddingBottom: 32,
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
  accordion: {
    padding: 0,
    backgroundColor: '#f5f5f5',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginLeft: 16,
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 16,
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
    flex: 1,
  },
  statusChip: {
    marginLeft: 8,
  },
  acceptedChip: {
    backgroundColor: '#4CAF50',
  },
  declinedChip: {
    backgroundColor: '#F44336',
  },
  pendingChip: {
    backgroundColor: '#FFC107',
  },
  notesInput: {
    marginBottom: 16,
    height: 120,
  },
  saveNotesButton: {
    marginBottom: 8,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    marginBottom: 12,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    borderColor: '#F44336',
  },
  startButton: {
    backgroundColor: '#2196F3',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
});