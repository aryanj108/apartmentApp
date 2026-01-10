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
import PercentIcon from '../../assets/percentIcon.svg';

import { apartmentsData } from '../data/apartments';
import { usePreferences } from '../context/PreferencesContext';
import {
  calculateMatchScore,
  getMatchColor,
} from '../data/matchingAlgorithm';

import SwipeCard from '../navigation/SwipeCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CARD_HEIGHT = SCREEN_HEIGHT * 0.75;  // 75% of screen height
const CARD_WIDTH = SCREEN_WIDTH * 0.92;    // 92% of screen width
const IMAGE_HEIGHT = CARD_HEIGHT * 0.65;   // 65% of card is image
const INFO_HEIGHT = CARD_HEIGHT * 0.35;    // 35% of card is info

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
    if (currentIndex >= apartmentsData.length - 1) {
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

  const matchScore = calculateMatchScore(currentApartment, preferences, selectedAmenities);
  const matchColor = getMatchColor(matchScore);

  const details = [
    {
      id: 'bath',
      label: `${currentApartment.bathrooms} Bath${currentApartment.bathrooms !== 1 ? 's' : ''}`,
      icon: BathIcon,
    },
    {
      id: 'bed',
      label: `${currentApartment.bedrooms} Bed${currentApartment.bedrooms !== 1 ? 's' : ''}`,
      icon: BedIcon,
    },
    {
      id: 'distance',
      label: `${currentApartment.distance} Mi`,
      icon: DistanceIcon,
    },
  ];

  const apartmentAmenities = allAmenities.filter(amenity =>
    currentApartment.amenities.includes(amenity.id)
  );

  return (
    <View style={styles.container}>
      {apartmentsData
        .slice(currentIndex, currentIndex + 2)
        .reverse()
        .map(apartment => {
          const score = calculateMatchScore(apartment, preferences, selectedAmenities);
          const color = '#ffffff';

          return (
            <SwipeCard
              key={apartment.id}
              apartment={apartment}
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
                    source={apartment.images[0]}
                    style={styles.apartmentImage}
                    resizeMode="cover"
                  />
                  {/* Match Badge on Image */}
                  <View style={[styles.matchBadge, { backgroundColor: color }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <PercentIcon width={16} height={16} />
                      <Text style={styles.matchScoreText}>{score}%</Text>
                    </View>
                  </View>
                </View>

                {/* Info Section */}
                <View style={styles.infoSection}>
                  {/* Title & Price */}
                  <View style={styles.infoHeader}>
                    <View style={styles.leftInfo}>
                      <Text style={styles.apartmentName} numberOfLines={1}>
                        {currentApartment.name}
                      </Text>
                      <Text style={styles.address} numberOfLines={1}>
                        {currentApartment.address}
                      </Text>
                    </View>
                    <Text style={styles.price}>${currentApartment.price}/mo</Text>
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
                  {apartmentAmenities.length > 0 && (
                    <View style={styles.amenitiesContainer}>
                      {apartmentAmenities.map(amenity => (
                        <View key={amenity.id} style={styles.amenityChip}>
                          <amenity.icon width={16} height={16} />
                          <Text style={styles.amenityText}>{amenity.label}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Buttons */}
                  <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                      style={styles.detailsButton}
                      onPress={() =>
                        navigation.navigate('ApartmentListingDetails', {
                          listing: currentApartment,
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
                          listing: currentApartment,
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
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    color: '#000000',
  },
  infoSection: {
    height: INFO_HEIGHT,
    backgroundColor: '#ffffff',
    padding: 16,
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
  },
  amenityText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 14,
    fontWeight: '600',
  },
});