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
  Keyboard,
  TouchableOpacity,
  Modal,
  Share,
  Linking,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import { resetUserOnboarding } from '../services/userService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

import Stars from '../../assets/stars.svg';
import InfoIcon from '../../assets/infoIcon.svg'

const ICON_SIZE = 20;

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function SettingsRow({
  icon,
  label,
  value,
  valueColor,
  onPress,
  showChevron = false,
  showArrow = false,
  danger = false,
  isLast = false,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
  showArrow?: boolean;
  danger?: boolean;
  isLast?: boolean;
}) {
  const Row = onPress ? TouchableOpacity : View;
  return (
    <>
      <Row
        style={styles.row}
        onPress={onPress}
        activeOpacity={0.6}
      >
        {icon && <View style={styles.rowIcon}>{icon}</View>}
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger, !icon && styles.rowLabelNoIcon]}>
          {label}
        </Text>
        <View style={styles.rowRight}>
          {value ? (
            <Text style={[styles.rowValue, valueColor ? { color: valueColor } : null]}>
              {value}
            </Text>
          ) : null}
          {showChevron && <Text style={styles.chevron}>›</Text>}
          {showArrow && <Text style={styles.externalArrow}>⎋</Text>}
        </View>
      </Row>
      {!isLast && <View style={styles.separator} />}
    </>
  );
}

function AppearancePicker({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}) {
  const options = [
    { label: 'Light', icon: '☀️' },
    { label: 'Dark', icon: '🌙' },
    { label: 'System', icon: '📱' },
  ];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <View style={styles.pickerBox}>
          {options.map((opt, i) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.pickerOption, i < options.length - 1 && styles.pickerOptionBorder]}
              onPress={() => { onSelect(opt.label); onClose(); }}
            >
              {current === opt.label && <Text style={styles.pickerCheck}>✓</Text>}
              <Text style={[styles.pickerOptionText, current === opt.label && styles.pickerOptionSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

export default function Profile({ navigation }: any) {
  const { user, signOut, sendVerificationEmail, reloadUser } = useAuth();
  const { preferences } = usePreferences();
  const [refreshing, setRefreshing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const scrollViewRef = useRef(null);

  // Appearance
  const [appearance, setAppearance] = useState('Light');
  const [showAppearancePicker, setShowAppearancePicker] = useState(false);

  // Location
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (preferences?.location) setSelectedLocation(preferences.location);
  }, [preferences]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchLocation(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const formatMemberSince = () => {
    try {
      if (!user?.metadata?.creationTime) return 'Recently';
      const date = new Date(user.metadata.creationTime);
      if (isNaN(date.getTime())) return 'Recently';
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch { return 'Recently'; }
  };

  const searchLocation = async (query: string) => {
    if (!query || query.length < 3) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const LOCATIONIQ_TOKEN = 'pk.e493efe80245c480f2ef5d41058283e2';
      const response = await fetch(
        `https://us1.locationiq.com/v1/search.php?key=${LOCATIONIQ_TOKEN}&q=${encodeURIComponent(query + ', Austin, TX')}&format=json&limit=5&countrycodes=us&viewbox=-97.9,30.5,-97.5,30.1&bounded=1`
      );
      if (!response.ok) { setSearchResults([]); return; }
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch { setSearchResults([]); }
    finally { setIsSearching(false); }
  };

  const selectLocation = async (location: any) => {
    const newLocation = {
      name: location.display_name.split(',')[0],
      lat: parseFloat(location.lat),
      lon: parseFloat(location.lon),
    };
    setSelectedLocation(newLocation);
    setSearchQuery('');
    setShowResults(false);
    setIsEditingLocation(false);
    Keyboard.dismiss();
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { 'preferences.location': newLocation });
        Alert.alert('Success', 'Location updated successfully');
      } catch { Alert.alert('Error', 'Failed to save location'); }
    }
  };

  const resetToDefaultLocation = async () => {
    const defaultLocation = { name: 'University of Texas at Austin', lat: 30.285340698031447, lon: -97.73208396036748 };
    setSelectedLocation(defaultLocation);
    setSearchQuery('');
    setIsEditingLocation(false);
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { 'preferences.location': defaultLocation });
        Alert.alert('Success', 'Location reset to UT Austin');
      } catch { Alert.alert('Error', 'Failed to reset location'); }
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { try { await signOut(); } catch { Alert.alert('Error', 'Failed to sign out.'); } } },
    ]);
  };

  const handleResendVerification = async () => {
    try {
      setSendingEmail(true);
      await sendVerificationEmail();
      Alert.alert('Email Sent!', `A verification email has been sent to ${user?.email}.`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification email');
    } finally { setSendingEmail(false); }
  };

  const handleRefreshStatus = async () => {
    try {
      setRefreshing(true);
      await reloadUser();
      Alert.alert(user?.emailVerified ? 'Verified!' : 'Not Verified Yet',
        user?.emailVerified ? 'Your email has been verified! ✓' : 'Please check your email and click the verification link.');
    } catch { Alert.alert('Error', 'Failed to refresh status'); }
    finally { setRefreshing(false); }
  };

  const handleRedoPreferences = () => {
    Alert.alert('Redo Preferences', 'This will take you through the preferences and swiping flow again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', onPress: async () => {
        try {
          if (user?.uid) { await resetUserOnboarding(user.uid); navigation.navigate('Preferences', { isRedo: true }); }
        } catch { Alert.alert('Error', 'Failed to reset preferences.'); }
      }},
    ]);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: 'Check out Longhorn Living — the best apartment finder for UT Austin students!' });
    } catch {}
  };

  const Icon = () => <Stars width={ICON_SIZE} height={ICON_SIZE} fill="#BF5700" />;

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Page Title ── */}
      <Text style={styles.pageTitle}>Settings</Text>

      {/* ── Profile Header ── */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.profileSub}>Member since {formatMemberSince()}</Text>
        </View>
      </View>

      {/* ── Email Verification Banner ── */}
      {!user?.emailVerified && (
        <View style={styles.verificationBanner}>
          <Text style={styles.verificationTitle}>⚠️ Email Not Verified</Text>
          <Text style={styles.verificationSub}>Please verify your email to access all features</Text>
          <View style={styles.verificationButtons}>
            <TouchableOpacity style={styles.verificationBtn} onPress={handleResendVerification} disabled={sendingEmail}>
              {sendingEmail ? <ActivityIndicator size="small" color="#BF5700" /> : <Text style={styles.verificationBtnText}>Resend Email</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.verificationBtn} onPress={handleRefreshStatus} disabled={refreshing}>
              {refreshing ? <ActivityIndicator size="small" color="#BF5700" /> : <Text style={styles.verificationBtnText}>Check Status</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── DISPLAY ── */}
      <SectionLabel title="Display" />
      <SettingsCard>
        <SettingsRow
          //icon={<Icon />}
          label="Appearance"
          value={appearance}
          onPress={() => setShowAppearancePicker(true)}
          showChevron
          isLast
        />
      </SettingsCard>
      <Text style={styles.cardNote}>Toggle between light and dark modes.</Text>

      {/* ── ACCOUNT ── */}
      <SectionLabel title="Account" />
      <SettingsCard>
        <SettingsRow
          //icon={<Icon />}
          label="Email"
          value={user?.email || ''}
          isLast={false}
        />
        <SettingsRow
          //icon={<Icon />}
          label="Email Verified"
          value={user?.emailVerified ? '✓ Verified' : 'Not yet'}
          valueColor={user?.emailVerified ? '#10b981' : '#f59e0b'}
          isLast
        />
      </SettingsCard>

      {/* ── LOCATION ── */}
      <SectionLabel title="Location" />
      <SettingsCard>
        <SettingsRow
          //icon={<Icon />}
          label="Current Location"
          value={selectedLocation?.name || 'UT Austin (Default)'}
          onPress={() => setIsEditingLocation(!isEditingLocation)}
          showChevron
          isLast={!isEditingLocation}
        />
        {isEditingLocation && (
          <>
            <View style={styles.separator} />
            <View style={styles.locationSearchRow}>
              <TextInput
                style={styles.locationInput}
                placeholder="Search for a location..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {isSearching && <ActivityIndicator size="small" color="#BF5700" />}
            </View>
            {showResults && searchResults.length > 0 && (
              <View>
                {searchResults.map((item: any, idx: number) => (
                  <React.Fragment key={item.place_id}>
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.locationResult} onPress={() => selectLocation(item)}>
                      <Text style={styles.locationResultText} numberOfLines={2}>{item.display_name}</Text>
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
            )}
          </>
        )}
      </SettingsCard>

      <View style={styles.locationActions}>
        <TouchableOpacity style={styles.locationActionBtn} onPress={() => setIsEditingLocation(!isEditingLocation)}>
          <Text style={styles.locationActionText}>{isEditingLocation ? 'Cancel' : 'Update Location'}</Text>
        </TouchableOpacity>
        {selectedLocation && selectedLocation.name !== 'University of Texas at Austin' && (
          <TouchableOpacity style={styles.locationActionBtn} onPress={resetToDefaultLocation}>
            <Text style={styles.locationActionText}>Reset to UT</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.cardNote}>View and update your search location for nearby housing recommendations.</Text>

      {/* ── PREFERENCES ── */}
      <SectionLabel title="Preferences" />
      <SettingsCard>
        <SettingsRow
          //icon={<Icon />}
          label="Redo Preferences & Swiping"
          onPress={handleRedoPreferences}
          showChevron
          isLast
        />
      </SettingsCard>
      <Text style={styles.cardNote}>Update your housing preferences and go through the swiping experience again.</Text>

      {/* ── ABOUT ── */}
      <SectionLabel title="About" />
      <SettingsCard>
        <SettingsRow
          icon={<InfoIcon width={ICON_SIZE} height={ICON_SIZE} fill="#6b7280" />}
          label="Version"
          value="1.0.0"
          isLast={false}
        />
        <SettingsRow
          icon={<Icon />}
          label="Developer"
          value="Aryan Jalota"
          isLast
        />
      </SettingsCard>
      <Text style={styles.cardNote}>Made for college students, by college students.</Text>

      {/* ── SUPPORT ── */}
      <SectionLabel title="Support" />
      <SettingsCard>
        <SettingsRow
          icon={<Icon />}
          label="Contact Support"
          onPress={() => Linking.openURL('mailto:support@longhornliving.com')}
          showArrow
          isLast={false}
        />
        <SettingsRow
          icon={<Icon />}
          label="Rate Longhorn Living"
          onPress={() => Linking.openURL('https://apps.apple.com')}
          showArrow
          isLast={false}
        />
        <SettingsRow
          icon={<Icon />}
          label="Follow on Instagram"
          onPress={() => Linking.openURL('https://instagram.com')}
          showArrow
          isLast={false}
        />
        <SettingsRow
          icon={<Icon />}
          label="Share Longhorn Living"
          onPress={handleShare}
          showChevron
          isLast
        />
      </SettingsCard>

      {/* ── SIGN OUT ── */}
      <SectionLabel title="" />
      <SettingsCard>
        <SettingsRow
          label="Sign Out"
          onPress={handleSignOut}
          danger
          isLast
        />
      </SettingsCard>

      <Text style={styles.appVersion}>Longhorn Living v1.0</Text>

      {/* ── Appearance Picker Modal ── */}
      <AppearancePicker
        visible={showAppearancePicker}
        current={appearance}
        onSelect={setAppearance}
        onClose={() => setShowAppearancePicker(false)}
      />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f6',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },

  // Page title
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    marginBottom: 24,
  },

  // Profile header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#BF5700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 3,
  },
  profileSub: {
    fontSize: 13,
    color: '#6b7280',
  },

  // Verification banner
  verificationBanner: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  verificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  verificationSub: {
    fontSize: 13,
    color: '#92400e',
    marginBottom: 10,
  },
  verificationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  verificationBtn: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BF5700',
    minHeight: 36,
    justifyContent: 'center',
  },
  verificationBtnText: {
    color: '#BF5700',
    fontSize: 13,
    fontWeight: '600',
  },

  // Section label
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#929298',
    marginTop: 20,
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 6,
    marginLeft: 4,
    lineHeight: 16,
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    //backgroundColor: '#fff3ec',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontWeight: '400',
  },
  rowLabelNoIcon: {
    marginLeft: 0,
  },
  rowLabelDanger: {
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '500',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    fontSize: 14,
    color: '#6b7280',
    maxWidth: 160,
    textAlign: 'right',
  },
  chevron: {
    fontSize: 20,
    color: '#c7c7cc',
    marginLeft: 4,
    lineHeight: 22,
  },
  externalArrow: {
    fontSize: 14,
    color: '#c7c7cc',
    marginLeft: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
    marginLeft: 56,
  },

  // Location editing
  locationSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationResult: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationResultText: {
    fontSize: 14,
    color: '#000',
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  locationActionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationActionText: {
    color: '#BF5700',
    fontSize: 14,
    fontWeight: '600',
  },

  // Appearance picker
  pickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  pickerBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    width: 240,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  pickerOptionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  pickerCheck: {
    fontSize: 16,
    color: '#BF5700',
    marginRight: 12,
    width: 20,
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#000',
  },
  pickerOptionSelected: {
    color: '#BF5700',
    fontWeight: '600',
  },

  // App version
  appVersion: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 28,
  },
});