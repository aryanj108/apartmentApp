import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// Linear scale function that maps sizes designed for a 375pt wide screen
// (iPhone SE/14) proportionally to the actual device width. Keeps typography
// and spacing consistent across screen sizes without hardcoding per-device values.
const scale = (size: number) => (width / 375) * size;

export default function VerifyEmailScreen() {
  const { user, signOut, sendVerificationEmail, reloadUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Calls sendVerificationEmail from AuthContext, which delegates to Firebase.
  // Separate loading state (sendingEmail) so this button can show its own
  // spinner without blocking the "I've Verified" button.
  const handleResendVerification = async () => {
    try {
      setSendingEmail(true);
      await sendVerificationEmail();
      Alert.alert(
        'Email Sent!',
        'A new verification email has been sent to ' +
          user?.email +
          '. Please check your inbox and spam folder.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Calls reloadUser() to force Firebase to re-fetch the User object from the
  // server — necessary because emailVerified is cached locally and won't flip
  // to true on its own after the user clicks the link.
  // If verification is confirmed, AppNavigator picks it up automatically via
  // onAuthStateChanged and routes to the next screen without any manual navigation here.
  const handleCheckStatus = async () => {
    try {
      setRefreshing(true);
      await reloadUser();

      // After reloading, check if verified.
      // The AppNavigator will automatically navigate to the app if verified.
      if (!user?.emailVerified) {
        Alert.alert(
          'Not Verified Yet',
          'Please check your email and click the verification link. It may take a minute to update.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check verification status');
    } finally {
      setRefreshing(false);
    }
  };

  // Confirmation alert before signing out so the user doesn't accidentally
  // lose their session. Uses the 'destructive' style on iOS to render the
  // confirm button in red, signaling it's a consequential action.
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📧</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Verify Your Email</Text>

        {/* Email Display */}
        <Text style={styles.email}>{user?.email}</Text>

        {/* Message */}
        <Text style={styles.message}>
          We sent a verification link to your email address. Please click the
          link to verify your account and access the app.
        </Text>

        {/* Instructions */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>Next Steps:</Text>
          <Text style={styles.instruction}>1. Check your inbox and spam folder</Text>
          <Text style={styles.instruction}>2. Click the verification link</Text>
          <Text style={styles.instruction}>3. Return here and tap "I've Verified"</Text>
        </View>

        {/* Primary action — triggers the reload check. Shows a spinner while
            the Firebase fetch is in flight so the user knows something is happening. */}
        <Pressable
          style={[styles.button, styles.primaryButton]}
          onPress={handleCheckStatus}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>I've Verified My Email</Text>
          )}
        </Pressable>

        {/* Secondary action — resends the email. Independently disabled while
            the send request is in flight to prevent duplicate sends. */}
        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={handleResendVerification}
          disabled={sendingEmail}
        >
          {sendingEmail ? (
            <ActivityIndicator color="#BF5700" />
          ) : (
            <Text style={styles.secondaryButtonText}>Resend Verification Email</Text>
          )}
        </Pressable>

        {/* Sign Out Link */}
        <Pressable style={styles.signOutLink} onPress={handleSignOut}>
          <Text style={styles.signOutLinkText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: scale(24),
    paddingTop: scale(80),
    alignItems: 'center',
  },
  iconContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: scale(24),
  },
  icon: {
    fontSize: scale(50),
  },
  title: {
    fontSize: scale(28),
    fontWeight: '700',
    color: '#000',
    marginBottom: scale(12),
    textAlign: 'center',
  },
  email: {
    fontSize: scale(16),
    color: '#BF5700',
    fontWeight: '600',
    marginBottom: scale(16),
    textAlign: 'center',
  },
  message: {
    fontSize: scale(15),
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: scale(22),
    marginBottom: scale(32),
  },
  instructionsBox: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: scale(12),
    padding: scale(20),
    marginBottom: scale(32),
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  instructionsTitle: {
    fontSize: scale(16),
    fontWeight: '600',
    color: '#000',
    marginBottom: scale(12),
  },
  instruction: {
    fontSize: scale(14),
    color: '#374151',
    marginBottom: scale(8),
    lineHeight: scale(20),
  },
  button: {
    width: '100%',
    paddingVertical: scale(16),
    borderRadius: scale(12),
    alignItems: 'center',
    marginBottom: scale(12),
  },
  primaryButton: {
    backgroundColor: '#BF5700',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#BF5700',
  },
  buttonText: {
    color: '#fff',
    fontSize: scale(16),
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#BF5700',
    fontSize: scale(16),
    fontWeight: '600',
  },
  signOutLink: {
    marginTop: scale(24),
  },
  signOutLinkText: {
    fontSize: scale(14),
    color: '#6b7280',
    fontWeight: '500',
  },
});