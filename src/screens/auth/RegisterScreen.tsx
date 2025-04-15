import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Title, RadioButton, useTheme, HelperText } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation';

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('producer');
  const [specialization, setSpecialization] = useState('camera');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const theme = useTheme();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleRegister = async () => {
    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // If role is operator, include specialization
      const result = await register(
        email, 
        password, 
        name, 
        role,
        role === 'operator' ? specialization : undefined
      );
      
      if (result.success) {
        Alert.alert('Success', 'Account created successfully');
        // Navigate back to login or automatically log them in
      } else {
        Alert.alert('Error', result.error || 'Failed to create account');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Title style={styles.title}>Create an Account</Title>

          <View style={styles.formContainer}>
            <TextInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
            />
            {email ? (
              <HelperText type="error" visible={!validateEmail(email)}>
                Please enter a valid email address
              </HelperText>
            ) : null}

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
              style={styles.input}
              mode="outlined"
              right={
                <TextInput.Icon 
                  icon={secureTextEntry ? "eye" : "eye-off"} 
                  onPress={() => setSecureTextEntry(!secureTextEntry)}
                />
              }
            />
            {password ? (
              <HelperText type="error" visible={!validatePassword(password)}>
                Password must be at least 6 characters long
              </HelperText>
            ) : null}

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={secureConfirmTextEntry}
              style={styles.input}
              mode="outlined"
              right={
                <TextInput.Icon 
                  icon={secureConfirmTextEntry ? "eye" : "eye-off"} 
                  onPress={() => setSecureConfirmTextEntry(!secureConfirmTextEntry)}
                />
              }
            />
            {confirmPassword ? (
              <HelperText type="error" visible={password !== confirmPassword}>
                Passwords don't match
              </HelperText>
            ) : null}

            <Text style={styles.roleLabel}>Select your role:</Text>
            <RadioButton.Group onValueChange={value => setRole(value)} value={role}>
              <View style={styles.radioRow}>
                <RadioButton.Item label="Producer" value="producer" />
                <RadioButton.Item label="Booking Officer" value="booking_officer" />
                <RadioButton.Item label="Operator" value="operator" />
              </View>
            </RadioButton.Group>

            {role === 'operator' && (
              <View style={styles.pickerContainer}>
                <Text style={styles.roleLabel}>Select your specialization:</Text>
                <View style={styles.picker}>
                  <Picker
                    selectedValue={specialization}
                    onValueChange={(itemValue) => setSpecialization(itemValue)}
                  >
                    <Picker.Item label="Camera Operator" value="camera" />
                    <Picker.Item label="Sound Operator" value="sound" />
                    <Picker.Item label="Lighting Operator" value="lighting" />
                    <Picker.Item label="EVS Operator" value="evs" />
                    <Picker.Item label="Director" value="director" />
                    <Picker.Item label="Stream Operator" value="stream" />
                    <Picker.Item label="Technician" value="technician" />
                    <Picker.Item label="Electrician" value="electrician" />
                    <Picker.Item label="Transport" value="transport" />
                  </Picker>
                </View>
              </View>
            )}

            <Button 
              mode="contained" 
              onPress={handleRegister} 
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              Register
            </Button>

            <View style={styles.loginContainer}>
              <Text>Already have an account? </Text>
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('Login')}
                style={styles.loginButton}
              >
                Login
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginVertical: 20,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 10,
  },
  roleLabel: {
    marginTop: 10,
    marginBottom: 5,
    fontSize: 16,
  },
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    marginTop: 10,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  button: {
    marginTop: 20,
    paddingVertical: 5,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginButton: {
    marginLeft: -10,
  },
});