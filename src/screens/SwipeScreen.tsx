import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import BedIcon from '../../assets/bedIcon.svg';
import DistanceIcon from '../../assets/distanceIcon(2).svg';
import BathIcon from '../../assets/bathIcon.svg';
import WifiIcon from '../../assets/wifiIcon.svg';
import GymIcon from '../../assets/gymIcon.svg';
import PoolIcon from '../../assets/poolIcon.svg';
import ParkingIcon from '../../assets/parkingIcon.svg';
import FurnishedIcon from '../../assets/furnishedIcon.svg';
import PetIcon from '../../assets/petIcon.svg';
import Stars from '../../assets/stars.svg';

import { buildingsData } from '../data/buildings';
import { listingsData } from '../data/listings';
import { usePreferences } from '../context/PreferencesContext';
import {
  calculateMatchScore,
} from '../data/matchingAlgorithm';

import SwipeCard from '../navigation/SwipeCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CARD_HEIGHT = SCREEN_HEIGHT * 0.85;
const CARD_WIDTH = SCREEN_WIDTH * 0.92;
const IMAGE_HEIGHT = CARD_HEIGHT * 0.55;
const INFO_HEIGHT = CARD_HEIGHT * 0.45;
const AMENITY_WIDTH = (CARD_WIDTH - 32 - 16) / 3;

const allAmenities = [
  { id: 'wifi', label: 'WiFi', icon: WifiIcon },
  { id: 'gym', label: 'Gym', icon: GymIcon },
  { id: 'pool', label: 'Pool', icon: PoolIcon },
  { id: 'parking', label: 'Parking', icon: ParkingIcon },
  { id: 'furnished', label: 'Furnished', icon: FurnishedIcon },
  { id: 'petFriendly', label: 'Pet Friendly', icon: PetIcon },
];

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
    };
  });
}

export default function SwipeScreen({ navigation }: any) {
  const { preferences } = usePreferences();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<any[]>([]);
  const [enrichedListings, setEnrichedListings] = useState<any[]>([]);

  useEffect(() => {
    const selected = allAmenities.map(amenity => ({
      ...amenity,
      selected: preferences[amenity.id] || false,
    }));
    setSelectedAmenities(selected);
  }, [preferences]);

  useEffect(() => {
    // Get all listings with building data combined
    const listings = getEnrichedListings();
    setEnrichedListings(listings);
  }, []);

  useEffect(() => {
    if (enrichedListings.length > 0 && currentIndex >= enrichedListings.length - 1) {
      // Navigate to MainTabs after finishing all listings
      setTimeout(() => {
        navigation.navigate('MainTabs');
      }, 500);
    }
  }, [currentIndex, enrichedListings.length]);

  const currentListing = enrichedListings[currentIndex];
  
  if (!currentListing) {
    return (
      <View style={styles.container}>
        <Text style={{ marginTop: 100, textAlign: 'center' }}>Loading next matches...</Text>
      </View>
    );
  }

  const matchScore = calculateMatchScore(currentListing, preferences, selectedAmenities);
  const matchColor = '#BF5700';

  const details = [
    {
      id: 'bath',
      label: `${currentListing.bathrooms} Bath${currentListing.bathrooms !== 1 ? 's' : ''}`,
      icon: BathIcon,
    },
    {
      id: 'bed',
      label: `${currentListing.bedrooms} Bed${currentListing.bedrooms !== 1 ? 's' : ''}`,
      icon: BedIcon,
    },
    {
      id: 'distance',
      label: `${currentListing.distance} Mi`,
      icon: DistanceIcon,
    },
  ];

  const listingAmenities = allAmenities.filter(amenity =>
    currentListing.amenities.includes(amenity.id)
  );

  return (
    <View style={styles.container}>
      {enrichedListings
        .slice(currentIndex, currentIndex + 2)
        .reverse()
        .map(listing => {
          const score = calculateMatchScore(listing, preferences, selectedAmenities);
          const color = '#BF5700';
          
          return (
            <SwipeCard
              key={listing.id}
              apartment={listing}
              navigation={navigation}
              matchScore={score}
              matchColor={color}
              onSwipeLeft={() => setCurrentIndex(i => i + 1)}
              onSwipeRight={() => setCurrentIndex(i => i + 1)}
            >
              <View style={styles.cardContent}>
                {/* Picture Section */}
                <View style={styles.pictureSection}>
                  <Image
                    source={listing.images[0]}
                    style={styles.apartmentImage}
                    resizeMode="cover"
                  />
                  {/* Match Badge updated with LinearGradient */}
                  <LinearGradient
                    colors={['#FF8C42', '#BF5700', '#994400']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.matchBadge} // Style remains the same for positioning
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Stars width={16} height={16} fill={'#fff'}/>
                      <Text style={styles.matchScoreText}>{score}%</Text>
                    </View>
                  </LinearGradient>
                </View>

                {/* Info Section with ScrollView */}
                <View style={styles.infoSection}>
                  <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    style={{ flex: 1 }}
                  >
                    {/* Title & Price */}
                    <View style={styles.infoHeader}>
                      <View style={styles.leftInfo}>
                        <Text style={styles.apartmentName} numberOfLines={1}>
                          {currentListing.name}
                        </Text>
                        <Text style={styles.unitNumber}>
                          Unit {currentListing.unitNumber} • {currentListing.floorPlan}
                        </Text>
                        <Text style={styles.address} numberOfLines={1}>
                          {currentListing.address}
                        </Text>
                      </View>
                      <Text style={styles.price}>${currentListing.price}/mo</Text>
                    </View>

                    {/* Details Chips (Bed, Bath, Distance) */}
                    <View style={styles.chipsContainer}>
                      {details.map(detail => (
                        <View key={detail.id} style={styles.chip}>
                          <detail.icon width={25} height={25} />
                          <Text style={styles.chipText}>{detail.label}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Amenities */}
                    {listingAmenities.length > 0 && (
                      <View style={styles.amenitiesContainer}>
                        {listingAmenities.map(amenity => (
                          <View key={amenity.id} style={styles.amenityChip}>
                            <amenity.icon width={18} height={18} />
                            <Text style={styles.amenityText}>{amenity.label}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </ScrollView>

                  {/* Buttons - Fixed at Bottom */}
                  <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() =>
                        navigation.navigate('ApartmentListingDetails', {
                          listing: currentListing,
                          matchScore,
                        })
                      }
                    >
                      <Text style={styles.buttonText}>Apartment Details</Text>
                    </TouchableOpacity>
                  
                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() =>
                        navigation.navigate('RoomListingDetailsScreen', {
                          listing: currentListing,
                          matchScore,
                        })
                      }
                    >
                      <Text style={styles.buttonText}>Room Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </SwipeCard>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  cardContent: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  pictureSection: {
    height: IMAGE_HEIGHT,
    width: '100%',
    position: 'relative',
  },
  apartmentImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  matchScoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  infoSection: {
    height: INFO_HEIGHT,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'column',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftInfo: {
    flex: 1,
    marginRight: 12,
  },
  apartmentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  unitNumber: {
    fontSize: 13,
    color: '#BF5700',
    fontWeight: '600',
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#BF5700',
  },
  chipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    width: '100%',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  chipText: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '700',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    width: AMENITY_WIDTH,
    justifyContent: 'center'
  },
  amenityText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopColor: '#f3f4f6',
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});