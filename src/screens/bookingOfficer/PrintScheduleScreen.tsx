import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Text, Button, Divider, useTheme, List, RadioButton, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, orderBy, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format, addDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BookingOfficerTabParamList, BookingOfficerStackParamList } from '../../navigation';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

type PrintScheduleScreenProps = CompositeScreenProps<
  BottomTabScreenProps<BookingOfficerTabParamList, 'Print'>,
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

type PrintOption = 'today' | 'tomorrow' | 'week' | 'custom' | 'single';

export default function PrintScheduleScreen({ route, navigation }: PrintScheduleScreenProps) {
  const theme = useTheme();
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printOption, setPrintOption] = useState<PrintOption>(
    route.params?.productionId ? 'single' : 'today'
  );
  const [productions, setProductions] = useState<Production[]>([]);
  const [customDateStart, setCustomDateStart] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customDateEnd, setCustomDateEnd] = useState<string>(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [headerText, setHeaderText] = useState('TV Production Schedule');
  
  // Fetch productions based on selected date range
  useEffect(() => {
    const fetchProductions = async () => {
      try {
        setLoading(true);
        
        // If specific production ID provided
        if (route.params?.productionId) {
          const productionDoc = await getDoc(doc(db, 'productions', route.params.productionId));
          
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
            
            // Fetch assignments
            productionData.assignments = await fetchAssignmentsForProduction(productionData.id);
            
            setProductions([productionData]);
          } else {
            Alert.alert('Error', 'Production not found');
          }
          
          setLoading(false);
          return;
        }
        
        // Determine date range based on print option
        let startDate: Date, endDate: Date;
        
        switch (printOption) {
          case 'today':
            startDate = startOfDay(new Date());
            endDate = endOfDay(new Date());
            break;
            
          case 'tomorrow':
            startDate = startOfDay(addDays(new Date(), 1));
            endDate = endOfDay(addDays(new Date(), 1));
            break;
            
          case 'week':
            startDate = startOfDay(new Date());
            endDate = endOfDay(addDays(new Date(), 7));
            break;
            
          case 'custom':
            try {
              startDate = startOfDay(new Date(customDateStart));
              endDate = endOfDay(new Date(customDateEnd));
              
              if (isAfter(startDate, endDate)) {
                throw new Error('Start date cannot be after end date');
              }
            } catch (error) {
              Alert.alert('Error', 'Invalid date range. Please check the dates.');
              setLoading(false);
              return;
            }
            break;
            
          default:
            startDate = startOfDay(new Date());
            endDate = endOfDay(new Date());
        }
        
        // Fetch productions within date range
        const productionsRef = collection(db, 'productions');
        const q = query(
          productionsRef,
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(endDate)),
          orderBy('date', 'asc'),
          orderBy('startTime', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const productionsList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date ? (data.date as Timestamp).toDate() : new Date(),
            callTime: data.callTime ? (data.callTime as Timestamp).toDate() : new Date(),
            startTime: data.startTime ? (data.startTime as Timestamp).toDate() : new Date(),
            endTime: data.endTime ? (data.endTime as Timestamp).toDate() : new Date(),
          } as Production;
        });
        
        // Only include confirmed or in-progress productions
        const filteredProductions = productionsList.filter(
          p => p.status === 'confirmed' || p.status === 'in_progress'
        );
        
        // Fetch assignments for each production
        const productionsWithAssignments = await Promise.all(
          filteredProductions.map(async production => {
            production.assignments = await fetchAssignmentsForProduction(production.id);
            return production;
          })
        );
        
        setProductions(productionsWithAssignments);
      } catch (error) {
        console.error('Error fetching productions:', error);
        Alert.alert('Error', 'Failed to fetch productions');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductions();
  }, [printOption, customDateStart, customDateEnd, route.params?.productionId]);
  
  // Fetch assignments for a production
  const fetchAssignmentsForProduction = async (productionId: string) => {
    try {
      const assignmentsRef = collection(db, 'assignments');
      const assignmentsQuery = query(
        assignmentsRef,
        where('productionId', '==', productionId),
        where('status', '==', 'accepted')
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
      
      return assignmentsList;
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return [];
    }
  };
  
  // Format time
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
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
  
  // Generate PDF for printing
  const generatePDF = async () => {
    if (productions.length === 0) {
      Alert.alert('No Productions', 'There are no productions to print for the selected period.');
      return;
    }
    
    try {
      setPrinting(true);
      
      // Generate HTML for PDF
      let title = '';
      if (printOption === 'single') {
        title = `Schedule for ${productions[0].name}`;
      } else if (printOption === 'today') {
        title = `Today's Schedule (${format(new Date(), 'MMMM d, yyyy')})`;
      } else if (printOption === 'tomorrow') {
        title = `Tomorrow's Schedule (${format(addDays(new Date(), 1), 'MMMM d, yyyy')})`;
      } else if (printOption === 'week') {
        title = `Weekly Schedule (${format(new Date(), 'MMMM d')} - ${format(addDays(new Date(), 7), 'MMMM d, yyyy')})`;
      } else if (printOption === 'custom') {
        title = `Schedule: ${format(new Date(customDateStart), 'MMMM d')} - ${format(new Date(customDateEnd), 'MMMM d, yyyy')}`;
      }
      
      let html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 18px;
              margin-bottom: 20px;
            }
            .production {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .production-header {
              background-color: #f5f5f5;
              padding: 10px;
              border-radius: 5px 5px 0 0;
              border-bottom: 2px solid #ddd;
            }
            .production-name {
              font-size: 18px;
              font-weight: bold;
            }
            .production-date {
              margin-top: 5px;
              color: #666;
            }
            .production-info {
              padding: 10px;
              border: 1px solid #ddd;
              border-top: none;
              border-radius: 0 0 5px 5px;
            }
            .times {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
            }
            .time-box {
              text-align: center;
            }
            .time-label {
              font-size: 12px;
              color: #666;
            }
            .time-value {
              font-weight: bold;
            }
            .venue {
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px solid #eee;
            }
            .crew-header {
              font-weight: bold;
              margin-top: 10px;
              margin-bottom: 5px;
            }
            .crew-member {
              margin-bottom: 5px;
              display: flex;
            }
            .crew-role {
              width: 150px;
              color: #666;
            }
            .crew-name {
              flex: 1;
            }
            .page-break {
              page-break-after: always;
            }
            .logo {
              max-width: 120px;
              margin-bottom: 10px;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${headerText}</div>
            <div class="subtitle">${title}</div>
          </div>
      `;
      
      productions.forEach((production, index) => {
        html += `
          <div class="production">
            <div class="production-header">
              <div class="production-name">${production.name}</div>
              <div class="production-date">${formatDate(production.date)}</div>
            </div>
            <div class="production-info">
              <div class="times">
                <div class="time-box">
                  <div class="time-label">Call Time</div>
                  <div class="time-value">${formatTime(production.callTime)}</div>
                </div>
                <div class="time-box">
                  <div class="time-label">Start Time</div>
                  <div class="time-value">${formatTime(production.startTime)}</div>
                </div>
                <div class="time-box">
                  <div class="time-label">End Time</div>
                  <div class="time-value">${formatTime(production.endTime)}</div>
                </div>
              </div>
              <div class="venue">
                <strong>Location:</strong> ${production.venue}${production.locationDetails ? ` - ${production.locationDetails}` : ''}
              </div>
              <div class="crew-header">Assigned Crew</div>
        `;
        
        if (production.assignments && production.assignments.length > 0) {
          production.assignments.forEach(assignment => {
            if (assignment.userDetails) {
              html += `
                <div class="crew-member">
                  <div class="crew-role">${getTypeName(assignment.role)}:</div>
                  <div class="crew-name">${assignment.userDetails.name}</div>
                </div>
              `;
            }
          });
        } else {
          html += `<div>No crew assigned yet</div>`;
        }
        
        // Add producer info
        html += `
              <div class="crew-header" style="margin-top: 15px;">Producer</div>
              <div class="crew-member">
                <div class="crew-name">${production.requesterName || 'Unknown'}</div>
              </div>
            </div>
          </div>
        `;
        
        // Add page break between productions except for the last one
        if (index < productions.length - 1) {
          html += `<div class="page-break"></div>`;
        }
      });
      
      html += `
        </body>
      </html>
      `;
      
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // On web, open the PDF in a new tab
      if (Platform.OS === 'web') {
        window.open(uri, '_blank');
      } 
      // On mobile, share the PDF
      else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setPrinting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Print Schedule</Text>
        
        {route.params?.productionId ? (
          <Text style={styles.subtitle}>Generating schedule for selected production</Text>
        ) : (
          <>
            <View style={styles.optionsContainer}>
              <Text style={styles.sectionTitle}>Select Date Range</Text>
              
              <RadioButton.Group
                onValueChange={value => setPrintOption(value as PrintOption)}
                value={printOption}
              >
                <View style={styles.radioOption}>
                  <RadioButton.Item
                    label="Today's Schedule"
                    value="today"
                    position="leading"
                    labelStyle={styles.radioLabel}
                  />
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton.Item
                    label="Tomorrow's Schedule"
                    value="tomorrow"
                    position="leading"
                    labelStyle={styles.radioLabel}
                  />
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton.Item
                    label="Next 7 Days"
                    value="week"
                    position="leading"
                    labelStyle={styles.radioLabel}
                  />
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton.Item
                    label="Custom Date Range"
                    value="custom"
                    position="leading"
                    labelStyle={styles.radioLabel}
                  />
                </View>
              </RadioButton.Group>
              
              {printOption === 'custom' && (
                <View style={styles.customDateContainer}>
                  <TextInput
                    label="Start Date"
                    value={customDateStart}
                    onChangeText={setCustomDateStart}
                    mode="outlined"
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    keyboardType="default"
                  />
                  
                  <TextInput
                    label="End Date"
                    value={customDateEnd}
                    onChangeText={setCustomDateEnd}
                    mode="outlined"
                    style={styles.dateInput}
                    placeholder="YYYY-MM-DD"
                    keyboardType="default"
                  />
                </View>
              )}
            </View>
          </>
        )}
        
        <Divider style={styles.divider} />
        
        <View style={styles.headerContainer}>
          <Text style={styles.sectionTitle}>PDF Header</Text>
          
          <TextInput
            label="Header Text"
            value={headerText}
            onChangeText={setHeaderText}
            mode="outlined"
            style={styles.headerInput}
          />
        </View>
        
        <Divider style={styles.divider} />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading productions...</Text>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <Text style={styles.sectionTitle}>Preview</Text>
            
            {productions.length === 0 ? (
              <Text style={styles.noProductionsText}>
                No productions found for the selected date range
              </Text>
            ) : (
              productions.map(production => (
                <View key={production.id} style={styles.productionPreview}>
                  <Text style={styles.productionName}>{production.name}</Text>
                  <Text style={styles.productionDate}>{formatDate(production.date)}</Text>
                  <Text style={styles.productionTime}>
                    {formatTime(production.startTime)} - {formatTime(production.endTime)}
                  </Text>
                  <Text style={styles.productionVenue}>{production.venue}</Text>
                  
                  <Text style={styles.crewCount}>
                    {production.assignments ? production.assignments.length : 0} crew members assigned
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
        
        <Button
          mode="contained"
          icon="printer"
          onPress={generatePDF}
          style={styles.printButton}
          loading={printing}
          disabled={loading || printing || productions.length === 0}
        >
          Generate PDF
        </Button>
        
        {route.params?.productionId && (
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Go Back
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  radioOption: {
    marginVertical: -8,
  },
  radioLabel: {
    fontSize: 16,
  },
  customDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dateInput: {
    flex: 0.48,
  },
  divider: {
    marginVertical: 16,
  },
  headerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  headerInput: {
    marginBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  noProductionsText: {
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    padding: 16,
  },
  productionPreview: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
  },
  productionName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productionDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  productionTime: {
    fontSize: 14,
    color: '#666',
  },
  productionVenue: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  crewCount: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 8,
  },
  printButton: {
    marginVertical: 16,
  },
  backButton: {
    marginBottom: 32,
  },
});