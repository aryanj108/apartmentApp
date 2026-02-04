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
import { BlurView } from 'expo-blur';
import { ImageBackground } from 'react-native';

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
      {/*<LinearGradient
        colors={['#BF5700', '#FF8C42', '#FFFFFF']} 
        style={styles.gradient}
      >*/}
         <ImageBackground
    source={require('../../assets/background.jpg')}
    style={styles.backgroundImage}
    resizeMode="cover"
  >
        <View style={styles.centerContainer}>
          <BlurView intensity={80} tint="light" style={styles.blurCard}>
            <View style={styles.cardContent}>
              <Text style={styles.title} allowFontScaling={false}>
                {isSignUp ? 'Create your account' : 'Sign in with email'}
              </Text>
              
              <Text style={styles.subtitle}>
                {isSignUp 
                  ? 'Join Longhorn Living to find your perfect home' 
                  : 'Welcome back to Longhorn Living'}
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

              {/* Password Input with Toggle */}
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#999"
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
                >
                  {showPassword ? (
                    <EyeOffOutline width={25} height={25} />
                  ) : (
                    <EyeOpenOutline width={25} height={25} />
                  )}
                </Pressable>
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
                    {isSignUp ? 'Sign Up' : 'Get Started'}
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
          </BlurView>
        </View>
        </ImageBackground>
      {/*</LinearGradient>*/}
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
    backgroundImage: {
    flex: 1,
  },
  blurCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: scale(24),
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)', 
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  cardContent: {
    padding: scale(32),
  },
  title: {
    fontSize: scale(22),
    fontWeight: '700',
    marginBottom: scale(8),
    textAlign: 'center',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: scale(14),
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: scale(24),
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: scale(12),
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    fontSize: scale(16),
    marginBottom: scale(16),
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: scale(12),
    backgroundColor: '#fff',
    marginBottom: scale(16),
  },
  passwordInput: {
    flex: 1,
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    fontSize: scale(16),
  },
  eyeButton: {
    padding: scale(10),
    paddingRight: scale(16),
  },
  button: {
    backgroundColor: '#1f2937',
    paddingVertical: scale(14),
    borderRadius: scale(12),
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
  toggleButton: {
    marginTop: scale(16),
    alignItems: 'center',
  },
  toggleText: {
    fontSize: scale(14),
    color: '#BF5700',
    fontWeight: '500',
  },
  forgotPasswordButton: {
    marginTop: scale(8),
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: scale(13),
    color: '#6b7280',
    fontWeight: '500',
  },
});