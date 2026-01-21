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
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  
  const { resetPassword, loading, error, setError } = useAuth();

  const handleResetPassword = async () => {
    try {
      setError(null);
      
      // Validation
      if (!email.includes('@')) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
      
      await resetPassword(email);
      setEmailSent(true);
      Alert.alert(
        'Email Sent!',
        'Check your email for a password reset link.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Reset password error:', err);
      Alert.alert('Error', err.message || 'Failed to send reset email');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Back Button */}
        <Pressable 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.title} allowFontScaling={false}>
          Reset Password
        </Text>
        
        <Text style={styles.subtitle} allowFontScaling={false}>
          Enter your email address and we'll send you a link to reset your password
        </Text>

        {/* Email Input */}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoComplete="email"
          editable={!emailSent}
        />

        {/* Error Message */}
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {/* Send Reset Email Button */}
        <Pressable
          style={[styles.button, (loading || emailSent) && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading || emailSent}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText} allowFontScaling={false}>
              {emailSent ? 'Email Sent ✓' : 'Send Reset Link'}
            </Text>
          )}
        </Pressable>

        {emailSent && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              ✓ Password reset email sent! Check your inbox and spam folder.
            </Text>
          </View>
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
  backButton: {
    position: 'absolute',
    top: scale(60),
    left: scale(24),
    zIndex: 10,
  },
  backText: {
    fontSize: scale(16),
    color: '#BF5700',
    fontWeight: '600',
  },
  title: {
    fontSize: scale(28),
    fontWeight: '700',
    marginBottom: scale(8),
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: scale(14),
    color: '#666',
    marginBottom: scale(32),
    textAlign: 'center',
    lineHeight: scale(20),
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: scale(10),
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    fontSize: scale(16),
    marginBottom: scale(16),
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#BF5700',
    paddingVertical: scale(14),
    borderRadius: scale(10),
    alignItems: 'center',
    marginTop: scale(8),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: scale(13),
    marginBottom: scale(12),
    textAlign: 'center',
  },
  successBox: {
    marginTop: scale(20),
    padding: scale(16),
    backgroundColor: '#d1fae5',
    borderRadius: scale(10),
    borderWidth: 1,
    borderColor: '#10b981',
  },
  successText: {
    color: '#065f46',
    fontSize: scale(14),
    textAlign: 'center',
    fontWeight: '500',
  },
});