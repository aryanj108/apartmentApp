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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import EyeOffOutline from '../../assets/eye-off-outline.svg';
import EyeOpenOutline from '../../assets/eye-open.svg';

const { width } = Dimensions.get('window');
const scale = (size: number) => (width / 375) * size;

const getErrorMessage = (error: any): string => {
  const errorCode = error.code || '';
    
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Invalid email address format';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled';
    default:
      return error.message || 'Authentication failed. Please try again';
  }
};

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { signInWithEmail, signUpWithEmail, sendVerificationEmail, loading, error, setError } = useAuth();

  const handleConfirm = async () => {
    try {
      setError(null);
      
      // Validation
      if (!email.trim()) {
        Alert.alert('Error', 'Please enter your email address');
        return;
      }
      if (!email.includes('@')) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }
      if (!password) {
        Alert.alert('Error', 'Please enter your password');
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
      const friendlyMessage = getErrorMessage(err);
      Alert.alert(
        isSignUp ? 'Sign Up Failed' : 'Login Failed',
        friendlyMessage,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#FF8C42', '#BF5700', '#994400']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }} 
        style={styles.gradient}
      >
        <View style={styles.centerContainer}>
          {/* Brand/Logo Section */}
          <View style={styles.brandSection}>
            <Text style={styles.brandTitle} allowFontScaling={false}>
              Longhorn Living
            </Text>
            <Text style={styles.infoTitle} allowFontScaling={false}>
              Find your perfect apartment
            </Text>
            <View style={styles.brandDivider} />
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title} allowFontScaling={false}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            
            <View style={styles.inputGroup}>
              <TextInput
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoComplete="email"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  style={styles.passwordInput}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                  autoComplete={isSignUp ? 'password-new' : 'password'}
                />
                <Pressable 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={8}
                >
                  {showPassword ? (
                    <EyeOffOutline width={20} height={20} fill="#6B7280" />
                  ) : (
                    <EyeOpenOutline width={20} height={20} fill="#6B7280" />
                  )}
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText} allowFontScaling={false}>
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Text>
              )}
            </Pressable>

            {/* Footer Links */}
            <View style={styles.footer}>
              {!isSignUp && (
                <Pressable
                  onPress={() => navigation.navigate('ForgotPassword')}
                  hitSlop={8}
                >
                  <Text style={styles.linkText}>
                    Forgot Password?
                  </Text>
                </Pressable>
              )}
              
              <Pressable
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                hitSlop={8}
              >
                <Text style={styles.linkText}>
                  {isSignUp 
                    ? 'Already have an account?' 
                    : "Don't have an account?"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(24),
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: scale(40),
  },
  brandTitle: {
    fontSize: scale(32),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: scale(12),
  },
  infoTitle: {
    fontSize: scale(16),
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: scale(12),
  },
  brandDivider: {
    width: scale(60),
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 2,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: scale(20),
    padding: scale(32),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 10,
  },
  title: {
    fontSize: scale(26),
    fontWeight: '600',
    color: '#111827',
    marginBottom: scale(28),
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: scale(24),
    gap: scale(14),
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: scale(12),
    paddingVertical: scale(16),
    paddingHorizontal: scale(18),
    fontSize: scale(16),
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: scale(12),
    backgroundColor: '#F9FAFB',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: scale(16),
    paddingHorizontal: scale(18),
    fontSize: scale(16),
    color: '#111827',
  },
  eyeButton: {
    padding: scale(12),
    paddingRight: scale(18),
  },
  button: {
    backgroundColor: '#BF5700',
    paddingVertical: scale(16),
    borderRadius: scale(12),
    alignItems: 'center',
    shadowColor: '#BF5700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  footer: {
    marginTop: scale(24),
    gap: scale(12),
    alignItems: 'center',
  },
  linkText: {
    fontSize: scale(14),
    color: '#6B7280',
    fontWeight: '500',
  },
});