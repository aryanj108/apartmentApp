import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Linking,
  Platform
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
import { useAuth } from '../context/AuthContext';  
import { setUserOnboardingComplete } from '../services/userService'; 
import {
  calculateMatchScore,
} from '../data/matchingAlgorithm';
// Import the distance calculation utility
import { calculateDistance, filterApartmentsByDistance } from '../navigation/locationUtils';

import SwipeCard from '../navigation/SwipeCard';
import CustomLoadingScreen from './CustomLoadingScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CARD_HEIGHT = SCREEN_HEIGHT * 0.85;
const CARD_WIDTH = SCREEN_WIDTH * 0.92;
const IMAGE_HEIGHT = CARD_HEIGHT * 0.50;
const INFO_HEIGHT = CARD_HEIGHT * 0.50;
const AMENITY_WIDTH = (CARD_WIDTH - 32 - 16) / 3;

const allAmenities = [
  { id: 'wifi', label: 'WiFi', icon: WifiIcon },
  { id: 'gym', label: 'Gym', icon: GymIcon },
  { id: 'pool', label: 'Pool', icon: PoolIcon },
  { id: 'parking', label: 'Parking', icon: ParkingIcon },
  { id: 'furnished', label: 'Furnished', icon: FurnishedIcon },
  { id: 'petFriendly', label: 'Pet Friendly', icon: PetIcon },
];

function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Helper function to combine listing with building data
// NOW ACCEPTS CUSTOM LOCATION TO CALCULATE DISTANCES
function getEnrichedListings(customLocation?: {lat: number, lon: number} | null) {
  return listingsData.map(listing => {
    const building = buildingsData.find(b => b.id === listing.buildingId);
    
    // Calculate distance from custom location if provided
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

export default function SwipeScreen({ navigation, route }: any) {
  const { preferences } = usePreferences();
  const { user, setHasCompletedOnboarding } = useAuth();  
  
  const isRedoingPreferences = route?.params?.isRedo || false;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<any[]>([]);
  const [enrichedListings, setEnrichedListings] = useState<any[]>([]);
  const [minLoadingTime, setMinLoadingTime] = useState(true);

  // Helper funciton to open maps
  const openMaps = (destinationAddress: string) => {
    // Use custom location if set in preferences, otherwise default to UT Austin
    const destinationLatitude = preferences.location?.lat || 30.285340698031447;
    const destinationLongitude = preferences.location?.lon || -97.73208396036748;
    
    // Encode the apartment address for URL (this is now the ORIGIN)
    const encodedAddress = encodeURIComponent(destinationAddress);
    
    let url = '';
    
    if (Platform.OS === 'ios') {
      // Apple Maps URL scheme - swapped saddr and daddr
      url = `maps://app?saddr=${encodedAddress}&daddr=${destinationLatitude},${destinationLongitude}`;
      
      // Fallback to Google Maps on iOS if Apple Maps fails
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodedAddress}&destination=${destinationLatitude},${destinationLongitude}`;
      
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(googleMapsUrl);
        }
      }).catch(() => {
        Linking.openURL(googleMapsUrl);
      });
    } else {
      // Google Maps for Android - swapped origin and destination
      url = `https://www.google.com/maps/dir/?api=1&origin=${encodedAddress}&destination=${destinationLatitude},${destinationLongitude}`;
      
      Linking.openURL(url).catch(err => {
        Alert.alert('Error', 'Unable to open maps. Please make sure you have a maps app installed.');
        console.error('Error opening maps:', err);
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingTime(false);
    }, 2500); 

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const selected = allAmenities.map(amenity => ({
      ...amenity,
      selected: preferences[amenity.id] || false,
    }));
    setSelectedAmenities(selected);
  }, [preferences]);

  useEffect(() => {
    // Get all listings with building data combined and recalculated distances
    const listings = getEnrichedListings(preferences.location);
    setEnrichedListings(listings);
  }, [preferences.location]); // Re-run when location changes

  // Handle completing onboarding when all cards are swiped
  const handleFinishSwiping = async () => {
    try {
      // Only mark onboarding complete if this is NOT a redo
      if (user?.uid) {
        await setUserOnboardingComplete(user.uid);
        setHasCompletedOnboarding(true);

        if (isRedoingPreferences) {
        // If redoing, just go back to main tabs
        Alert.alert(
          'Preferences Updated',
          'Your housing preferences have been updated.',
          [
            {
              text: 'Return to Home',
              onPress: () => navigation.navigate('MainTabs')
            }
          ]
        );
      } else {                
        Alert.alert(
          'Setup Complete!',
          'Your preferences have been saved. You can now browse apartments.',
          [
            {
              text: 'Start Browsing',
              onPress: () => navigation.navigate('MainTabs')
            }
          ]
        );
        navigation.navigate('MainTabs');
      }
    }
    } catch (error) {
      console.error('Error completing swiping:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      // Still navigate even if there's an error
      navigation.navigate('MainTabs');
    }
  };

  // Call handleFinishSwiping instead of direct navigation
  useEffect(() => {
    if (enrichedListings.length > 0 && currentIndex >= enrichedListings.length - 1) {
      // Finished all listings - complete onboarding
      setTimeout(() => {
        handleFinishSwiping();
      }, 500);
    }
  }, [currentIndex, enrichedListings.length]);

  const currentListing = enrichedListings[currentIndex];
  
  if (!currentListing || minLoadingTime) {
      return <CustomLoadingScreen />;
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
      <View style={styles.headerRow}>
  <View style={styles.sideSpacer} />

  <View style={styles.headerCenter}>
    <Text style={styles.headerTitle}>Your Matches</Text>
    <Text style={styles.headerSubtitle}>
      {enrichedListings.length} Listings • Swipe Mode
    </Text>
  </View>

  <TouchableOpacity onPress={handleFinishSwiping}
    style={{ marginLeft: 'auto' }}>
    <Text style={styles.skipText}>Skip</Text>
  </TouchableOpacity>
</View>


      <View style={styles.cardStackContainer}>
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
                      style={styles.matchBadge}
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
                            {currentListing.unitNumber} {/*• {currentListing.floorPlan}*/}
                          </Text>
                          <Text style={styles.address} numberOfLines={1}>
                            {currentListing.address}
                          </Text>
                        </View>
                        <View style={styles.priceContainer}>
                          <Text style={styles.price}>${formatPrice(currentListing.price)}</Text>
                          <Text style={styles.perMonth}>per month</Text>
                        </View>
                      </View>

                      {/* Details Chips (Bed, Bath, Distance) */}
                      <View style={styles.chipsContainer}>
                        {details.map(detail => {
                          const Icon = detail.icon;
                          
                          // Make distance chip pressable
                          if (detail.id === 'distance') {
                            return (
                              <TouchableOpacity
                                key={detail.id}
                                style={styles.chip}
                                onPress={() => openMaps(currentListing.address)}
                                activeOpacity={0.7}
                              >
                                <Icon width={25} height={25} />
                                <Text style={styles.chipText}>{detail.label}</Text>
                              </TouchableOpacity>
                            );
                          }
                          
                          // Other chips remain non-pressable
                          return (
                            <View key={detail.id} style={styles.chip}>
                              <Icon width={25} height={25} />
                              <Text style={styles.chipText}>{detail.label}</Text>
                            </View>
                          );
                        })}
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

                    {/* Buttons */}
                    <View style={styles.buttonsContainer}>
                      <TouchableOpacity
                        style={styles.detailsButton}
                        onPress={() => {
                          // Find the actual building for apartment details
                          const building = buildingsData.find(b => b.id === currentListing.buildingId);
                          navigation.navigate('ApartmentListingDetails', {
                            listing: building,
                            matchScore,
                          });
                        }}
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

      {/* Optional Manual "Done" Button 
      <TouchableOpacity 
        style={styles.doneButton}
        onPress={handleFinishSwiping}
      >
        <Text style={styles.doneButtonText}>
          {isRedoingPreferences ? 'Finish & Return Home' : 'Skip & Complete Setup'}
        </Text>
      </TouchableOpacity>*/}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 55,
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
  priceContainer: {
    alignItems: 'flex-end',
  },
  perMonth: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: -2,
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
    color: '#000000',
    fontWeight: '700',
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
    fontWeight: '500',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    zIndex: 10,         
    elevation: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  cardStackContainer: {
    flex: 0.95,            
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center', 
  },
  doneButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#BF5700',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#BF5700',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    position: 'relative',
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sideSpacer: {
    width: 40, 
  },
  /*distanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF5E6', 
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BF5700',
  },*/
});