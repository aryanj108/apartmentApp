import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';

import BedIcon from '../../assets/bedIcon.svg';
import DistanceIcon from '../../assets/distanceIcon(2).svg';
import BathIcon from '../../assets/bathIcon.svg';
import WifiIcon from '../../assets/wifiIcon.svg';
import GymIcon from '../../assets/gymIcon.svg';
import PoolIcon from '../../assets/poolIcon.svg';
import ParkingIcon from '../../assets/parkingIcon.svg';
import FurnishedIcon from '../../assets/furnishedIcon.svg';
import PetIcon from '../../assets/petIcon.svg';

import { apartmentsData } from '../data/apartments';
import { usePreferences } from '../context/PreferencesContext';
import {
  calculateMatchScore,
  //getMatchDescription,
  getMatchColor,
} from '../data/matchingAlgorithm';

import SwipeCard from '../navigation/SwipeCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');

const allAmenities = [
  { id: 'wifi', label: 'WiFi', icon: WifiIcon },
  { id: 'gym', label: 'Gym', icon: GymIcon },
  { id: 'pool', label: 'Pool', icon: PoolIcon },
  { id: 'parking', label: 'Parking', icon: ParkingIcon },
  { id: 'furnished', label: 'Furnished', icon: FurnishedIcon },
  { id: 'petFriendly', label: 'Pet Friendly', icon: PetIcon },
];

export default function SwipeScreen({ navigation }: any) {
  const { preferences } = usePreferences();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<any[]>([]);

  useEffect(() => {
    const selected = allAmenities.map(amenity => ({
      ...amenity,
      selected: preferences[amenity.id] || false,
    }));
    setSelectedAmenities(selected);
  }, [preferences]);

  useEffect(() => {
  // Navigate to Home when user finishes swiping
  if (currentIndex >= apartmentsData.length - 1) {
    // Optional: Add a small delay or show a completion message
    setTimeout(() => {
      navigation.navigate('MainTabs');
    }, 500);
  }
}, [currentIndex]);

  const currentApartment = apartmentsData[currentIndex];
  if (!currentApartment) {
  return (
    <View style={styles.container}>
      <Text style={{ marginTop: 100, textAlign: 'center' }}>Loading next matches...</Text>
    </View>
  );
}

  const matchScore = calculateMatchScore(
    currentApartment,
    preferences,
    selectedAmenities
  );
  //const matchDescription = getMatchDescription(matchScore);
  const matchColor = getMatchColor(matchScore);

  const details = [
    {
      id: 'bath',
      label: `${currentApartment.bathrooms} Bath${
        currentApartment.bathrooms !== 1 ? 's' : ''
      }`,
      icon: BathIcon,
    },
    {
      id: 'bed',
      label: `${currentApartment.bedrooms} Bed${
        currentApartment.bedrooms !== 1 ? 's' : ''
      }`,
      icon: BedIcon,
    },
    {
      id: 'distance',
      label: `${currentApartment.distance} Miles`,
      icon: DistanceIcon,
    },
  ];

  const apartmentAmenities = allAmenities.filter(amenity =>
    currentApartment.amenities.includes(amenity.id)
  );

  const handleNextApartment = () => {
    if (currentIndex < apartmentsData.length - 1) {
      setCurrentIndex(i => i + 1);
    }
  };

  const handlePreviousApartment = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  return (
    <View style={styles.container}>
      {apartmentsData
        .slice(currentIndex, currentIndex + 2)
        .reverse()
        .map(apartment => {
          const score = calculateMatchScore(
            apartment,
            preferences,
            selectedAmenities
          );
          //const description = getMatchDescription(score);
          const color = getMatchColor(score);

          return (
<SwipeCard
  key={apartment.id}
  apartment={apartment}
  navigation={navigation}
  matchScore={score}
  matchColor={color}
  //matchDescription={description}
  onSwipeLeft={() => setCurrentIndex(i => i + 1)}
  onSwipeRight={() => setCurrentIndex(i => i + 1)}
>
  <View style={{ flex: 1 }}>
    {/* Picture Section */}
    <View style={styles.pictureSection}>
    <Image
    source={currentApartment.images[0]}
    style={styles.apartmentImage}
    resizeMode="cover"
  />
    </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                  <View style={styles.infoContent}>
                    <View style={styles.leftInfo}>
                      <Text style={styles.apartmentName}>
                        {currentApartment.name}
                      </Text>
                      <Text style={styles.address}>
                        {currentApartment.address}
                      </Text>
                    </View>

                    <View style={styles.rightInfo}>
                      <Text style={styles.price}>
                        ${currentApartment.price}/mo
                      </Text>
                    </View>
                  </View>

                  <View style={styles.chipsContainer}>
                    {details.map(detail => (
                      <View key={detail.id} style={styles.chip}>
                        <View style={styles.chipContent}>
                          <detail.icon
                            width={24}
                            height={24}
                            style={styles.chipIconLeft}
                          />
                          <Text style={styles.chipText}>
                            {detail.label}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {apartmentAmenities.length > 0 && (
                    <View style={styles.chipsContainerAmenaties}>
                      {apartmentAmenities.map(amenity => (
                        <View
                          key={amenity.id}
                          style={styles.chipAmenaties}
                        >
                          <View
                            style={styles.chipContentAmenaties}
                          >
                            <amenity.icon
                              width={23}
                              height={23}
                            />
                            <Text
                              style={styles.chipTextAmenaties}
                            >
                              {amenity.label}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() =>
                      navigation.navigate('ListingDetails', {
                        listing: currentApartment,
                        matchScore,
                      })
                    }
                  >
                    <Text
                      style={styles.viewDetailsButtonText}
                    >
                      View Apartment Details
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() =>
                      navigation.navigate('ListingDetails', {
                        listing: currentApartment,
                        matchScore,
                      })
                    }
                  >
                    <Text
                      style={styles.viewDetailsButtonText}
                    >
                      View Room Details
                    </Text>
                  </TouchableOpacity>
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
  },
  pictureSection: {
    flex: 1.3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  matchBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  matchScoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  matchDescriptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    //marginTop: 2,
  },
  infoSection: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  infoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftInfo: {
    flex: 1,
  },
  apartmentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  address: {
    fontSize: 18,
    color: '#6b7280',
  },
  rightInfo: {
    marginLeft: 16,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  debugText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 10,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  navText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 10,
  },
  chip: {
    width: '31%',
    paddingVertical: 12,
    paddingHorizontal: 19,
    borderRadius: 20,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 16,
    color: '#000000ff',
    fontWeight: '800',
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chipIconLeft: {
    width: 20,
    height: 20,
  },
  chipsContainerAmenaties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 15,
    gap: 10,
  },
  chipAmenaties: {
    width: '31%',
    paddingVertical: 5,
    paddingHorizontal: 17,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  chipTextAmenaties: {
    fontSize: 12,
    color: '#000000ff',
    fontWeight: '800',
  },
  chipContentAmenaties: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewDetailsButton: {
    backgroundColor: '#f3f4f6',
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    alignSelf: 'center',
    padding: 24,
    marginBottom: 12,
    marginTop: 30,
    borderRadius: 16,
    elevation: 2,
  },
  viewDetailsButtonText: {
    color: '#000000ff',
    fontSize: 23,
    fontWeight: '500',
  },
  apartmentImage: {
    position: 'absolute',  // Add this
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
},
debugOverlay: {
  position: 'absolute',
  bottom: 20,
  left: 0,
  right: 0,
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  padding: 10,
},
});