import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';

import { buildingsData } from '../data/buildings';
import { listingsData } from '../data/listings';
import { usePreferences } from '../context/PreferencesContext';
import { calculateMatchScore } from '../data/matchingAlgorithm';
import BedIcon from '../../assets/bedIcon.svg';
import BathIcon from '../../assets/bathIcon.svg';
import DistanceIcon from '../../assets/distanceIcon(2).svg';
import Stars from '../../assets/stars.svg';
import SaveFilledIconHeart from '../../assets/heart.svg';
import PinIcon from '../../assets/pinIcon2.svg';
import SearchIcon from '../../assets/searchIcon.svg'; 

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Austin, TX coordinates
const AUSTIN_REGION = {
  latitude: 30.2672,
  longitude: -97.7431,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

// Helper function to format price with commas
function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Helper function to combine listing with building data
function getEnrichedListings() {
  return listingsData.map(listing => {
    const building = buildingsData.find(b => b.id === listing.buildingId);
    return {
      ...listing,
      name: building?.name || 'Unknown',
      address: building?.address || 'Unknown Address',
      distance: building?.distance || 0,
      amenities: building?.amenities || [],
      images: building?.images || [],
      description: building?.description || '',
      features: building?.features || [],
      reviews: building?.reviews || [],
      contact: building?.contact || {},
      website: building?.website || '',
      latitude: building?.latitude,
      longitude: building?.longitude,
      
    };
  });
}

// Custom marker component - shows building pins
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

// Vertical Listing Card Component
function ListingVerticalCard({ listing, matchScore, onPress, isSaved }) {
  const hasImages = listing.images && listing.images.length > 0;
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
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
            <SaveFilledIconHeart width={25} height={25} fill="#BF5700" />
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
        <Text style={styles.cardTitle} numberOfLines={1}>
          {listing.name}
        </Text>
        <Text style={styles.unitNumber}>
          {listing.unitNumber} • {listing.floorPlan}
        </Text>
        <Text style={styles.cardAddress} numberOfLines={1}>
          {listing.address}
        </Text>

        <View style={styles.cardDetailsRow}>
          <View style={styles.leftDetails}>
            <View style={styles.cardDetailItem}>
              <BedIcon width={16} height={16} />
              <Text style={styles.cardDetailText}>{listing.bedrooms} Bed</Text>
            </View>
            <View style={styles.cardDetailItem}>
              <BathIcon width={16} height={16} />
              <Text style={styles.cardDetailText}>{listing.bathrooms} Bath</Text>
            </View>
            <View style={styles.cardDetailItem}>
              <DistanceIcon width={16} height={16} />
              <Text style={styles.cardDetailText}>{listing.distance} mi</Text>
            </View>
          </View>
          <Text style={styles.cardPrice}>${formatPrice(listing.price)}/mo</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Search Modal Component
function SearchModal({ visible, onClose, buildings, onSelectBuilding }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBuildings, setFilteredBuildings] = useState([]);

useEffect(() => {
  if (searchQuery.trim() === '') {
    setFilteredBuildings([]);
  } else {
    const query = searchQuery.toLowerCase();
    const filtered = buildings.filter(building =>
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Search Apartments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchInputContainer}>
            <SearchIcon width={25} height={25}/>
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
                <Text style={styles.clearButton}>✕</Text>
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
                <Text style={styles.searchResultArrow}>→</Text>
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
        </View>
      </View>
    </Modal>
  );
}

export default function Search({ navigation }) {
  const { preferences, savedIds, toggleSave, loading: prefsLoading } = usePreferences();
  const [sortedListings, setSortedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [initialMapRegion] = useState(AUSTIN_REGION);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const mapRef = useRef(null);

  const allAmenities = ['wifi', 'gym', 'pool', 'parking', 'furnished', 'petFriendly'];
  const selectedAmenities = allAmenities.filter(amenity => preferences?.[amenity]);

  useEffect(() => {
    if (prefsLoading) return;
    
    setLoading(true);
    
    // Get enriched listings
    const enrichedListings = getEnrichedListings();
    
    // Calculate match scores and sort
    const listingsWithScores = enrichedListings.map(listing => {
      const score = calculateMatchScore(
        listing,
        preferences,
        selectedAmenities.map(id => ({ id, selected: true }))
      );
      return { ...listing, matchScore: score };
    });

    const sorted = listingsWithScores.sort((a, b) => b.matchScore - a.matchScore);
    
    setSortedListings(sorted);
    setLoading(false);
  }, [preferences, prefsLoading]);

  const handleCardPress = (listing) => {
    // List view: go to individual unit details first
    navigation.navigate('RoomListingDetailsScreen_SearchVersion', {
      listing: listing,
      matchScore: listing.matchScore,
    });
  };

  const handleMarkerPress = (building) => {
    // Map view: go directly to building with all units
    navigation.navigate('ApartmentListingDetails', {
      listing: building,
    });
  };

  const handleSearchSelect = (building) => {
    // Same as clicking a pin on the map
    navigation.navigate('ApartmentListingDetails', {
      listing: building,
    });
  };

  const handleResetMap = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(initialMapRegion, 750);
    }
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
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Browse Listings</Text>
          <TouchableOpacity 
            style={styles.searchIconButton}
            onPress={() => setSearchModalVisible(true)}
          >
            <SearchIcon width={40} height={40}/>
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
            {buildingsData.map((building) => (
              <CustomMarker
                key={building.id}
                building={building}
                onPress={handleMarkerPress}
              />
            ))}
          </MapView>
          
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={handleResetMap}
          >
            <Text style={styles.resetButtonText}>⟲ Reset View</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
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
          contentContainerStyle={styles.listContainer}
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
    backgroundColor: '#ffffff',
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
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
    left: 0,
    padding: 4,
    marginTop: 5,
    top: 0
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 25,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
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
    bottom: 20,
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
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
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
  },
  cardTitle: {
    fontSize: 23,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  unitNumber: {
    fontSize: 12,
    color: '#BF5700',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 14,
    color: '#6b7280',
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
    color: '#374151',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '300',
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
    marginLeft: 12,
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
    fontSize: 14,
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
});