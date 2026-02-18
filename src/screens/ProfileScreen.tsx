import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  FlatList,
  Keyboard
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { resetUserOnboarding } from '../services/userService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export default function Profile({ navigation }: any) {
  const { user, signOut, sendVerificationEmail, reloadUser } = useAuth();
  const { preferences } = usePreferences();
  const [refreshing, setRefreshing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e) => {
      if (navigation.isFocused()) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    });

    return unsubscribe;
  }, [navigation]);
  
  // Location state
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Load saved location on mount
  useEffect(() => {
    if (preferences?.location) {
      setSelectedLocation(preferences.location);
    }
  }, [preferences]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocation(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const LOCATIONIQ_TOKEN = 'pk.e493efe80245c480f2ef5d41058283e2'; 
      
      const response = await fetch(
        `https://us1.locationiq.com/v1/search.php?` +
        `key=${LOCATIONIQ_TOKEN}&` +
        `q=${encodeURIComponent(query + ', Austin, TX')}&` +
        `format=json&` +
        `limit=5&` +
        `countrycodes=us&` +
        `viewbox=-97.9,30.5,-97.5,30.1&` +
        `bounded=1`
      );
      
      if (!response.ok) {
        console.error('LocationIQ API error:', response.status);
        setSearchResults([]);
        return;
      }

      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = async (location) => {
    const newLocation = {
      name: location.display_name.split(',')[0],
      lat: parseFloat(location.lat),
      lon: parseFloat(location.lon)
    };
    
    setSelectedLocation(newLocation);
    setSearchQuery('');
    setShowResults(false);
    setIsEditingLocation(false);
    Keyboard.dismiss();
    
    // Save to Firebase
    if (user?.uid) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          'preferences.location': newLocation
        });
        Alert.alert('Success', 'Location updated successfully');
      } catch (error) {
        console.error('Error saving location:', error);
        Alert.alert('Error', 'Failed to save location');
      }
    }
  };

  const resetToDefaultLocation = async () => {
    const defaultLocation = {
      name: 'University of Texas at Austin',
      lat: 30.285340698031447,
      lon: -97.73208396036748
    };
    
    setSelectedLocation(defaultLocation);
    setSearchQuery('');
    setIsEditingLocation(false);
    
    // Save to Firebase
    if (user?.uid) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          'preferences.location': defaultLocation
        });
        Alert.alert('Success', 'Location reset to UT Austin');
      } catch (error) {
        console.error('Error resetting location:', error);
        Alert.alert('Error', 'Failed to reset location');
      }
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
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container} 
      keyboardShouldPersistTaps="handled">
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
                {user?.emailVerified ? '✓' : 'Not yet'}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Settings</Text>
          
          <View style={styles.infoCard}>
            <Pressable 
              style={styles.infoRow}
              onPress={() => Alert.alert('Current Location', selectedLocation?.name || 'University of Texas at Austin')}
            >
              <Text style={styles.infoLabel}>Current Location</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {selectedLocation?.name || 'UT Austin (Default)'}
              </Text>
            </Pressable>
            
            {isEditingLocation && (
              <>
                <View style={[styles.infoRow, styles.borderTop]}>
                  <TextInput
                    style={styles.locationSearchInput}
                    placeholder="Search for a location..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus={true}
                  />
                  {isSearching && (
                    <ActivityIndicator size="small" color="#BF5700" />
                  )}
                </View>
                
                {showResults && searchResults.length > 0 && (
                  <View style={styles.searchResultsContainer}>
                    <FlatList
                      data={searchResults}
                      keyExtractor={(item) => item.place_id.toString()}
                      scrollEnabled={false}
                      renderItem={({ item }) => (
                        <Pressable
                          style={styles.searchResultItem}
                          onPress={() => selectLocation(item)}
                        >
                          <Text style={styles.searchResultText} numberOfLines={2}>
                            {item.display_name}
                          </Text>
                        </Pressable>
                      )}
                    />
                  </View>
                )}
              </>
            )}
          </View>
          
          <View style={styles.locationButtonsContainer}>
            <Pressable
              style={styles.locationButton}
              onPress={() => setIsEditingLocation(!isEditingLocation)}
            >
              <Text style={styles.locationButtonText}>
                {isEditingLocation ? 'Cancel' : 'Update Location'}
              </Text>
            </Pressable>
            
            {selectedLocation && selectedLocation.name !== 'University of Texas at Austin' && (
              <Pressable
                style={[styles.locationButton, styles.resetButton]}
                onPress={resetToDefaultLocation}
              >
                <Text style={styles.locationButtonText}>Reset to UT</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <Pressable 
            style={styles.redoPreferencesButton}
            onPress={handleRedoPreferences}
          >
            <Text style={styles.redoPreferencesText}>Redo Preferences & Swiping</Text>
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
    paddingBottom: 120
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
    paddingVertical: 10,
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
    paddingLeft: 24,

  },
  verified: {
    color: '#10b981',
  },
  notVerified: {
    color: '#f59e0b',
  },
  locationSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  searchResultsContainer: {
    marginTop: 8,
    maxHeight: 150,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchResultText: {
    fontSize: 14,
    color: '#000',
  },
  locationButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  locationButton: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resetButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationButtonText: {
    color: '#BF5700',
    fontSize: 14,
    fontWeight: '600',
  },
  redoPreferencesButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16, 
    borderRadius: 12,
    alignItems: 'flex-start',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  redoPreferencesText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
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