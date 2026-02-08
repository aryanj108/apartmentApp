import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TextInput, FlatList, Keyboard } from 'react-native';
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
import StarIcon from '../../assets/stars.svg';
import Arrow from '../../assets/rightArrowIcon.svg'


function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Default UT Austin coordinates
const DEFAULT_LOCATION = {
  name: 'University of Texas at Austin',
  lat: 30.285340698031447,
  lon: -97.73208396036748
};

export default function PreferencesScreen({ navigation, route }) {
  const { user } = useAuth();
  const { preferences, setPreferences, loading } = usePreferences();
  
  // Check if this is a redo flow
  const isRedoingPreferences = route?.params?.isRedo || false;
  
  console.log("Current Render minPrice:", preferences.minPrice);
  console.log("Current Render beds:", preferences.beds);

  // LOCAL STATE - Only for UI updates, doesn't trigger Firebase saves
  const [localPreferences, setLocalPreferences] = useState({
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

  // Location search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null); // null = no location set

  const [amenities, setAmenities] = useState([
    { id: 'wifi', label: 'WiFi', selected: false, icon: WifiIcon },
    { id: 'gym', label: 'Gym', selected: false, icon: GymIcon },
    { id: 'pool', label: 'Pool', selected: false, icon: PoolIcon },
    { id: 'parking', label: 'Parking', selected: false, icon: ParkingIcon },
    { id: 'furnished', label: 'Furnished', selected: false, icon: FurnishedIcon },
    { id: 'petFriendly', label: 'Pet Friendly', selected: false, icon: PetIcon },
  ]);

  // Initialize local state from context preferences when they load
  useEffect(() => {
    if (!loading && preferences) {
      setLocalPreferences({
        minPrice: preferences.minPrice,
        maxPrice: preferences.maxPrice,
        beds: preferences.beds,
        bathrooms: preferences.bathrooms,
        distance: preferences.distance,
        parking: preferences.parking,
        furnished: preferences.furnished,
        wifi: preferences.wifi,
        gym: preferences.gym,
        pool: preferences.pool,
        petFriendly: preferences.petFriendly,
      });
      
      // Load saved location if exists
      if (preferences.location) {
        setSelectedLocation(preferences.location);
      }
    }
  }, [loading, preferences]);

  // Search location using Nominatim API
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search within Austin, TX area for better results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query + ', Austin, TX')}&` +
        `format=json&` +
        `limit=5&` +
        `bounded=1&` +
        `viewbox=-97.9,30.5,-97.5,30.1` // Austin bounding box
      );
      
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching location:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocation(searchQuery);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectLocation = (location) => {
    setSelectedLocation({
      name: location.display_name.split(',')[0], // Get just the building/place name
      lat: parseFloat(location.lat),
      lon: parseFloat(location.lon)
    });
    setSearchQuery('');
    setShowResults(false);
    Keyboard.dismiss();
  };

  const resetToDefaultLocation = () => {
    setSelectedLocation(null);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#d1d5db' }}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6b7280' }}>Loading preferences...</Text>
      </View>
    );
  }

  // Sync amenities state with LOCAL preferences
  useEffect(() => {
    setAmenities([
      { id: 'wifi', label: 'WiFi', selected: localPreferences.wifi, icon: WifiIcon },
      { id: 'gym', label: 'Gym', selected: localPreferences.gym, icon: GymIcon },
      { id: 'pool', label: 'Pool', selected: localPreferences.pool, icon: PoolIcon },
      { id: 'parking', label: 'Parking', selected: localPreferences.parking, icon: ParkingIcon },
      { id: 'furnished', label: 'Furnished', selected: localPreferences.furnished, icon: FurnishedIcon },
      { id: 'petFriendly', label: 'Pet Friendly', selected: localPreferences.petFriendly, icon: PetIcon },
    ]);
  }, [localPreferences.wifi, localPreferences.gym, localPreferences.pool, localPreferences.parking, localPreferences.furnished, localPreferences.petFriendly]);

  const toggleAmenity = (id) => {
    setAmenities(amenities.map(amenity => 
      amenity.id === id ? { ...amenity, selected: !amenity.selected } : amenity
    ));
    setLocalPreferences({
      ...localPreferences,
      [id]: !localPreferences[id]
    });
  };

  const resetPreferences = () => {
    setLocalPreferences({
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
    
    resetToDefaultLocation();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Section 1 */}
      <View style={[styles.section, styles.firstSection]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LocationIcon width={28} height={28} style={styles.icon} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>City & State</Text>
            <Text style={styles.content}>Austin, TX</Text>
          </View>
        </View>
      </View>

      {/* Section 2 - Location Search */}
      <View style={[styles.section]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <CampusIcon width={28} height={28} style={styles.icon} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Location (Optional)</Text>
            
            {/* Show selected location name OR search input */}
            {selectedLocation && !searchQuery ? (
              <Text style={styles.content}>{selectedLocation.name}</Text>
            ) : (
              <TextInput
                style={styles.inlineSearchInput}
                placeholder="e.g., University of Texas at Austin"
                placeholderTextColor="#d1d5db"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setShowResults(true)}
              />
            )}
            
            {isSearching && (
              <ActivityIndicator 
                style={styles.inlineSearchLoader} 
                size="small" 
                color="#6b7280" 
              />
            )}
          </View>
        </View>
        
        {/* Info text */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoIcon}>ⓘ</Text>
          <Text style={styles.infoText}>Automatically set to UT Austin if left blank</Text>
        </View>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.place_id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => selectLocation(item)}
                >
                  <Text style={styles.resultText} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Reset to Default Button */}
        {selectedLocation && (
          <TouchableOpacity
            style={styles.resetLocationButton}
            onPress={resetToDefaultLocation}
          >
            <Text style={styles.resetLocationText}>Clear location</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Section 3 */}
      <View style={[styles.section]}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MoneyIcon width={36} height={36} style={styles.icon} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Monthly Rent</Text>
            <Text style={styles.content}>
              ${formatPrice(localPreferences.minPrice)} - ${formatPrice(localPreferences.maxPrice)}
            </Text>
          </View>
        </View>

        {/* Min Price Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Min</Text>
            <Text style={styles.sliderValue}>${formatPrice(localPreferences.minPrice)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={5000}
            step={100}
            value={localPreferences.minPrice}
            onValueChange={(value) => setLocalPreferences({...localPreferences, minPrice: value})}
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
            <Text style={styles.sliderValue}>${formatPrice(localPreferences.maxPrice)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={5000}
            step={100}
            value={localPreferences.maxPrice}
            onValueChange={(value) => setLocalPreferences({...localPreferences, maxPrice: value})}
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
            <BedIcon width={32} height={32} style={styles.icon} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Beds & Bathrooms</Text>
            <Text style={styles.content}>
              {localPreferences.beds} {localPreferences.beds === 1 ? 'Bed' : 'Beds'} ×{' '}
              {localPreferences.bathrooms} {localPreferences.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
            </Text>
          </View>
        </View>

        {/* Beds Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Beds</Text>
            <Text style={styles.sliderValueBB}>{localPreferences.beds}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={localPreferences.beds}
            onValueChange={(value) => setLocalPreferences({...localPreferences, beds: value})}
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
            <Text style={styles.sliderValueBB}>{localPreferences.bathrooms}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={localPreferences.bathrooms}
            onValueChange={(value) => setLocalPreferences({...localPreferences, bathrooms: value})}
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
            <Text style={styles.selectedContent}>{localPreferences.distance} Miles</Text>
            <View style={styles.sliderContainerDistance}>
              <View style={styles.sliderRow}></View>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={10}
                step={0.5}
                value={localPreferences.distance}
                onValueChange={(value) => setLocalPreferences({...localPreferences, distance: value})}
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
            <Text style={styles.selectedContent}>
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
                  width={22} 
                  height={22} 
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
              // Save to Firebase
              await updateUserPreferences(user.uid, {
                minPrice: localPreferences.minPrice,
                maxPrice: localPreferences.maxPrice,
                bedrooms: localPreferences.beds,
                bathrooms: localPreferences.bathrooms,
                maxDistance: localPreferences.distance,
                parking: localPreferences.parking,
                furnished: localPreferences.furnished,
                wifi: localPreferences.wifi,
                gym: localPreferences.gym,
                pool: localPreferences.pool,
                petFriendly: localPreferences.petFriendly,
                location: selectedLocation || DEFAULT_LOCATION, 
              });
              
              // Update context state AFTER successful save
              setPreferences({
                ...localPreferences,
                location: selectedLocation || DEFAULT_LOCATION
              });
              
              console.log('Saved preferences:', localPreferences);
              console.log('Saved location:', selectedLocation);
              navigation.navigate('SwipeSearch', { isRedo: isRedoingPreferences });
            }
          } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Error saving preferences');
          }
        }}
      >

      {/* Text */}
        <View style={styles.headerWithIcons}>
          {/* Left Icon */}
          <View style={styles.headerIconLeft}>
            <StarIcon width={24} height={24} />
          </View>
          
          {/* Text Content */}
          <View style={styles.headerTextContent}>
            <Text style={styles.startButtonText}>Find your dream apartment</Text>
          </View>
          
          {/* Right Icon */}
          <View style={styles.headerIconRight}>
            <Arrow width={24} height={24} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Section 7 */}
      <TouchableOpacity
        style={styles.startButton} 
        onPress={() => {
          alert('Preferences reset!');
          resetPreferences();
        }}
      >  
        <View style={styles.headerTextContent}>
            <Text style={styles.startButtonText}>Reset Preferences</Text>
          </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(223, 223, 223, 0)',
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 24,
    paddingVertical: 18,
    marginBottom: 18,
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
    fontSize: 14,
    color: '#6b7280'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  content: {
    fontSize: 22,
    color: '#000000ff',
    fontWeight: '600',
  },
  selectedContent: {
    fontSize: 20,
    color: '#000000ff',
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
    color: '#e20000bd',
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  iconContainer: {
    width: 48,
    height: 48,
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
  // Location Search Styles
  inlineSearchInput: {
    fontSize: 18,
    color: '#000000ff',
    fontWeight: '400',
    padding: 0,
    margin: 0,
    minHeight: 28,
  },
  inlineSearchLoader: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  infoIcon: {
    fontSize: 14,
    color: '#9ca3af',
    marginRight: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  searchContainer: {
    marginTop: 16,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchLoader: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  resultsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultText: {
    fontSize: 14,
    color: '#000000',
  },
  resetLocationButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  resetLocationText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
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
    fontWeight: '500',
    minWidth: 20,
    color: '#000000ff',
  },
  sliderValue: {
    fontSize: 20,
    minWidth: 50,
    fontWeight: '500',
    color: '#000000ff',
    marginRight: 0
  },
  sliderValueBB: {
    fontSize: 23,
    minWidth: 50,
    fontWeight: '500',
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
    fontSize: 12,
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
    fontSize: 18,
    fontWeight: '500',
  },
  headerWithIcons: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  },
  headerIconLeft: {
    marginLeft: 14,
  },
  headerIconRight: {
    marginRight: 14,
  },
  headerTextContent: {
    flex: 1,
    alignItems: 'center', 
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});