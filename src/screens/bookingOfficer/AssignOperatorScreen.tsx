import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Text, Card, Title, Button, Divider, useTheme, List, Chip, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BookingOfficerStackParamList } from '../../navigation';

type AssignOperatorsScreenProps = NativeStackScreenProps<BookingOfficerStackParamList, 'AssignOperators'>;

type Requirement = {
  type: string;
  count: number;
};

type Operator = {
  id: string;
  name: string;
  email: string;
  specialization: string;
  isAssigned?: boolean;
  assignment?: {
    id: string;
    status: string;
  };
};

type Production = {
  id: string;
  name: string;
  date: Date;
  callTime: Date;
  startTime: Date;
  endTime: Date;
  venue: string;
  [key: string]: any;
};

export default function AssignOperatorsScreen({ route, navigation }: AssignOperatorsScreenProps) {
  const { productionId, requirements = [], existingAssignments = [] } = route.params;
  const theme = useTheme();
  
  const [production, setProduction] = useState<Production | null>(null);
  const [operators, setOperators] = useState<{ [key: string]: Operator[] }>({});
  const [assignedOperators, setAssignedOperators] = useState<{ [key: string]: Operator[] }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  
  // Initialize state
  useEffect(() => {
    const fetchData = async () => {
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
        
        // Initialize operators object with empty arrays
        const requiredTypes = requirements.map(req => req.type);
        const operatorsObj: { [key: string]: Operator[] } = {};
        const assignedOperatorsObj: { [key: string]: Operator[] } = {};
        
        requiredTypes.forEach(type => {
          operatorsObj[type] = [];
          assignedOperatorsObj[type] = [];
        });
        
        // Fetch all operators
        const operatorsRef = collection(db, 'users');
        const operatorsQuery = query(
          operatorsRef,
          where('role', '==', 'operator')
        );
        
        const operatorsSnapshot = await getDocs(operatorsQuery);
        const operatorsList = operatorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Operator[];
        
        // Process existing assignments if any
        const existingAssignmentMap = new Map();
        
        existingAssignments.forEach(assignment => {
          existingAssignmentMap.set(assignment.userId, {
            id: assignment.id,
            status: assignment.status,
            role: assignment.role
          });
        });
        
        // Group operators by specialization and filter already assigned ones
        operatorsList.forEach(operator => {
          // Skip operators without specialization
          if (!operator.specialization) return;
          
          // Check if operator already has an assignment
          if (existingAssignmentMap.has(operator.id)) {
            const assignment = existingAssignmentMap.get(operator.id);
            operator.isAssigned = true;
            operator.assignment = {
              id: assignment.id,
              status: assignment.status
            };
            
            // Add to assigned operators if role matches
            if (assignment.role === operator.specialization && assignedOperatorsObj[operator.specialization]) {
              assignedOperatorsObj[operator.specialization].push(operator);
            }
          } else {
            operator.isAssigned = false;
            
            // Add to available operators if we need this specialization
            if (operatorsObj[operator.specialization]) {
              operatorsObj[operator.specialization].push(operator);
            }
          }
        });
        
        setOperators(operatorsObj);
        setAssignedOperators(assignedOperatorsObj);
        
        // Set all categories as expanded initially
        setExpandedCategories(requiredTypes);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load operators');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [productionId, requirements, existingAssignments]);
  
  // Toggle category expansion
  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };
  
  // Assign operator
  const assignOperator = (operator: Operator, type: string) => {
    // Remove from available operators
    setOperators(prev => ({
      ...prev,
      [type]: prev[type].filter(op => op.id !== operator.id)
    }));
    
    // Add to assigned operators
    setAssignedOperators(prev => ({
      ...prev,
      [type]: [...prev[type], { ...operator, isAssigned: true }]
    }));
  };
  
  // Unassign operator
  const unassignOperator = (operator: Operator, type: string) => {
    // If operator has an existing assignment, we'll need to delete it
    if (operator.assignment) {
      // Keep the operator in assigned list until save, but mark as pending removal
      setAssignedOperators(prev => ({
        ...prev,
        [type]: prev[type].map(op => 
          op.id === operator.id 
            ? { ...op, pendingRemoval: true } 
            : op
        )
      }));
    } else {
      // Remove from assigned operators
      setAssignedOperators(prev => ({
        ...prev,
        [type]: prev[type].filter(op => op.id !== operator.id)
      }));
      
      // Add back to available operators
      setOperators(prev => ({
        ...prev,
        [type]: [...prev[type], { ...operator, isAssigned: false }]
      }));
    }
  };
  
  // Save assignments
  const saveAssignments = async () => {
    if (!production) return;
    
    try {
      setSaving(true);
      
      const assignmentPromises: Promise<any>[] = [];
      const deletionPromises: Promise<any>[] = [];
      const notificationPromises: Promise<any>[] = [];
      
      // Process each operator type
      Object.keys(assignedOperators).forEach(type => {
        assignedOperators[type].forEach(operator => {
          // Skip operators with pending removal
          if (operator.pendingRemoval) {
            if (operator.assignment) {
              // Delete existing assignment
              deletionPromises.push(
                deleteDoc(doc(db, 'assignments', operator.assignment.id))
              );
            }
            return;
          }
          
          // If operator already has an assignment, skip
          if (operator.assignment) return;
          
          // Create new assignment
          const assignmentData = {
            productionId,
            userId: operator.id,
            role: type,
            status: 'pending', // Operator needs to accept
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          // Add to promises
          assignmentPromises.push(
            addDoc(collection(db, 'assignments'), assignmentData)
              .then(docRef => {
                // Create notification for the operator
                return addDoc(collection(db, 'notifications'), {
                  userId: operator.id,
                  type: 'assignment',
                  title: 'New Assignment',
                  body: `You have been assigned as ${getTypeName(type)} for "${production.name}" on ${formatDate(production.date)}`,
                  productionId,
                  assignmentId: docRef.id,
                  read: false,
                  createdAt: serverTimestamp()
                });
              })
          );
        });
      });
      
      // Execute all promises
      await Promise.all([...assignmentPromises, ...deletionPromises, ...notificationPromises]);
      
      Alert.alert(
        'Success',
        'Crew assignments have been saved',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ManageRequest', { productionId })
          }
        ]
      );
    } catch (error) {
      console.error('Error saving assignments:', error);
      Alert.alert('Error', 'Failed to save crew assignments');
    } finally {
      setSaving(false);
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
  
  // Format date
  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };
  
  // Filter operators by search query
  const filterOperators = (operatorsList: Operator[]) => {
    if (!searchQuery.trim()) return operatorsList;
    
    const query = searchQuery.toLowerCase();
    return operatorsList.filter(
      operator => 
        operator.name.toLowerCase().includes(query) || 
        operator.email.toLowerCase().includes(query)
    );
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
        <Card style={styles.productionCard}>
          <Card.Content>
            <Title>{production.name}</Title>
            <Text style={styles.dateText}>{formatDate(production.date)}</Text>
            <Text style={styles.venueText}>{production.venue}</Text>
          </Card.Content>
        </Card>
        
        <Searchbar
          placeholder="Search operators"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        {requirements.map((requirement: Requirement) => (
          <Card key={requirement.type} style={styles.requirementCard}>
            <Card.Title
              title={getTypeName(requirement.type)}
              left={props => <Ionicons name={getTypeIcon(requirement.type)} size={24} color="#555" />}
              right={props => (
                <Text style={styles.countText}>
                  {assignedOperators[requirement.type]?.filter(op => !op.pendingRemoval).length || 0}/{requirement.count}
                </Text>
              )}
              onPress={() => toggleCategory(requirement.type)}
            />
            
            {expandedCategories.includes(requirement.type) && (
              <Card.Content>
                <Divider style={styles.divider} />
                
                {/* Assigned Operators */}
                {assignedOperators[requirement.type]?.length > 0 && (
                  <View style={styles.operatorsSection}>
                    <Text style={styles.sectionTitle}>Assigned Operators</Text>
                    
                    {assignedOperators[requirement.type]
                      .filter(op => !op.pendingRemoval)
                      .map(operator => (
                        <View key={operator.id} style={styles.operatorRow}>
                          <View style={styles.operatorInfo}>
                            <Text style={styles.operatorName}>{operator.name}</Text>
                            <Text style={styles.operatorEmail}>{operator.email}</Text>
                          </View>
                          
                          {operator.assignment ? (
                            <Chip 
                              style={[
                                styles.statusChip,
                                operator.assignment.status === 'accepted' ? styles.acceptedChip : 
                                operator.assignment.status === 'declined' ? styles.declinedChip : 
                                styles.pendingChip
                              ]}
                            >
                              {operator.assignment.status === 'accepted' ? 'Accepted' : 
                               operator.assignment.status === 'declined' ? 'Declined' : 'Pending'}
                            </Chip>
                          ) : null}
                          
                          <Button
                            mode="text"
                            icon="close"
                            onPress={() => unassignOperator(operator, requirement.type)}
                            disabled={saving}
                          >
                            Remove
                          </Button>
                        </View>
                      ))
                    }
                  </View>
                )}
                
                {/* Available Operators */}
                {operators[requirement.type]?.length > 0 && (
                  <View style={styles.operatorsSection}>
                    <Text style={styles.sectionTitle}>Available Operators</Text>
                    
                    {filterOperators(operators[requirement.type]).map(operator => (
                      <View key={operator.id} style={styles.operatorRow}>
                        <View style={styles.operatorInfo}>
                          <Text style={styles.operatorName}>{operator.name}</Text>
                          <Text style={styles.operatorEmail}>{operator.email}</Text>
                        </View>
                        
                        <Button
                          mode="text"
                          icon="plus"
                          onPress={() => assignOperator(operator, requirement.type)}
                          disabled={
                            saving || 
                            (assignedOperators[requirement.type]?.filter(op => !op.pendingRemoval).length || 0) >= requirement.count
                          }
                        >
                          Assign
                        </Button>
                      </View>
                    ))}
                    
                    {filterOperators(operators[requirement.type]).length === 0 && (
                      <Text style={styles.noOperatorsText}>
                        {searchQuery ? 'No matching operators found' : 'No additional operators available'}
                      </Text>
                    )}
                  </View>
                )}
              </Card.Content>
            )}
          </Card>
        ))}
        
        <View style={styles.actionButtonsContainer}>
          <Button
            mode="contained"
            onPress={saveAssignments}
            style={styles.saveButton}
            loading={saving}
            disabled={saving}
          >
            Save Assignments
          </Button>