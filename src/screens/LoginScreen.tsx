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
import CancelIcon from '../../assets/cancel-svg.svg';
import CustomLoadingScreen from './CustomLoadingScreen';

const { width, height } = Dimensions.get('window');

// Scales any size value relative to a 375px baseline so layout stays
// proportional across different screen sizes
const scale = (size: number) => (width / 375) * size;

// Maps Firebase error codes to user-friendly messages so we never
// surface raw technical errors like "auth/invalid-credential" in the UI
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

// A text input with a floating label that animates up and shrinks when the
// field is focused or has a value — similar to Material Design's outlined input.
// Also supports an optional clear button and a show/hide password toggle.
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
  showClearButton = false,
  onClear,
}: any) => {
  const [isFocused, setIsFocused] = useState(false);

  // animatedValue drives both the label's font size and vertical position.
  // 0 = resting (full size, centered in the input), 1 = active (small, at the top).
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
    // Only animate back down if the field is empty — if it has a value,
    // the label should stay small so it doesn't cover the text
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  };

  // Interpolate font size and position from the animated value so the label
  // smoothly floats upward as the user focuses the input
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
      outputRange: [scale(16), scale(8)],
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

      {/* Clear button — only visible while the field is focused and has text */}
      {showClearButton && value.length > 0 && isFocused && (
        <Pressable
          style={styles.clearButton}
          onPress={onClear}
        >
          <CancelIcon width={22} height={22} fill="#8e8e8e" />
        </Pressable>
      )}

      {/* Show/hide password toggle for the password field */}
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

  // Single screen handles both login and sign-up — isSignUp toggles between the two modes
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // localLoading drives the loading screen overlay independently from AuthContext's
  // loading state so we can show it during the artificial 2s delay before auth fires
  const [localLoading, setLocalLoading] = useState(false);

  const { signInWithEmail, signUpWithEmail, sendVerificationEmail, loading, error, setError } = useAuth();

  const testLoading = () => {
    setLocalLoading(true);
    setTimeout(() => {
      setLocalLoading(false);
    }, 5000); // Shows loading for 5 seconds
  };

  console.log('Loading state:', loading);

  const handleConfirm = async () => {
    console.log('handleConfirm called, loading:', loading);
    try {
      setError(null);
      setLocalLoading(true);

      // Brief artificial delay so the loading screen is always visible long
      // enough for the user to register it — avoids a jarring instant transition
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Client-side validation before hitting Firebase — avoids unnecessary network calls
      if (!email.trim()) {
        Alert.alert('Error', 'Please enter your email address');
        setLocalLoading(false);
        return;
      }
      if (!email.includes('@')) {
        Alert.alert('Error', 'Please enter a valid email address');
        setLocalLoading(false);
        return;
      }
      if (!password) {
        Alert.alert('Error', 'Please enter your password');
        setLocalLoading(false);
        return;
      }
      if (password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        setLocalLoading(false);
        return;
      }

      if (isSignUp) {
        await signUpWithEmail(email, password);

        // Automatically send a verification email right after account creation
        try {
          await sendVerificationEmail();
          Alert.alert(
            'Account Created!',
            'A verification email has been sent to ' + email + '. Please check your inbox and verify your email.',
            [{ text: 'OK' }]
          );
        } catch (err) {
          // The account was created successfully even if the verification email fails
          Alert.alert('Account Created', 'Account created successfully!');
        }
      } else {
        await signInWithEmail(email, password);
      }

      // Navigation is handled automatically by AppNavigator watching auth state —
      // no manual navigation.navigate() call needed here
    } catch (err: any) {
      console.error('Auth error:', err);
      const friendlyMessage = getErrorMessage(err);
      Alert.alert(
        isSignUp ? 'Sign Up Failed' : 'Login Failed',
        friendlyMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setLocalLoading(false);
    }
  };

  console.log('Current localLoading value:', localLoading);

  return (
    <>
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

            <View style={styles.logoContainer}>
              <LoginLogo width={scale(200)} height={scale(200)}/>
            </View>

            <View style={styles.inputContainer}>
              <AnimatedInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
                showClearButton={true}
                onClear={() => setEmail('')}
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

              {/* Disabled while loading to prevent duplicate submissions */}
              <Pressable
                style={[styles.loginButton, localLoading && styles.buttonDisabled]}
                onPress={handleConfirm}
                disabled={localLoading}
              >
                {localLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText} allowFontScaling={false}>
                    {isSignUp ? 'Sign up' : 'Log in'}
                  </Text>
                )}
              </Pressable>

              {/* Only shown in login mode — sign-up flow doesn't need this */}
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

            {/* TEST BUTTON
            <Pressable
              style={styles.loginButton}
              onPress={testLoading}
            >
              <Text style={styles.loginButtonText}>🧪 Test Loading Screen (5s)</Text>
            </Pressable>*/}

            <View style={styles.spacer} />

            {/* Toggles between login and sign-up mode, clearing the form each time */}
            <View style={styles.bottomContainer}>
              <Pressable
                style={styles.createAccountButton}
                onPress={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setEmail('');
                  setPassword('');
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

      {/* Rendered outside KeyboardAvoidingView so it covers the full screen including
          the keyboard area — prevents the loading overlay from being pushed up */}
      <CustomLoadingScreen visible={localLoading} />
    </>
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
    color: '#ff9f5aea',
    fontSize: scale(14),
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  bottomContainer: {
    paddingBottom: scale(90),
    paddingHorizontal: scale(8),
    alignItems: 'center',
  },
  clearButton: {
    position: 'absolute',
    right: scale(16),
    top: scale(14),
    padding: scale(4),
  },
});