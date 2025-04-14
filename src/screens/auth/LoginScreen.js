// src/screens/auth/LoginScreen.js

import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Title, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const { login } = useAuth();
  const theme = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to log in');
      }
    } catch (error) {
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
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/logo.png')} 
              style={styles.logo} 
              resizeMode="contain"
            />
            <Title style={styles.title}>TV Production Schedule</Title>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              mode="outlined"
            />

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

            <Button 
              mode="contained" 
              onPress={handleLogin} 
              style={styles.button}
              loading={loading}
              disabled={loading}
            >
              Login
            </Button>

            <Button 
              mode="text" 
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.linkButton}
            >
              Forgot Password?
            </Button>

            <View style={styles.registerContainer}>
              <Text>Don't have an account? </Text>
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('Register')}
                style={styles.registerButton}
              >
                Register
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    marginTop: 10,
    fontSize: 24,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
  linkButton: {
    marginTop: 10,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerButton: {
    marginLeft: -10,
  },
});

// src/screens/auth/RegisterScreen.js

import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Title, RadioButton, useTheme, HelperText } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

export default function RegisterScreen({ navigation }) {
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

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
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
        role === 'operator' ? specialization : null
      );
      
      if (result.success) {
        Alert.alert('Success', 'Account created successfully');
        // Navigate back to login or automatically log them in
      } else {
        Alert.alert('Error', result.error || 'Failed to create account');
      }
    } catch (error) {
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

// src/screens/auth/ForgotPasswordScreen.js

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Title, Paragraph, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const theme = useTheme();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        Alert.alert(
          'Success', 
          'Password reset email sent. Please check your inbox.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send password reset email');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Title style={styles.title}>Forgot Password</Title>
        
        <Paragraph style={styles.paragraph}>
          Enter your email address and we'll send you a link to reset your password.
        </Paragraph>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          mode="outlined"
        />

        <Button 
          mode="contained" 
          onPress={handleResetPassword} 
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          Reset Password
        </Button>

        <Button 
          mode="text" 
          onPress={() => navigation.navigate('Login')}
          style={styles.backButton}
        >
          Back to Login
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  paragraph: {
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
  backButton: {
    marginTop: 20,
  },
});