import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'react-native';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';  
import { updateUserPreferences } from '../services/userService';  

import { TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import LocationIcon from '../../assets/locationIcon.svg';
import CampusIcon from '../../assets/campusIcon.svg';
import MoneyIcon from '../../assets/moneyIcon.svg';
import DistanceIcon from '../../assets/distanceIcon.svg';
import AmenatiesIcon from '../../assets/amenatiesIcon.svg';
import WifiIcon from '../../assets/wifiIcon.svg';
import GymIcon from '../../assets/gymIcon.svg';
import PoolIcon from '../../assets/poolIcon.svg';
import ParkingIcon from '../../assets/parkingIcon.svg';
import FurnishedIcon from '../../assets/furnishedIcon.svg';
import PetIcon from '../../assets/petIcon.svg';
import BedIcon from '../../assets/bedIcon.svg';
import CheckIcon from '../../assets/checkIcon.svg'; 

export default function PreferencesScreen({ navigation }) {
  const { user } = useAuth();
  const { preferences, setPreferences, loading } = usePreferences();
  console.log("Current Render minPrice:", preferences.minPrice);
  console.log("Current Render beds:", preferences.beds);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#d1d5db' }}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280' }}>Loading preferences...</Text>
      </View>
    );
  }

  const [amenities, setAmenities] = useState([
    { id: 'wifi', label: 'WiFi', selected: false, icon: WifiIcon },
    { id: 'gym', label: 'Gym', selected: false, icon: GymIcon },
    { id: 'pool', label: 'Pool', selected: false, icon: PoolIcon },
    { id: 'parking', label: 'Parking', selected: false, icon: ParkingIcon },
    { id: 'furnished', label: 'Furnished', selected: false, icon: FurnishedIcon },
    { id: 'petFriendly', label: 'Pet Friendly', selected: false, icon: PetIcon },
  ]);

  // Sync amenities state with preferences when preferences load
  useEffect(() => {
    setAmenities([
      { id: 'wifi', label: 'WiFi', selected: preferences.wifi, icon: WifiIcon },
      { id: 'gym', label: 'Gym', selected: preferences.gym, icon: GymIcon },
      { id: 'pool', label: 'Pool', selected: preferences.pool, icon: PoolIcon },
      { id: 'parking', label: 'Parking', selected: preferences.parking, icon: ParkingIcon },
      { id: 'furnished', label: 'Furnished', selected: preferences.furnished, icon: FurnishedIcon },
      { id: 'petFriendly', label: 'Pet Friendly', selected: preferences.petFriendly, icon: PetIcon },
    ]);
  }, [preferences.wifi, preferences.gym, preferences.pool, preferences.parking, preferences.furnished, preferences.petFriendly]);

  const toggleAmenity = (id) => {
    setAmenities(amenities.map(amenity => 
      amenity.id === id ? { ...amenity, selected: !amenity.selected } : amenity
    ));
    setPreferences({
      ...preferences,
      [id]: !preferences[id]
    });
  };

  const resetPreferences = () => {
    setPreferences({
      minPrice: 0,
      maxPrice: 5000,
      beds: 1,
      bathrooms: 1,
      distance: 0.5,
      parking: false,
      furnished: false,
      wifi: false,
      gym: false,
      pool: false,
      petFriendly: false,
    });

    setAmenities([
      { id: 'wifi', label: 'WiFi', selected: false, icon: WifiIcon },
      { id: 'gym', label: 'Gym', selected: false, icon: GymIcon },
      { id: 'pool', label: 'Pool', selected: false, icon: PoolIcon },
      { id: 'parking', label: 'Parking', selected: false, icon: ParkingIcon },
      { id: 'furnished', label: 'Furnished', selected: false, icon: FurnishedIcon },
      { id: 'petFriendly', label: 'Pet Friendly', selected: false, icon: PetIcon },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Section 1 */}
      <View style={[styles.section, styles.firstSection]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LocationIcon width={26} height={26} style={styles.icon} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>City & State</Text>
            <Text style={styles.content}>Austin, TX</Text>
          </View>
        </View>
      </View>

      {/* Section 2 */}
      <View style={[styles.section]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <CampusIcon width={26} height={26} style={styles.icon} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Location (Optional)</Text>
            <Text style={styles.content}>University of Texas at Austin</Text>
            <Text style={styles.disclaimer}>*Automatically set to UT Austin</Text>
          </View>
        </View>
      </View>

      {/* Section 3 */}
      <View style={[styles.section]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MoneyIcon width={32} height={32} style={styles.icon} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Monthly Rent</Text>
            <Text style={styles.content}>
              ${preferences.minPrice} - ${preferences.maxPrice}
            </Text>
          </View>
        </View>

        {/* Min Price Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Min</Text>
            <Text style={styles.sliderValue}>${preferences.minPrice}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={5000}
            step={100}
            value={preferences.minPrice}
            onValueChange={(value) => setPreferences({...preferences, minPrice: value})}
            minimumTrackTintColor="#000000"
            maximumTrackTintColor="#d1d5db"
            thumbTintColor="#000000"
          />
          <View style={styles.sliderBounds}>
            <Text style={styles.boundText}>$0</Text>
            <Text style={styles.boundText}>$5000</Text>
          </View>
        </View>

        {/* Max Price Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Max</Text>
            <Text style={styles.sliderValue}>${preferences.maxPrice}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={5000}
            step={100}
            value={preferences.maxPrice}
            onValueChange={(value) => setPreferences({...preferences, maxPrice: value})}
            minimumTrackTintColor="#000000"
            maximumTrackTintColor="#d1d5db"
            thumbTintColor="#000000"
          />
          <View style={styles.sliderBounds}>
            <Text style={styles.boundText}>$0</Text>
            <Text style={styles.boundText}>$5000</Text>
          </View>
        </View>
      </View>

      {/* Section 3.5 */}
      <View style={[styles.section]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <BedIcon width={30} height={30} style={styles.icon} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Beds & Bathrooms</Text>
            <Text style={styles.content}>
              {preferences.beds} {preferences.beds === 1 ? 'Bed' : 'Beds'} ×{' '}
              {preferences.bathrooms} {preferences.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
            </Text>
          </View>
        </View>

        {/* Beds Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Beds</Text>
            <Text style={styles.sliderValueBB}>{preferences.beds}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={preferences.beds}
            onValueChange={(value) => setPreferences({...preferences, beds: value})}
            minimumTrackTintColor="#000000"
            maximumTrackTintColor="#d1d5db"
            thumbTintColor="#000000"
          />
          <View style={styles.sliderBounds}>
            <Text style={styles.boundText}>1</Text>
            <Text style={styles.boundText}>10</Text>
          </View>
        </View>

        {/* Bathrooms Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Bathrooms</Text>
            <Text style={styles.sliderValueBB}>{preferences.bathrooms}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={preferences.bathrooms}
            onValueChange={(value) => setPreferences({...preferences, bathrooms: value})}
            minimumTrackTintColor="#000000"
            maximumTrackTintColor="#d1d5db"
            thumbTintColor="#000000"
          />
          <View style={styles.sliderBounds}>
            <Text style={styles.boundText}>1</Text>
            <Text style={styles.boundText}>10</Text>
          </View>
        </View>
      </View>

      {/* Section 4 */}
      <View style={[styles.section]}>
        <View style={styles.header}>
          <View style={styles.iconContainerDistance}>
            <DistanceIcon width={26} height={26} style={styles.icon} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Max Distance</Text>
            <Text style={styles.content}>{preferences.distance} Miles</Text>
            <View style={styles.sliderContainerDistance}>
              <View style={styles.sliderRow}></View>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={10}
                step={0.5}
                value={preferences.distance}
                onValueChange={(value) => setPreferences({...preferences, distance: value})}
                minimumTrackTintColor="#000000"
                maximumTrackTintColor="#d1d5db"
                thumbTintColor="#000000"
              />
              <View style={styles.sliderBounds}>
                <Text style={styles.boundText}>0.5</Text>
                <Text style={styles.boundText}>10</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Section 5 */}
      <View style={[styles.section]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <AmenatiesIcon width={32} height={32} style={styles.icon} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Preferred Amenities</Text>
            <Text style={styles.content}>
              {amenities.filter(a => a.selected).length} selected
            </Text>
          </View>
        </View>

        <View style={styles.chipsContainer}>
          {amenities.map((amenity) => (
            <TouchableOpacity
              key={amenity.id}
              style={[
                styles.chip,
                amenity.selected && styles.chipSelected
              ]}
              onPress={() => toggleAmenity(amenity.id)}
            >
              <View style={styles.chipContent}>
                <amenity.icon 
                  width={27} 
                  height={27} 
                  style={styles.chipIconLeft}
                  fill={amenity.selected ? '#ffffff' : '#6b7280'}
                />
                <Text style={[
                  styles.chipText,
                  amenity.selected && styles.chipTextSelected
                ]}>
                  {amenity.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Section 6 */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={async () => {
          try {
            if (user?.uid) {
              // Manually save preferences to Firestore
              await updateUserPreferences(user.uid, {
                minPrice: preferences.minPrice,
                maxPrice: preferences.maxPrice,
                bedrooms: preferences.beds,
                bathrooms: preferences.bathrooms,
                maxDistance: preferences.distance,
                parking: preferences.parking,
                furnished: preferences.furnished,
                wifi: preferences.wifi,
                gym: preferences.gym,
                pool: preferences.pool,
                petFriendly: preferences.petFriendly,
              });
              
              alert('Preferences saved!');
              console.log('Saved preferences:', preferences);
              navigation.navigate('SwipeSearch');
            }
          } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Error saving preferences');
          }
        }}
      >
        <Text style={styles.startButtonText}>Save Preferences</Text>
      </TouchableOpacity>

      {/* Section 7 */}
      <TouchableOpacity
        style={styles.startButton} 
        onPress={() => {
          alert('Preferences reset!');
          resetPreferences();
        }}
      >  
        <Text style={styles.startButtonText}>Reset Preferences</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d1d5db',
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 24,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  firstSection: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#6b7280'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  content: {
    fontSize: 23,
    color: '#000000ff',
  },
  disclaimer: {
    fontSize: 10,
    marginTop: 4,
    color: '#e200008a',
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dfdfdfff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginLeft: -5
  },
  iconContainerDistance: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dfdfdfff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginLeft: -5,
    marginBottom: 60
  },
  headerText: {
    flex: 1,
  }, 
  sliderContainer: {
    marginTop: 20,
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 23,
    fontWeight: 'bold',
    minWidth: 20,
    color: '#000000ff',
  },
  sliderValue: {
    fontSize: 20,
    minWidth: 50,
    color: '#000000ff',
    marginRight: 0
  },
  sliderValueBB: {
    fontSize: 23,
    minWidth: 50,
    color: '#000000ff',
    marginRight: -19
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderBounds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  boundText: {
    fontSize: 13,
    minWidth: 20,
    color: '#9ca3af',
  },
  sliderContainerDistance: {
    marginTop: 5,
    marginLeft: -50
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 10,
  },
  chip: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  chipText: {
    fontSize: 15,
    color: '#000000ff',
    fontWeight: '800',
  },
  chipTextSelected: {
    color: '#ffffff',
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
  startButton: {
    backgroundColor: '#ffffff',
    width: '100%',
    paddingVertical: 17,
    borderRadius: 20,
    alignItems: 'center',
    alignSelf: 'center',
    padding: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  startButtonText: {
    color: '#000000ff',
    fontSize: 23,
    fontWeight: '600',
  },
});