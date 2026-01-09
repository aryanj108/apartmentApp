import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  LayoutAnimation, 
  Platform, 
  UIManager
} from 'react-native';

import { apartmentsData } from '../data/apartments';
import { usePreferences } from '../context/PreferencesContext';
import { calculateMatchScore, getMatchColor } from '../data/matchingAlgorithm';
import FilterIcon from '../../assets/filterIcon.svg';
import PercentIcon from '../../assets/percentIcon.svg';
import BedIcon from '../../assets/bedIcon.svg';
import BathIcon from '../../assets/bathIcon.svg';
import SaveOutlineIcon from '../../assets/saveIcon.svg';
import SaveFilledIcon from '../../assets/filledInSaveIcon.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_MARGIN = 12;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Apartment Card Component
function ApartmentCard({ apartment, matchScore, onPress, isSaved, onSavePress }) {
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

        {/* Floating Save Button */}
        {isSaved && (
          <View style={styles.saveBadge}>
            <SaveFilledIcon width={14} height={14} fill="#BF5700" />
          </View>
        )}


        {matchScore && (
          <View style={[styles.matchBadge, { backgroundColor: '#ffffffde' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PercentIcon width={15} height={15} />
              <Text style={styles.matchText}> {matchScore}%</Text>
            </View>
          </View>
        )}
      </View>
      
      {/* ADD THIS MISSING VIEW TAG */}
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
          </View>
          <Text style={styles.cardPrice}>${apartment.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Home({ navigation }) {

  const handleToggleSave = (id) => {
  // This line tells React: "Animate the next change that happens to the UI"
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  toggleSave(id);
  };
  const { preferences, savedIds, toggleSave} = usePreferences();
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [savedListings, setSavedListings] = useState([]);
  const [budgetFriendly, setBudgetFriendly] = useState([]);
  const [closeToYou, setCloseToYou] = useState([]);
  const [hasAllAmenities, setHasAllAmenities] = useState([]);
  const [lovedByLonghorns, setLonghornFavorites] = useState([]);  
  
  // Filter modal state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    recentlyViewed: true,
    savedListings: true,
    budgetFriendly: true,
    closeToYou: true,
    hasAllAmenities: true,
    lovedByLonghorns: true,
  });

  // Get selected amenities from preferences
  const allAmenities = ['wifi', 'gym', 'pool', 'parking', 'furnished', 'petFriendly'];
  const selectedAmenities = allAmenities.filter(amenity => preferences?.[amenity]);

  useEffect(() => {
    if (!preferences || !savedIds) return;

      const sortByScore = (apartments) => {
      return [...apartments].sort((a, b) => {
        try {
          if (!a || !b) return 0;
          const scoreA = calculateMatchScore(a, preferences, selectedAmenities.map(id => ({ id, selected: true })));
          const scoreB = calculateMatchScore(b, preferences, selectedAmenities.map(id => ({ id, selected: true })));
          return scoreB - scoreA;
        } catch (error) {
          return 0;
        }
      });
    };

    if (!apartmentsData || apartmentsData.length === 0) return;
    
    const userBudget = preferences?.maxPrice || 2000;
    const maxDistance = 2;

    setRecentlyViewed(sortByScore(apartmentsData.slice(0, 5)));

    const saved = apartmentsData.filter(apt => savedIds.includes(apt.id));
    setSavedListings(sortByScore(saved));

    const budget = apartmentsData.filter(apt => apt && apt.price !== undefined && apt.price <= userBudget);
    setBudgetFriendly(sortByScore(budget));

    const nearby = apartmentsData.filter(apt => apt && apt.distance !== undefined && apt.distance <= maxDistance);
    setCloseToYou(sortByScore(nearby));

    setLonghornFavorites(sortByScore(apartmentsData.slice(0, 6)));

    if (selectedAmenities.length > 0) {
      const withAmenities = apartmentsData.filter(apt =>
        apt && apt.amenities && selectedAmenities.every(amenity => apt.amenities.includes(amenity))
      );
      setHasAllAmenities(sortByScore(withAmenities));
    }
  }, [preferences, savedIds]);

  const handleCardPress = (apartment) => {
    const score = calculateMatchScore(
      apartment,
      preferences,
      selectedAmenities.map(id => ({ id, selected: true }))
    );
    navigation.navigate('ListingDetails', {
      listing: apartment,
      matchScore: score,
    });
  };

  const toggleSection = (sectionKey) => {
    setVisibleSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const renderSection = (title, data, sectionKey) => {
    if (data.length === 0 || !visibleSections[sectionKey]) {
      if (sectionKey === 'savedListings') {
       // Optional: return a "No saved items" view here
       return null; 
    }
    return null;
  }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
          snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
          decelerationRate="fast"
        >
          {data.map((apartment) => {
            const score = calculateMatchScore(
              apartment,
              preferences,
              selectedAmenities.map(id => ({ id, selected: true }))
            );
            return (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                matchScore={score}
                onPress={() => handleCardPress(apartment)}
                isSaved={savedIds.includes(apartment.id)}
                onSavePress={() => handleToggleSave(apartment.id)}
              />
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const sections = [
    { key: 'recentlyViewed', title: 'Recently Viewed', data: recentlyViewed },
    { key: 'savedListings', title: 'Saved Listings', data: savedListings },
    { key: 'budgetFriendly', title: 'Meets Your Budget', data: budgetFriendly },
    { key: 'closeToYou', title: 'Close to You', data: closeToYou },
    { key: 'hasAllAmenities', title: 'Has All Your Amenities', data: hasAllAmenities },
    { key: 'lovedByLonghorns', title: 'Loved by Longhorns', data: lovedByLonghorns },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Longhorn Living</Text>
              <Text style={styles.headerSubtitle}>
                Find your ideal apartment
              </Text>
            </View>
            
            {/* Filter Button */}
            <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <FilterIcon width={30} height={30} />
          </TouchableOpacity>
          </View>
        </View>

        {/* Sections */}
        {sections.map(section => (
          <React.Fragment key={section.key}>
            {renderSection(section.title, section.data, section.key)}
          </React.Fragment>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Sections</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterList}>
              {sections.map(section => (
                <TouchableOpacity
                  key={section.key}
                  style={styles.filterItem}
                  onPress={() => toggleSection(section.key)}
                >
                  <View style={styles.checkbox}>
                    {visibleSections[section.key] && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.filterItemText}>{section.title}</Text>
                  <Text style={styles.filterItemCount}>({section.data.length})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    marginBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 20
  },
  filterButtonText: {
    fontSize: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  carouselContainer: {
    paddingLeft: 20,
    paddingRight: 12,
    paddingVertical: 10
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffffde',
    borderRadius: 16,
    marginRight: CARD_MARGIN,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,

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
     marginLeft: 4,
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
    color: '#000000ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
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
  marginRight: 16,  // Remove gap, use marginRight instead
},
cardDetailText: {
  fontSize: 12,
  color: '#374151',
  fontWeight: '600',
  marginLeft: 4,  // Space between icon and text
},
cardPrice: {
  fontSize: 21,
  fontWeight: 'bold',
  color: '#BF5700',
},
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    fontSize: 28,
    color: '#6b7280',
    fontWeight: '300',
  },
  filterList: {
    paddingHorizontal: 20,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000000',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  filterItemText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  filterItemCount: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#000000',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  saveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slight transparency
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
});