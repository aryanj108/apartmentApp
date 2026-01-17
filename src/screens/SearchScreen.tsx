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

import { apartmentsData } from '../data/apartments';
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

// Custom marker component
const CustomMarker = React.memo(({ apartment, matchScore, onPress }) => {
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
        latitude: apartment.latitude,
        longitude: apartment.longitude,
      }}
      onPress={() => onPress(apartment)}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={styles.markerContainer}>
        <PinIcon width={40} height={40} fill="#BF5700" />
      </View>
    </Marker>
  );
});

// Vertical Apartment Card Component
function ApartmentVerticalCard({ apartment, matchScore, onPress, isSaved }) {
  const hasImages = apartment.images && apartment.images.length > 0;
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.cardImageContainer}>
        {hasImages ? (
          <Image
            source={apartment.images[0]}
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
          {apartment.name}
        </Text>
        <Text style={styles.cardAddress} numberOfLines={1}>
          {apartment.address}
        </Text>

        <View style={styles.cardDetailsRow}>
          <View style={styles.leftDetails}>
            <View style={styles.cardDetailItem}>
              <BedIcon width={16} height={16} />
              <Text style={styles.cardDetailText}>{apartment.bedrooms} Bed</Text>
            </View>
            <View style={styles.cardDetailItem}>
              <BathIcon width={16} height={16} />
              <Text style={styles.cardDetailText}>{apartment.bathrooms} Bath</Text>
            </View>
            <View style={styles.cardDetailItem}>
              <DistanceIcon width={16} height={16} />
              <Text style={styles.cardDetailText}>{apartment.distance} mi</Text>
            </View>
          </View>
          <Text style={styles.cardPrice}>${apartment.price}/mo</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Search({ navigation }) {
  const { preferences, savedIds, toggleSave, loading: prefsLoading } = usePreferences();
  const [sortedApartments, setSortedApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(true);
  const mapRef = useRef(null);

  const allAmenities = ['wifi', 'gym', 'pool', 'parking', 'furnished', 'petFriendly'];
  const selectedAmenities = allAmenities.filter(amenity => preferences?.[amenity]);

  useEffect(() => {
    if (prefsLoading) return;
    
    setLoading(true);
    
    const apartmentsWithScores = apartmentsData.map(apartment => {
      const score = calculateMatchScore(
        apartment,
        preferences,
        selectedAmenities.map(id => ({ id, selected: true }))
      );
      return { ...apartment, matchScore: score };
    });

    const sorted = apartmentsWithScores.sort((a, b) => b.matchScore - a.matchScore);
    
    setSortedApartments(sorted);
    setLoading(false);
  }, [preferences, prefsLoading]);

  const handleCardPress = (apartment) => {
    navigation.navigate('RoomListingDetailsScreen_SearchVersion', {
      listing: apartment,
      matchScore: apartment.matchScore,
    });
  };

  const handleMarkerPress = (apartment) => {
    const apartmentWithScore = sortedApartments.find(apt => apt.id === apartment.id);
    handleCardPress(apartmentWithScore);
  };

  const handleResetMap = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(AUSTIN_REGION, 750);
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
          {sortedApartments.length} Listings • {showMap ? 'Map View' : 'List View'}
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
            initialRegion={AUSTIN_REGION}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {sortedApartments.map((apartment) => (
              <CustomMarker
                key={apartment.id}
                apartment={apartment}
                matchScore={apartment.matchScore}
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
          data={sortedApartments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ApartmentVerticalCard
              apartment={item}
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