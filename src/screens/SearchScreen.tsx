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
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { buildingsData } from '../data/buildings';
import { listingsData } from '../data/listings';
import { usePreferences } from '../context/PreferencesContext';
import { calculateMatchScore } from '../data/matchingAlgorithm';
import BedIcon from '../../assets/bedIcon.svg';
import BathIcon from '../../assets/bathIcon.svg';
import DistanceIcon from '../../assets/distanceIcon(2).svg';
import Stars from '../../assets/stars.svg';
import SaveFilledIconHeart from '../../assets/heart.svg';
import PinIcon from '../../assets/pinIcon.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Austin, TX coordinates
const AUSTIN_REGION = {
  latitude: 30.2672,
  longitude: -97.7431,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

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
          <View style={styles.matchBadge}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Stars width={15} height={15} fill={'#ffffff'} />
              <Text style={styles.matchText}> {matchScore}%</Text>
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {listing.name}
        </Text>
        <Text style={styles.unitNumber}>
          Unit {listing.unitNumber} • {listing.floorPlan}
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
          <Text style={styles.cardPrice}>${listing.price}/mo</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Search({ navigation }) {
  const { preferences, savedIds, toggleSave, loading: prefsLoading } = usePreferences();
  const [sortedListings, setSortedListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const [initialMapRegion] = useState(AUSTIN_REGION);
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
        <Text style={styles.headerTitle}>Browse Listings</Text>
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
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
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
    fontWeight: 'bold',
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
});