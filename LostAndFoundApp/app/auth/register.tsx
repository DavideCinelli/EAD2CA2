import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register, isLoading } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    // Password must be at least 6 characters
    return password.length >= 6;
  };

  const validateUsername = (username: string) => {
    // Username must be at least 3 characters
    return username.length >= 3;
  };

  const handleRegister = async () => {
    try {
      // Reset error
      setError('');

      // Validate input
      if (!username || !email || !password || !confirmPassword) {
        setError('All fields are required');
        return;
      }

      if (!validateUsername(username)) {
        setError('Username must be at least 3 characters');
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      if (!validatePassword(password)) {
        setError('Password must be at least 6 characters');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      console.log('Attempting to register with:', { username, email, password: '***' });
      
      try {
        await register({ username, email, password });
        router.replace('/');
      } catch (err: any) {
        console.error('Registration error in component:', err);
        
        // Handle specific error cases
        if (err?.message?.includes('already taken')) {
          // Show a more helpful message when username is already taken
          Alert.alert(
            'Account Already Exists',
            'This username is already registered. Would you like to login instead?',
            [
              { 
                text: 'No', 
                style: 'cancel' 
              },
              { 
                text: 'Yes, Login', 
                onPress: () => router.push('/auth/login')
              }
            ]
          );
        } else if (err?.message?.includes('Failed to register')) {
          // Server error
          Alert.alert(
            'Server Error',
            'The server is currently experiencing issues. Please try again later.',
            [{ text: 'OK' }]
          );
        } else {
          // Display a more detailed error message for other errors
          if (err && err.message) {
            setError(`Registration failed: ${err.message}`);
          } else {
            setError('Registration failed. Please try again.');
          }
        }
      }
    } catch (error: any) {
      console.error('Unexpected error:', error);
      setError('An unexpected error occurred');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Lost and Found</Text>
      <Text style={styles.subtitle}>Create a new account</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Choose a username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          testID="username-input"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          testID="email-input"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password (min 6 characters)"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          testID="password-input"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          testID="confirm-password-input"
        />
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRegister}
        disabled={isLoading}
        testID="register-button"
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={styles.loginLink}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#4a90e2',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#4a90e2',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
}); 