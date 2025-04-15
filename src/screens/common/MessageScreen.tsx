import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, RadioButton, Title } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, addDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProducerStackParamList, BookingOfficerStackParamList, OperatorStackParamList } from '../../navigation';

type MessageScreenProps = NativeStackScreenProps<
  ProducerStackParamList & BookingOfficerStackParamList & OperatorStackParamList, 
  'Message'
>;

type Production = {
  id: string;
  name: string;
  confirmedBy?: string;
  [key: string]: any;
};

export default function MessageScreen({ route, navigation }: MessageScreenProps) {
  const { productionId, productionName, messageType = 'general' } = route.params;
  const { currentUser, userDetails } = useAuth();
  const theme = useTheme();
  
  const [message, setMessage] = useState('');
  const [overtimeReason, setOvertimeReason] = useState('technical-issues');
  const [loading, setLoading] = useState(false);
  const [production, setProduction] = useState<Production | null>(null);

  // Load production details if needed
  useEffect(() => {
    const fetchProductionDetails = async () => {
      try {
        const productionDoc = await getDoc(doc(db, 'productions', productionId));
        
        if (productionDoc.exists()) {
          setProduction({
            id: productionDoc.id,
            ...productionDoc.data()
          } as Production);
        }
      } catch (error) {
        console.error('Error fetching production details:', error);
      }
    };

    fetchProductionDetails();
  }, [productionId]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!message.trim() && messageType !== 'overtime') {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    try {
      setLoading(true);
      
      if (messageType === 'overtime') {
        // Update production with overtime information
        await updateDoc(doc(db, 'productions', productionId), {
          actualEndTime: null, // This would be the actual time in a real implementation
          overtimeReason: message || getOvertimeReasonText(overtimeReason),
          overtime: true,
          updatedAt: serverTimestamp()
        });
        
        // Create a notification for the booking officer
        await addDoc(collection(db, 'notifications'), {
          userId: production?.confirmedBy || 'booking_officer', // This would be more specific in a real implementation
          type: 'overtime',
          title: 'Production Overtime',
          body: `${productionName} is going overtime. Reason: ${message || getOvertimeReasonText(overtimeReason)}`,
          productionId,
          read: false,
          createdAt: serverTimestamp()
        });
        
        Alert.alert(
          'Success',
          'Overtime report sent successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Create a message
        await addDoc(collection(db, 'messages'), {
          productionId,
          senderId: currentUser?.uid,
          senderName: userDetails?.name || 'Unknown',
          senderRole: userDetails?.role || 'unknown',
          text: message,
          timestamp: serverTimestamp()
        });
        
        // Create a notification for the booking officer
        await addDoc(collection(db, 'notifications'), {
          userId: production?.confirmedBy || 'booking_officer', // This would be more specific in a real implementation
          type: 'message',
          title: 'New Message',
          body: `${userDetails?.name || 'Someone'} sent a message about "${productionName}": ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
          productionId,
          read: false,
          createdAt: serverTimestamp()
        });
        
        Alert.alert(
          'Success',
          'Message sent successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Get overtime reason text
  const getOvertimeReasonText = (reason: string) => {
    switch (reason) {
      case 'technical-issues':
        return 'Technical Issues';
      case 'script-changes':
        return 'Script Changes';
      case 'talent-delays':
        return 'Talent Delays';
      case 'equipment-failure':
        return 'Equipment Failure';
      case 'weather-conditions':
        return 'Weather Conditions';
      case 'other':
        return 'Other';
      default:
        return reason;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.content}>
          <Title style={styles.title}>
            {messageType === 'overtime' ? 'Report Overtime' : 'Send Message'}
          </Title>
          
          <Text style={styles.productionName}>{productionName}</Text>
          
          {messageType === 'overtime' && (
            <View style={styles.overtimeSection}>
              <Text style={styles.sectionTitle}>Reason for Overtime:</Text>
              
              <RadioButton.Group
                onValueChange={value => setOvertimeReason(value)}
                value={overtimeReason}
              >
                <View style={styles.radioOption}>
                  <RadioButton.Item 
                    label="Technical Issues" 
                    value="technical-issues"
                    position="leading"
                    style={styles.radioItem}
                  />
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton.Item 
                    label="Script Changes" 
                    value="script-changes"
                    position="leading"
                    style={styles.radioItem}
                  />
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton.Item 
                    label="Talent Delays" 
                    value="talent-delays"
                    position="leading"
                    style={styles.radioItem}
                  />
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton.Item 
                    label="Equipment Failure" 
                    value="equipment-failure"
                    position="leading"
                    style={styles.radioItem}
                  />
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton.Item 
                    label="Weather Conditions" 
                    value="weather-conditions"
                    position="leading"
                    style={styles.radioItem}
                  />
                </View>
                
                <View style={styles.radioOption}>
                  <RadioButton.Item 
                    label="Other" 
                    value="other"
                    position="leading"
                    style={styles.radioItem}
                  />
                </View>
              </RadioButton.Group>
            </View>
          )}
          
          <TextInput
            label={messageType === 'overtime' ? 'Additional Details (Optional)' : 'Message'}
            value={message}
            onChangeText={setMessage}
            mode="outlined"
            multiline
            numberOfLines={5}
            style={styles.messageInput}
            placeholder={
              messageType === 'overtime' 
                ? 'Provide any additional information about the overtime...' 
                : 'Type your message here...'
            }
          />
          
          <Button
            mode="contained"
            onPress={handleSendMessage}
            loading={loading}
            disabled={loading}
            style={styles.sendButton}
            contentStyle={styles.sendButtonContent}
          >
            {messageType === 'overtime' ? 'Report Overtime' : 'Send Message'}
          </Button>
          
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  productionName: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  overtimeSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  radioOption: {
    marginVertical: -8,
  },
  radioItem: {
    paddingLeft: 0,
  },
  messageInput: {
    marginBottom: 16,
    height: 120,
  },
  sendButton: {
    marginBottom: 12,
  },
  sendButtonContent: {
    height: 48,
  },
  cancelButton: {
    marginBottom: 16,
  },
});