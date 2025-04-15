import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Title, Paragraph, useTheme } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation';

type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
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
    } catch (error: any) {
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