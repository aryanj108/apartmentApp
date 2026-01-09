import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const { signInWithEmail, signUpWithEmail, sendVerificationEmail, loading, error, setError } = useAuth();

  const handleConfirm = async () => {
    try {
      setError(null);
      
      // Validation
      if (!email.includes('@')) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }
      
    if (isSignUp) {
      await signUpWithEmail(email, password);
      
      // Send verification email automatically
      try {
        await sendVerificationEmail();
        Alert.alert(
          'Account Created!',
          'A verification email has been sent to ' + email + '. Please check your inbox and verify your email.',
          [{ text: 'OK' }]
        );
      } catch (err) {
        // Account was still created, just failed to send email
        Alert.alert('Account Created', 'Account created successfully!');
      }
    } else {
      await signInWithEmail(email, password);
    }
      
      // Navigation happens automatically via AuthContext - no manual navigation needed!
    } catch (err: any) {
      console.error('Auth error:', err);
      Alert.alert('Error', err.message || 'Authentication failed');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title} allowFontScaling={false}>
          {isSignUp ? 'Create your account' : 'Enter your email'}
        </Text>
        
        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoComplete="email"
        />

        <TextInput
          placeholder="Password (min 6 characters)"
          placeholderTextColor="#999"
          style={styles.input}
          autoCapitalize="none"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          autoComplete={isSignUp ? 'password-new' : 'password'}
        />

        {/* Error Message */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText} allowFontScaling={false}>
              {isSignUp ? 'Sign Up' : 'Confirm'}
            </Text>
          )}
        </Pressable>

        {/* Toggle between Sign In and Sign Up */}
        <Pressable
          style={styles.toggleButton}
          onPress={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
        >
          <Text style={styles.toggleText}>
            {isSignUp 
              ? 'Already have an account? Sign In' 
              : "Don't have an account? Sign Up"}
          </Text>
        </Pressable>

        {/* Forgot Password Link - only show on Sign In */}
        {!isSignUp && (
          <Pressable
            style={styles.forgotPasswordButton}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>
              Forgot Password?
            </Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: scale(24),
    backgroundColor: '#fff',
  },
  title: {
    fontSize: scale(18),
    fontWeight: '600',
    marginBottom: scale(16),
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: scale(10),
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    fontSize: scale(16),
    marginBottom: scale(20),
  },
  button: {
    backgroundColor: '#BF5700',
    paddingVertical: scale(14),
    borderRadius: scale(10),
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: scale(16),
    alignItems: 'center',
  },
  toggleText: {
    fontSize: scale(14),
    color: '#BF5700',
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    fontSize: scale(13),
    marginBottom: scale(12),
    textAlign: 'center',
  },
  forgotPasswordButton: {
     marginTop: scale(12),
     alignItems: 'center',
   },
   forgotPasswordText: {
     fontSize: scale(14),
     color: '#6b7280',
     fontWeight: '500',
   },
});