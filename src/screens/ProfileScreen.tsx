import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { resetUserOnboarding } from '../services/userService';

export default function Profile({ navigation }: any) {
  const { user, signOut, sendVerificationEmail, reloadUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const formatMemberSince = () => {
    try {
      if (!user?.metadata?.creationTime) {
        console.log('No creationTime found');
        return 'Recently';
      }
      
      console.log('Raw creationTime:', user.metadata.creationTime);
      
      const date = new Date(user.metadata.creationTime);
      console.log('Parsed date:', date);
      console.log('Date timestamp:', date.getTime());
      
      if (isNaN(date.getTime())) {
        console.log('Invalid date');
        return 'Recently';
      }
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      
      console.log('Formatted parts - Month:', month, 'Day:', day, 'Year:', year);
      
      const result = `${month} ${day}, ${year}`;
      console.log('Final result:', result);
      
      return result;
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Recently';
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
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
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleResendVerification = async () => {
    try {
      setSendingEmail(true);
      await sendVerificationEmail();
      Alert.alert(
        'Email Sent!',
        'A verification email has been sent to ' + user?.email + '. Please check your inbox and spam folder.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      setRefreshing(true);
      await reloadUser();
      if (user?.emailVerified) {
        Alert.alert('Verified!', 'Your email has been verified successfully! ✓');
      } else {
        Alert.alert('Not Verified Yet', 'Please check your email and click the verification link.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh status');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRedoPreferences = () => {
    Alert.alert(
      'Redo Preferences',
      'This will take you through the preferences and swiping flow again. Your current preferences will be updated.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              if (user?.uid) {
                // Reset onboarding status
                await resetUserOnboarding(user.uid);
                
                // Navigate to preferences with redo flag
                navigation.navigate('Preferences', { isRedo: true });
              }
            } catch (error) {
              console.error('Error resetting preferences:', error);
              Alert.alert('Error', 'Failed to reset preferences. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.emailText}>{user?.email}</Text>
          <Text style={styles.memberSince} numberOfLines={1} ellipsizeMode="clip">
            Member since {formatMemberSince()}
          </Text>
        </View>

        {/* Email Verification Alert */}
        {!user?.emailVerified && (
          <View style={styles.verificationAlert}>
            <Text style={styles.verificationAlertTitle}>⚠️ Email Not Verified</Text>
            <Text style={styles.verificationAlertText}>
              Please verify your email to access all features
            </Text>
            <View style={styles.verificationButtons}>
              <Pressable
                style={styles.verificationButton}
                onPress={handleResendVerification}
                disabled={sendingEmail}
              >
                {sendingEmail ? (
                  <ActivityIndicator size="small" color="#BF5700" />
                ) : (
                  <Text style={styles.verificationButtonText}>Resend Email</Text>
                )}
              </Pressable>
              <Pressable
                style={styles.verificationButton}
                onPress={handleRefreshStatus}
                disabled={refreshing}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#BF5700" />
                ) : (
                  <Text style={styles.verificationButtonText}>Check Status</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={[styles.infoRow, styles.borderTop]}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {user?.uid?.substring(0, 16)}...
              </Text>
            </View>
            <View style={[styles.infoRow, styles.borderTop]}>
              <Text style={styles.infoLabel}>Email Verified</Text>
              <Text style={[
                styles.infoValue, 
                user?.emailVerified ? styles.verified : styles.notVerified
              ]}>
                {user?.emailVerified ? 'Yes ✓' : 'Not yet'}
              </Text>
            </View>
          </View>
        </View>

        {/* Preferences Section - NEW */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <Pressable 
            style={styles.redoPreferencesButton}
            onPress={handleRedoPreferences}
          >
            <Text style={styles.redoPreferencesText}>🔄 Redo Preferences & Swiping</Text>
          </Pressable>
          
          <Text style={styles.redoDescription}>
            Update your housing preferences and go through the swiping experience again
          </Text>
        </View>

        {/* Sign Out Button */}
        <Pressable 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        {/* App Info */}
        <Text style={styles.appVersion}>Longhorn Living v1.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#BF5700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  emailText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#6b7280',
    width: '100%',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  verificationAlert: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  verificationAlertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  verificationAlertText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 12,
  },
  verificationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  verificationButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BF5700',
    minHeight: 40,
    justifyContent: 'center',
  },
  verificationButtonText: {
    color: '#BF5700',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#000',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  verified: {
    color: '#10b981',
  },
  notVerified: {
    color: '#f59e0b',
  },
  // NEW STYLES FOR REDO PREFERENCES
  redoPreferencesButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BF5700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  redoPreferencesText: {
    color: '#BF5700',
    fontSize: 16,
    fontWeight: '600',
  },
  redoDescription: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appVersion: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 24,
  },
});