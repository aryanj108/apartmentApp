import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { BlurView } from 'expo-blur';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Switch,
  Modal,
  TextInput,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { calculateDistance } from '../navigation/locationUtils';
import { buildingsData } from '../data/buildings';
import { listingsData } from '../data/listings';
import { usePreferences } from '../context/PreferencesContext';
import { calculateMatchScore } from '../data/matchingAlgorithm';
import { useRoute } from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';

import BedIcon from '../../assets/bedFilledIcon.svg';
import BathIcon from '../../assets/bathFilledIcon.svg';
import DistanceIcon from '../../assets/arrowFilledIcon.svg';
import Stars from '../../assets/stars.svg';
import SaveFilledIconHeart from '../../assets/heart.svg';
import PinIcon from '../../assets/pinIcon2.svg';
import SearchIcon from '../../assets/searchIcon.svg';
import ResetIcon from '../../assets/resetIcon.svg';
import CancelIcon from '../../assets/cancel-svg.svg';
import ApartmentIcon from '../../assets/arrowUp.svg';
import UTIcon from '../../assets/campusIcon.svg';
import PersonIcon from '../../assets/personIcon.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default map region centered on Austin, TX. Used as both the initial region
// and the target when the user hits the reset button.
const AUSTIN_REGION = {
  latitude: 30.2672,
  longitude: -97.7431,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

// Formats a price number into a comma-separated string (e.g. 1500 → "1,500").
function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Joins listing data with its parent building data, computing a live distance
// from the user's custom location if one is set in preferences. Falls back to
// the building's pre-set distance if no custom location is provided.
// This enriched shape is what all downstream components and the scoring
// algorithm expect to receive.
function getEnrichedListings(customLocation?: { lat: number; lon: number } | null) {
  return listingsData.map((listing) => {
    const building = buildingsData.find((b) => b.id === listing.buildingId);

    let calculatedDistance = building?.distance || 0;
    if (customLocation && building?.latitude && building?.longitude) {
      calculatedDistance = calculateDistance(
        customLocation.lat,
        customLocation.lon,
        building.latitude,
        building.longitude
      );
      // Round to 1 decimal place
      calculatedDistance = Math.round(calculatedDistance * 10) / 10;
    }

    return {
      ...listing,
      name: building?.name || 'Unknown',
      address: building?.address || 'Unknown Address',
      distance: calculatedDistance,
      amenities: building?.amenities || [],
      images: building?.images || [],
      description: listing.description || building?.description || '',
      features: listing.features || building?.features || [],
      reviews: building?.reviews || [],
      contact: building?.contact || {},
      leaseDetails: building?.leaseDetails || {},
      website: listing.website || building?.website || '',
      latitude: building?.latitude,
      longitude: building?.longitude,
    };
  });
}

// Wrapping Marker in React.memo prevents the entire map from re-rendering every
// marker whenever unrelated state changes. tracksViewChanges is set to false
// after 100ms — keeping it true indefinitely is a known performance issue on
// Android that causes markers to flicker and re-render continuously.
const CustomMarker = React.memo(({ building, onPress }) => {
  const [tracksViewChanges, setTracksViewChanges] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Marker
      coordinate={{
        latitude: building.latitude,
        longitude: building.longitude,
      }}
      onPress={() => onPress(building)}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={styles.markerContainer}>
        <PinIcon width={40} height={40} fill="#BF5700" />
      </View>
    </Marker>
  );
});

// Renders a single apartment listing card in the list view.
// The price text uses MaskedView + LinearGradient so the gradient shows through
// the text shape — the same technique used in the tab bar icons.
function ListingVerticalCard({ listing, matchScore, onPress, isSaved }) {
  const hasImages = listing.images && listing.images.length > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardImageContainer}>
        {hasImages ? (
          <Image
            source={listing.images[0]}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardImage, styles.placeholderImage]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {isSaved && (
          <View style={styles.saveBadge}>
            <MaskedView maskElement={<SaveFilledIconHeart width={25} height={25} fill="#000000" />}>
              <LinearGradient
                colors={['#FF8C42', '#BF5700', '#994400']}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                style={{ width: 25, height: 25 }}
              />
            </MaskedView>
          </View>
        )}

        {matchScore && (
          <LinearGradient
            colors={['#FF8C42', '#BF5700', '#994400']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.matchBadge}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Stars width={15} height={15} fill={'#ffffff'} />
              <Text style={styles.matchText}> {matchScore}%</Text>
            </View>
          </LinearGradient>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>
          {listing.unitNumber} {/*• {listing.floorPlan}*/}
        </Text>

        <Text style={styles.unitNumber} numberOfLines={1}>
          {listing.name}
        </Text>

        <Text style={styles.cardAddress} numberOfLines={1}>
          {listing.address}
        </Text>

        <View style={styles.cardDetailsRow}>
          <View style={styles.leftDetails}>
            <View style={styles.cardDetailItem}>
              <MaskedView maskElement={<BedIcon width={16} height={16} fill="#000000" />}>
                <LinearGradient
                  colors={['#FF8C42', '#BF5700', '#994400']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: 16, height: 16 }}
                />
              </MaskedView>
              <Text style={styles.cardDetailText}>{listing.bedrooms} Bed</Text>
            </View>
            <View style={styles.cardDetailItem}>
              <MaskedView maskElement={<BathIcon width={16} height={16} fill="#000000" />}>
                <LinearGradient
                  colors={['#FF8C42', '#BF5700', '#994400']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: 16, height: 16 }}
                />
              </MaskedView>
              <Text style={styles.cardDetailText}>{listing.bathrooms} Bath</Text>
            </View>
            <View style={styles.cardDetailItem}>
              <MaskedView maskElement={<DistanceIcon width={16} height={16} fill="#000000" />}>
                <LinearGradient
                  colors={['#FF8C42', '#BF5700', '#994400']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: 16, height: 16 }}
                />
              </MaskedView>
              <Text style={styles.cardDetailText}>{listing.distance} mi</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <MaskedView
              maskElement={
                <Text style={styles.cardPrice}>${formatPrice(listing.price)}</Text>
              }
            >
              <LinearGradient
                colors={['#FF8C42', '#BF5700', '#994400']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.cardPrice, { opacity: 0 }]}>
                  ${formatPrice(listing.price)}
                </Text>
              </LinearGradient>
            </MaskedView>
            <Text style={styles.perMonth}>per month</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Full-screen bottom sheet modal for searching apartments by name or address.
// Supports both keyboard search and a drag-to-dismiss gesture using PanResponder.
// Results are sorted so exact matches and prefix matches surface before
// substring matches, giving a more intuitive feel than a flat filter.
function SearchModal({ visible, onClose, buildings, onSelectBuilding }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBuildings, setFilteredBuildings] = useState([]);
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Fade the modal in when it becomes visible and reset opacity on close.
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      opacity.setValue(0);
    }
  }, [visible]);

  // PanResponder on the drag handle area. Only activates for downward drags
  // (dy > 5) so vertical scrolling inside the FlatList still works normally.
  // Dragging past 150px commits the dismiss animation; below that it springs back.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          const newOpacity = Math.max(0, 1 - gestureState.dy / 400);
          opacity.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: SCREEN_HEIGHT,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onClose();
          });
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 10,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 65,
              friction: 10,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Re-filter and re-sort results every time the query or building list changes.
  // Sorting priority: exact name match → name starts with query → address starts
  // with query → alphabetical. This keeps the most relevant result at the top.
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBuildings([]);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = buildings.filter(
        (building) =>
          building.name.toLowerCase().includes(query) ||
          building.address.toLowerCase().includes(query)
      );

      const sorted = filtered.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aAddress = a.address.toLowerCase();
        const bAddress = b.address.toLowerCase();

        if (aName === query) return -1;
        if (bName === query) return 1;

        if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
        if (bName.startsWith(query) && !aName.startsWith(query)) return 1;

        if (aAddress.startsWith(query) && !bAddress.startsWith(query)) return -1;
        if (bAddress.startsWith(query) && !aAddress.startsWith(query)) return 1;

        return aName.localeCompare(bName);
      });

      setFilteredBuildings(sorted);
    }
  }, [searchQuery, buildings]);

  const handleSelectBuilding = (building) => {
    setSearchQuery('');
    setFilteredBuildings([]);
    onSelectBuilding(building);
    onClose();
  };

  // Shared dismiss animation used by both backdrop tap and back button press.
  const dismissModal = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleBackdropPress = () => dismissModal();
  const handleBackButtonPress = () => dismissModal();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleBackButtonPress}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        {/* Tappable backdrop — pressing outside the sheet dismisses it */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleBackdropPress}
          style={StyleSheet.absoluteFill}
        >
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity },
            ]}
          />
        </TouchableOpacity>

        <Animated.View
          style={[styles.modalContent, { transform: [{ translateY }] }]}
        >
          {/* Drag handle area — PanResponder is attached here so it doesn't
              interfere with scrolling in the FlatList below */}
          <View {...panResponder.panHandlers} style={styles.dragArea}>
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Apartments</Text>
            </View>
          </View>

          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or address..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <CancelIcon width={22} height={22} fill="#6b7280" />
                {/*<Text style={styles.clearButton}>✕</Text>*/}
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredBuildings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.searchResultItem}
                onPress={() => handleSelectBuilding(item)}
              >
                <View style={styles.searchResultContent}>
                  <Text style={styles.searchResultName}>{item.name}</Text>
                  <Text style={styles.searchResultAddress}>{item.address}</Text>
                </View>
                <MaskedView maskElement={<ApartmentIcon width={24} height={24} fill="#000000" />}>
                  <LinearGradient
                    colors={['#FF8C42', '#BF5700', '#994400']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: 24, height: 24 }}
                  />
                </MaskedView>
                {/*<Text style={styles.searchResultArrow}>→</Text>*/}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              searchQuery.trim() !== '' ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No apartments found</Text>
                </View>
              ) : null
            }
            contentContainerStyle={styles.searchResultsList}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function Search({ navigation }) {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { preferences, savedIds, toggleSave, loading: prefsLoading } = usePreferences();
  const [sortedListings, setSortedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [initialMapRegion] = useState(AUSTIN_REGION);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const mapRef = useRef(null);

  // Build the selectedAmenities array from the user's boolean preference flags.
  // calculateMatchScore expects an array of { id, selected } objects, not raw booleans.
  const allAmenities = ['wifi', 'gym', 'pool', 'parking', 'furnished', 'petFriendly'];
  const selectedAmenities = allAmenities.filter((amenity) => preferences?.[amenity]);

  // Compute header and list padding dynamically based on safe area insets so the
  // UI respects the notch/status bar on all devices without hardcoding values.
  const headerPaddingTop = Platform.OS === 'ios' ? insets.top + 25 : insets.top || 25;
  const listPaddingTop = Platform.OS === 'ios' ? insets.top + 110 : (insets.top || 10) + 100;

  // Listens for a resetMap param passed from other screens (e.g. tapping the
  // Search tab from a detail screen). The timestamp param forces the effect to
  // re-run even if resetMap was already true from a previous navigation.
  useEffect(() => {
    if (route.params?.resetMap) {
      setShowMap(true);
      setTimeout(() => handleResetMap(), 100);
    }
  }, [route.params?.timestamp]);

  // Re-scores and re-sorts listings whenever preferences change. Using the
  // user's custom location for distance calculations if one has been set,
  // otherwise defaulting to UT Austin's coordinates.
  useEffect(() => {
    if (prefsLoading) return;

    setLoading(true);

    const userLoc = preferences.location || { lat: 30.2853, lon: -97.7320 };
    const enrichedListings = getEnrichedListings(userLoc);

    const listingsWithScores = enrichedListings.map((listing) => {
      const score = calculateMatchScore(
        listing,
        preferences,
        selectedAmenities.map((id) => ({ id, selected: true }))
      );
      return { ...listing, matchScore: score };
    });

    const sorted = listingsWithScores.sort((a, b) => b.matchScore - a.matchScore);

    setSortedListings(sorted);
    setLoading(false);
  }, [preferences, prefsLoading, preferences.location]);

  // Animates the map back to the default Austin region over 750ms.
  const handleResetMap = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(initialMapRegion, 750);
    }
  };

  // scrollViewRef gives us a handle to the FlatList so we can programmatically
  // scroll to the top when the tab is pressed while already on the list view.
  const scrollViewRef = useRef(null);

  // tabPress listener: resets the map if in map view, or scrolls to top if in
  // list view. Returns the unsubscribe function as the effect cleanup so the
  // listener is removed when the component unmounts or dependencies change.
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e) => {
      if (navigation.isFocused() && showMap) {
        handleResetMap();
      } else if (navigation.isFocused() && !showMap) {
        scrollViewRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
    });

    return unsubscribe;
  }, [navigation, showMap]);

  const handleCardPress = (listing) => {
    navigation.navigate('RoomListingDetailsScreen_SearchVersion', {
      listing: listing,
      matchScore: listing.matchScore,
    });
  };

  const handleMarkerPress = (building) => {
    navigation.navigate('ApartmentListingDetails', {
      listing: building,
    });
  };

  const handleSearchSelect = (building) => {
    navigation.navigate('ApartmentListingDetails', {
      listing: building,
    });
  };

  if (loading || prefsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#BF5700" />
        <Text style={styles.loadingText}>Loading apartments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Floating header — sits above both the map and list via absolute positioning.
          BlurView intensity is 0 in map view (fully transparent) and 80 in list view
          so the header reads clearly against the white list background. */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <BlurView
          intensity={showMap ? 0 : 80}
          tint="default"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerTitleRow}>
          {/* Reset Button on the Left */}
          {showMap && (
            <TouchableOpacity
              style={styles.resetButtonTopLeft}
              onPress={handleResetMap}
            >
              <ResetIcon width={26} height={20} fill="#000000" />
            </TouchableOpacity>
          )}

          <Text style={styles.headerTitle}>Browse Listings</Text>

          {/* Search Button on the Right */}
          <TouchableOpacity
            style={styles.searchIconButton}
            onPress={() => setSearchModalVisible(true)}
          >
            <SearchIcon width={40} height={40} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerBottom}>
          <Text style={styles.headerSubtitle}>
            {sortedListings.length} Listings • {showMap ? 'Map View' : 'List View'}
          </Text>
          <Switch
            value={showMap}
            onValueChange={setShowMap}
            trackColor={{ false: '#d1d5db', true: '#FDB863' }}
            thumbColor={showMap ? '#BF5700' : '#f3f4f6'}
            ios_backgroundColor="#d1d5db"
            style={styles.toggle}
          />
        </View>
      </View>

      {showMap ? (
        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialMapRegion}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {/* UT Campus Marker */}
            <Marker
              coordinate={{
                latitude: 30.285340698031447,
                longitude: -97.73208396036748,
              }}
            >
              <View style={styles.utMarkerContainer}>
                <UTIcon width={30} height={30} fill="#BF5700" />
              </View>
            </Marker>

            {/* User Location Marker — only shown if the user has set a custom location */}
            {preferences?.location && (
              <Marker
                coordinate={{
                  latitude: preferences.location.lat,
                  longitude: preferences.location.lon,
                }}
              >
                <View style={styles.personMarkerContainer}>
                  <PersonIcon width={50} height={30} fill="#000000" />
                </View>
              </Marker>
            )}

            {buildingsData.map((building) => (
              <CustomMarker
                key={building.id}
                building={building}
                onPress={handleMarkerPress}
              />
            ))}
          </MapView>

          {/*<TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetMap}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ResetIcon width={15} height={15} fill={'#ffffff'} />
              <Text style={styles.resetButtonText}>  Reset View</Text>
            </View>
          </TouchableOpacity>*/}
        </View>
      ) : (
        <FlatList
          ref={scrollViewRef}
          data={sortedListings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ListingVerticalCard
              listing={item}
              matchScore={item.matchScore}
              onPress={() => handleCardPress(item)}
              isSaved={savedIds.includes(item.id)}
            />
          )}
          contentContainerStyle={[styles.listContainer, { paddingTop: listPaddingTop }]}
          showsVerticalScrollIndicator={true}
        />
      )}

      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        buildings={buildingsData}
        onSelectBuilding={handleSearchSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbfbfb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  searchIconButton: {
    position: 'absolute',
    right: 30,
    top: 0,
    padding: 4,
    zIndex: 101,
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 25,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
    textAlign: 'center',
    marginRight: -5,
    marginLeft: 5,
  },
  toggle: {
    transform: [{ scale: 0.8 }],
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  resetButton: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    backgroundColor: '#BF5700',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  placeholderImage: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  saveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#BF5700',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  matchText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
    paddingBottom: 20,
  },
  perMonth: {
    fontSize: 11,
    color: '#8e8e91',
    fontWeight: '500',
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  unitNumber: {
    fontSize: 13,
    color: '#0a0a0a',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 11,
    color: '#8e8e91',
    marginBottom: 12,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  cardDetailText: {
    fontSize: 12,
    color: '#8e8e91',
    fontWeight: '600',
    marginLeft: 4,
  },
  cardPrice: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#BF5700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingTop: 8,
  },
  dragArea: {
    paddingBottom: 10,
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
  },
  modalHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    //paddingBottom: 16,
    //borderBottomWidth: 1,
    //borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  clearButton: {
    fontSize: 18,
    color: '#6b7280',
    paddingHorizontal: 8,
  },
  searchResultsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginTop: 8,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  searchResultAddress: {
    fontSize: 13,
    color: '#6b7280',
  },
  searchResultArrow: {
    fontSize: 24,
    color: '#BF5700',
    marginLeft: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  resetButtonTopLeft: {
    position: 'absolute',
    left: 30,
    padding: 10,
    zIndex: 101,
    top: 5,
  },
  utMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  personMarkerContainer: {
    alignItems: 'center',
  },
});