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
import EyeOffOutline from '../../assets/eye-off-outline.svg';
import EyeOpenOutline from '../../assets/eye-open.svg';
import LoginLogo from '../../assets/loginLogo.svg'; // Your custom logo

const { width, height } = Dimensions.get('window');
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
      <View style={styles.container}>
        {/* Language Selector */}
        <View style={styles.languageContainer}>
          <Text style={styles.languageText}>English (US)</Text>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <LoginLogo width={scale(80)} height={scale(80)} />
        </View>

        {/* Input Fields */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Username, email or mobile number"
            placeholderTextColor="#8e8e8e"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoComplete="email"
          />

          {/* Password Input with Toggle */}
          <View style={styles.passwordInputWrapper}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#8e8e8e"
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
                <EyeOffOutline width={22} height={22} fill="#8e8e8e" />
              ) : (
                <EyeOpenOutline width={22} height={22} fill="#8e8e8e" />
              )}
            </Pressable>
          </View>

          {/* Login Button */}
          <Pressable
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText} allowFontScaling={false}>
                {isSignUp ? 'Sign up' : 'Log in'}
              </Text>
            )}
          </Pressable>

          {/* Forgot Password Link - only show on Sign In */}
          {!isSignUp && (
            <Pressable
              style={styles.forgotPasswordButton}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>
                Forgot password?
              </Text>
            </Pressable>
          )}
        </View>

        {/* Spacer to push create account button to bottom */}
        <View style={styles.spacer} />

        {/* Create Account / Sign In Toggle Button */}
        <View style={styles.bottomContainer}>
          <Pressable
            style={styles.createAccountButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
          >
            <Text style={styles.createAccountText}>
              {isSignUp 
                ? 'Already have an account? Log in' 
                : 'Create new account'}
            </Text>
          </Pressable>

          {/* Meta Logo */}
          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>Meta</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background like Instagram
    paddingHorizontal: scale(16),
  },
  languageContainer: {
    alignItems: 'center',
    paddingTop: scale(16),
    paddingBottom: scale(20),
  },
  languageText: {
    color: '#8e8e8e',
    fontSize: scale(13),
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: scale(60),
    marginBottom: scale(40),
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: scale(8),
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: scale(12),
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    fontSize: scale(14),
    marginBottom: scale(12),
    color: '#ffffff',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: scale(12),
    marginBottom: scale(16),
  },
  passwordInput: {
    flex: 1,
    paddingVertical: scale(14),
    paddingHorizontal: scale(16),
    fontSize: scale(14),
    color: '#ffffff',
  },
  eyeButton: {
    padding: scale(10),
    paddingRight: scale(16),
  },
  loginButton: {
    backgroundColor: '#0095f6',
    paddingVertical: scale(12),
    borderRadius: scale(25),
    alignItems: 'center',
    marginTop: scale(8),
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: scale(14),
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: scale(16),
  },
  forgotPasswordText: {
    fontSize: scale(12),
    color: '#3797f0',
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  bottomContainer: {
    paddingBottom: scale(20),
    alignItems: 'center',
  },
  createAccountButton: {
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: scale(25),
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    width: '100%',
    alignItems: 'center',
    marginBottom: scale(24),
  },
  createAccountText: {
    color: '#3797f0',
    fontSize: scale(14),
    fontWeight: '600',
  },
  metaContainer: {
    alignItems: 'center',
  },
  metaText: {
    color: '#8e8e8e',
    fontSize: scale(13),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});