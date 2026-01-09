import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';

import { apartmentsData } from '../data/apartments';
import { usePreferences } from '../context/PreferencesContext';
import { calculateMatchScore, getMatchColor } from '../data/matchingAlgorithm';
import PercentIcon from '../../assets/percentIcon.svg';
import BedIcon from '../../assets/bedIcon.svg';
import BathIcon from '../../assets/bathIcon.svg';
import SaveFilledIcon from '../../assets/filledInSaveIcon.svg';
import DistanceIcon from '../../assets/distanceIcon(2).svg';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Vertical Apartment Card Component
function ApartmentVerticalCard({ apartment, matchScore, onPress, isSaved, onSavePress }) {
  const hasImages = apartment.images && apartment.images.length > 0;
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image Section */}
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
        
        {/* Floating Save Button */}
        {isSaved && (
          <View style={styles.saveBadge}>
            <SaveFilledIcon width={14} height={14} fill="#BF5700" />
          </View>
        )}

        {/* Match Badge */}
        {matchScore && (
          <View style={[styles.matchBadge, { backgroundColor:  '#ffffffde'}]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PercentIcon width={13} height={13} />
              <Text style={styles.matchText}> {matchScore}%</Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Info Section Below Image */}
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

  // Get selected amenities from preferences
  const allAmenities = ['wifi', 'gym', 'pool', 'parking', 'furnished', 'petFriendly'];
  const selectedAmenities = allAmenities.filter(amenity => preferences?.[amenity]);

  useEffect(() => {
    if (prefsLoading) return;
    
    setLoading(true);
    
    // Calculate match scores and sort
    const apartmentsWithScores = apartmentsData.map(apartment => {
      const score = calculateMatchScore(
        apartment,
        preferences,
        selectedAmenities.map(id => ({ id, selected: true }))
      );
      return { ...apartment, matchScore: score };
    });

    // Sort by match score (highest to lowest)
    const sorted = apartmentsWithScores.sort((a, b) => b.matchScore - a.matchScore);
    
    setSortedApartments(sorted);
    setLoading(false);
  }, [preferences, prefsLoading]);

  const handleCardPress = (apartment) => {
    navigation.navigate('ListingDetails', {
      listing: apartment,
      matchScore: apartment.matchScore,
    });
  };

  const handleToggleSave = (id) => {
    toggleSave(id);
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse All Apartments</Text>
        <Text style={styles.headerSubtitle}>
          {sortedApartments.length} listings sorted by match
        </Text>
      </View>

      {/* Apartments List */}
      <FlatList
        data={sortedApartments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ApartmentVerticalCard
            apartment={item}
            matchScore={item.matchScore}
            onPress={() => handleCardPress(item)}
            isSaved={savedIds.includes(item.id)}
            onSavePress={() => handleToggleSave(item.id)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6b7280',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffffb2',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  cardImage: {
    width: '100%',
    height: '100%',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  saveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
    color: '#1F2937',
  },
  matchBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  matchText: {
    color: '#000000',
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