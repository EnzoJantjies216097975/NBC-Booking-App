import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, Title, Button, Chip, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OperatorStackParamList } from '../../navigation';

type AssignmentDetailsScreenProps = NativeStackScreenProps<OperatorStackParamList, 'AssignmentDetails'>;

type Assignment = {
  id: string;
  productionId: string;
  userId: string;
  role: string;
  status: string;
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
  notes?: string;
  [key: string]: any;
};

export default function AssignmentDetailsScreen({ route, navigation }: AssignmentDetailsScreenProps) {
  const { assignmentId } = route.params;
  const theme = useTheme();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [production, setProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Load assignment and production data
  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch assignment
        const assignmentDoc = await getDoc(doc(db, 'assignments', assignmentId));
        
        if (!assignmentDoc.exists()) {
          Alert.alert('Error', 'Assignment not found');
          navigation.goBack();
          return;
        }
        
        const assignmentData = {
          id: assignmentDoc.id,
          ...assignmentDoc.data()
        } as Assignment;
        
        setAssignment(assignmentData);
        
        // Fetch production details
        if (assignmentData.productionId) {
          const productionDoc = await getDoc(doc(db, 'productions', assignmentData.productionId));
          
          if (productionDoc.exists()) {
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
          }
        }
      } catch (error) {
        console.error('Error fetching assignment details:', error);
        Alert.alert('Error', 'Failed to load assignment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentDetails();
  }, [assignmentId]);

  // Format time
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  // Format date
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

  // Get assignment status text
  const getAssignmentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Confirmation';
      case 'accepted':
        return 'Accepted';
      case 'declined':
        return 'Declined';
      default:
        return status;
    }
  };

  // Get assignment status color
  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFC107'; // Amber
      case 'accepted':
        return '#4CAF50'; // Green
      case 'declined':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };

  // Get role display name
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

  // Accept assignment
  const handleAcceptAssignment = async () => {
    if (!assignment) return;
    
    try {
      setUpdating(true);
      
      await updateDoc(doc(db, 'assignments', assignment.id), {
        status: 'accepted',
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setAssignment({
        ...assignment,
        status: 'accepted'
      });
      
      Alert.alert('Success', 'Assignment accepted');
    } catch (error) {
      console.error('Error accepting assignment:', error);
      Alert.alert('Error', 'Failed to accept assignment');
    } finally {
      setUpdating(false);
    }
  };

  // Decline assignment
  const handleDeclineAssignment = async () => {
    if (!assignment) return;
    
    try {
      setUpdating(true);
      
      await updateDoc(doc(db, 'assignments', assignment.id), {
        status: 'declined',
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setAssignment({
        ...assignment,
        status: 'declined'
      });
      
      Alert.alert('Assignment Declined', 'The booking officer will be notified.');
    } catch (error) {
      console.error('Error declining assignment:', error);
      Alert.alert('Error', 'Failed to decline assignment');
    } finally {
      setUpdating(false);
    }
  };

  // Report overtime
  const handleReportOvertime = () => {
    if (!production) return;
    
    navigation.navigate('Message', {
      productionId: production.id,
      productionName: production.name,
      messageType: 'overtime'
    });
  };

  // View production details
  const handleViewProduction = () => {
    if (!production) return;
    
    navigation.navigate('ProductionDetails', {
      productionId: production.id
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!assignment || !production) {
    return (
      <View style={styles.errorContainer}>
        <Text>Assignment not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  const showActions = assignment.status === 'pending' && production.status !== 'cancelled';
  const canReportOvertime = production.status === 'in_progress' && assignment.status === 'accepted';

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
            
            <View style={styles.assignmentStatusContainer}>
              <Text style={styles.assignmentStatusLabel}>Assignment Status:</Text>
              <Chip 
                mode="outlined" 
                style={{ backgroundColor: getAssignmentStatusColor(assignment.status) }}
                textStyle={{ color: 'white' }}
              >
                {getAssignmentStatusText(assignment.status)}
              </Chip>
            </View>
            
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>Your Role:</Text>
              <Chip style={styles.roleChip}>{getRoleName(assignment.role)}</Chip>
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
          </Card.Content>
        </Card>
        
        {showActions && (
          <View style={styles.actionButtonsContainer}>
            <Button 
              mode="contained"
              icon="check"
              onPress={handleAcceptAssignment}
              style={[styles.actionButton, styles.acceptButton]}
              loading={updating}
              disabled={updating}
            >
              Accept Assignment
            </Button>
            
            <Button 
              mode="outlined"
              icon="close"
              onPress={handleDeclineAssignment}
              style={styles.actionButton}
              loading={updating}
              disabled={updating}
            >
              Decline
            </Button>
          </View>
        )}
        
        <Button
          mode="contained"
          icon="eye"
          onPress={handleViewProduction}
          style={styles.viewButton}
        >
          View Production Details
        </Button>
        
        {canReportOvertime && (
          <Button
            mode="contained"
            icon="clock-outline"
            onPress={handleReportOvertime}
            style={styles.overtimeButton}
          >
            Report Overtime
          </Button>
        )}
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
  assignmentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignmentStatusLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  roleChip: {
    backgroundColor: '#e0e0e0',
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 0.48,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  viewButton: {
    marginBottom: 16,
  },
  overtimeButton: {
    backgroundColor: '#E53935',
    marginBottom: 24,
  },
});