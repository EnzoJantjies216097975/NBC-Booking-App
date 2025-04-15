import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Title, Button, TextInput, Avatar, Divider, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { currentUser, userDetails, logout, fetchUserDetails } = useAuth();
  const theme = useTheme();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Load user details
  useEffect(() => {
    if (userDetails) {
      setName(userDetails.name || '');
      setEmail(userDetails.email || '');
    } else if (currentUser) {
      setLoading(true);
      fetchUserDetails(currentUser.uid)
        .then(details => {
          if (details) {
            setName(details.name || '');
            setEmail(details.email || '');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [userDetails, currentUser]);

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'producer':
        return 'Producer';
      case 'booking_officer':
        return 'Booking Officer';
      case 'operator':
        return 'Operator';
      default:
        return role;
    }
  };

  // Get specialization display name
  const getSpecializationDisplayName = (specialization: string) => {
    switch (specialization) {
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
        return specialization;
    }
  };

  // Save profile changes
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      setSaveLoading(true);
      
      if (currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          name
        });
      
        await fetchUserDetails(currentUser.uid);
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      const result = await logout();
      
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to log out');
      }
    } catch (error: any) {
      console.error('Error logging out:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLogoutLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarContainer}>
          <Avatar.Icon 
            icon="account" 
            size={80} 
            style={styles.avatar}
            color="#fff"
          />
        </View>
        
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Profile Information</Title>
            
            {editing ? (
              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                mode="outlined"
              />
            ) : (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{name}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role:</Text>
              <Text style={styles.infoValue}>
                {userDetails ? getRoleDisplayName(userDetails.role) : ''}
              </Text>
            </View>
            
            {userDetails && userDetails.role === 'operator' && userDetails.specialization && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Specialization:</Text>
                <Text style={styles.infoValue}>
                  {getSpecializationDisplayName(userDetails.specialization)}
                </Text>
              </View>
            )}
            
            {editing ? (
              <View style={styles.editButtons}>
                <Button 
                  mode="text" 
                  onPress={() => {
                    setName(userDetails?.name || '');
                    setEditing(false);
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
                
                <Button 
                  mode="contained" 
                  onPress={handleSave}
                  loading={saveLoading}
                  disabled={saveLoading}
                  style={styles.saveButton}
                >
                  Save
                </Button>
              </View>
            ) : (
              <Button 
                mode="outlined" 
                onPress={() => setEditing(true)}
                icon="pencil"
                style={styles.editButton}
              >
                Edit Profile
              </Button>
            )}
          </Card.Content>
        </Card>
        
        <Button 
          mode="outlined"
          icon="logout"
          onPress={handleLogout}
          loading={logoutLoading}
          disabled={logoutLoading}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
        >
          Log Out
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
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    backgroundColor: '#2c3e50',
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoLabel: {
    width: 120,
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    marginRight: 8,
  },
  saveButton: {
    minWidth: 100,
  },
  editButton: {
    marginTop: 8,
  },
  logoutButton: {
    marginTop: 8,
    borderColor: '#E53935',
  },
  logoutButtonContent: {
    height: 48,
  },
});