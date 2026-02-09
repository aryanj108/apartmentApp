import React, { useState, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import EyeOffOutline from '../../assets/eye-off-outline.svg';
import EyeOpenOutline from '../../assets/eye-open.svg';
import LoginLogo from '../../assets/loginLogo.svg'; 

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

// Animated Input Component
const AnimatedInput = ({ 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry, 
  autoCapitalize = 'none',
  keyboardType = 'default',
  autoComplete,
  showPasswordToggle = false,
  showPassword,
  onTogglePassword,
}: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  const labelStyle = {
    position: 'absolute' as 'absolute',
    left: scale(16),
    color: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#8e8e8e', '#8e8e8e'],
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [scale(14), scale(11)],
    }),
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [scale(14), scale(8)],
    }),
  };

  return (
    <View style={styles.inputWrapper}>
      <Animated.Text style={labelStyle}>
        {placeholder}
      </Animated.Text>
      <TextInput
        style={[
          styles.input,
          (isFocused || value) && styles.inputWithLabel,
          isFocused && styles.inputFocused,
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoComplete={autoComplete}
      />
      {showPasswordToggle && (
        <Pressable 
          style={styles.eyeButton}
          onPress={onTogglePassword}
        >
          {showPassword ? (
            <EyeOffOutline width={22} height={22} fill="#8e8e8e" />
          ) : (
            <EyeOpenOutline width={22} height={22} fill="#8e8e8e" />
          )}
        </Pressable>
      )}
    </View>
  );
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
        colors={['#1a1a1a', '#2d1810', '#BF5700']}
        style={styles.gradient}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
      >
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <LoginLogo width={scale(200)} height={scale(200)}/>
          </View>

          {/* Input Fields */}
          <View style={styles.inputContainer}>
            <AnimatedInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
            />

            <AnimatedInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete={isSignUp ? 'password-new' : 'password'}
              showPasswordToggle={true}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

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

          {/* Spacer */}
          <View style={styles.spacer} />

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
  container: {
    flex: 1,
    paddingHorizontal: scale(16),
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
  inputWrapper: {
    position: 'relative',
    marginBottom: scale(12),
  },
  input: {
    backgroundColor: 'rgba(28, 28, 30, 0.4)',
    borderWidth: 1,
    borderColor: '#3a3a3c',
    borderRadius: scale(12),
    paddingTop: scale(22),
    paddingBottom: scale(8),
    paddingHorizontal: scale(16),
    fontSize: scale(14),
    color: '#ffffff',
  },
  inputWithLabel: {
    paddingTop: scale(22),
  },
  inputFocused: { 
    borderColor: '#cccccc',
  },
  eyeButton: {
    position: 'absolute',
    right: scale(16),
    top: scale(14),
    padding: scale(4),
  },
  loginButton: {
    backgroundColor: '#BF5700',
    paddingVertical: scale(12),
    borderRadius: scale(25),
    alignItems: 'center',
    marginTop: scale(16),
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
    color: '#ff9f5a',
    fontWeight: '500',
  },
  createAccountButton: {
    borderWidth: 1,
    borderColor: 'rgba(191, 87, 0, 0.5)',
    backgroundColor: 'transparent',
    borderRadius: scale(25),
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    width: '100%',
    alignItems: 'center',
    marginTop: scale(20),
  },
  createAccountText: {
    color: '#ff9f5a',
    fontSize: scale(14),
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  bottomContainer: {
  paddingBottom: scale(90),
  paddingHorizontal: scale(8),
  alignItems: 'center',
},
});