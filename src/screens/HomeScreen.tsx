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
import { LinearGradient } from 'expo-linear-gradient';

import { buildingsData } from '../data/buildings';
import { listingsData } from '../data/listings';
import { usePreferences } from '../context/PreferencesContext';
import { calculateMatchScore, getMatchColor } from '../data/matchingAlgorithm';
import FilterIcon from '../../assets/filterIcon.svg';
import PercentIcon from '../../assets/percentIcon.svg';
import BedIcon from '../../assets/bedIcon.svg';
import BathIcon from '../../assets/bathIcon.svg';
import SaveOutlineIcon from '../../assets/saveIcon.svg';
import SaveFilledIcon from '../../assets/filledInSaveIcon.svg';
import Stars from '../../assets/stars.svg';
import Heart from '../../assets/heart.svg';
import Logo from '../../assets/longhornLivingIcon1.png';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_MARGIN = 12;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

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
      description: listing.description || building?.description || '',
      features: listing.features || building?.features || [],
      reviews: building?.reviews || [],
      contact: building?.contact || {},
      leaseDetails: building?.leaseDetails || {},
      website: listing.website || building?.website || '',
    };
  });
}

// Apartment Card Component
function ApartmentCard({ listing, matchScore, onPress, isSaved, onSavePress }) {
  const hasImages = listing.images && listing.images.length > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.cardInner}>
        <View style={styles.cardImageContainer}>
          {hasImages ? (
            <Image source={listing.images[0]} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          {/* Floating Save Button */}
          {isSaved && (
            <View style={styles.saveBadge}>
              <Heart width={28} height={28} fill="#BF5700" />
            </View>
          )}
          {matchScore && (
            <LinearGradient
              colors={['#FF8C42', '#BF5700', '#994400']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.matchBadge}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Stars width={15} height={15} fill={'#ffffff'} />
                <Text style={styles.matchText}> {matchScore}%</Text>
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {listing.name}
          </Text>
          <Text style={styles.unitNumber}>
            {listing.unitNumber} • {listing.floorPlan}
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
            </View>
            <Text style={styles.cardPrice}>${formatPrice(listing.price)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Home({ navigation }) {
  const handleToggleSave = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleSave(id);
  };

  const { preferences, savedIds, toggleSave } = usePreferences();

  const [enrichedListings, setEnrichedListings] = useState([]);
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
  const selectedAmenities = allAmenities.filter((amenity) => preferences?.[amenity]);

  // Load enriched listings on mount
  useEffect(() => {
    const listings = getEnrichedListings();
    setEnrichedListings(listings);
  }, []);

  useEffect(() => {
    if (!preferences || !savedIds || enrichedListings.length === 0) return;

    const sortByScore = (listings) => {
      return [...listings].sort((a, b) => {
        try {
          if (!a || !b) return 0;
          const scoreA = calculateMatchScore(
            a,
            preferences,
            selectedAmenities.map((id) => ({ id, selected: true }))
          );
          const scoreB = calculateMatchScore(
            b,
            preferences,
            selectedAmenities.map((id) => ({ id, selected: true }))
          );
          return scoreB - scoreA;
        } catch (error) {
          return 0;
        }
      });
    };

    const userBudget = preferences?.maxPrice || 2000;
    const maxDistance = 2;

    setRecentlyViewed(sortByScore(enrichedListings.slice(0, 5)));
    const saved = enrichedListings.filter((listing) => savedIds.includes(listing.id));
    setSavedListings(sortByScore(saved));
    const budget = enrichedListings.filter(
      (listing) => listing && listing.price !== undefined && listing.price <= userBudget
    );
    setBudgetFriendly(sortByScore(budget));
    const nearby = enrichedListings.filter(
      (listing) => listing && listing.distance !== undefined && listing.distance <= maxDistance
    );
    setCloseToYou(sortByScore(nearby));
    setLonghornFavorites(sortByScore(enrichedListings.slice(0, 6)));

    if (selectedAmenities.length > 0) {
      const withAmenities = enrichedListings.filter(
        (listing) =>
          listing &&
          listing.amenities &&
          selectedAmenities.every((amenity) => listing.amenities.includes(amenity))
      );
      setHasAllAmenities(sortByScore(withAmenities));
    }
  }, [preferences, savedIds, enrichedListings]);

  const handleCardPress = (listing) => {
    const score = calculateMatchScore(
      listing,
      preferences,
      selectedAmenities.map((id) => ({ id, selected: true }))
    );
    // Home screen: go to individual unit details first
    navigation.navigate('RoomListingDetailsScreen_SearchVersion', {
      listing: listing,
      matchScore: score,
    });
  };

  const toggleSection = (sectionKey) => {
    setVisibleSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  const renderSection = (title, data, sectionKey) => {
    if (data.length === 0 || !visibleSections[sectionKey]) {
      if (sectionKey === 'savedListings') {
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
        >
          {data.map((listing) => {
            const score = calculateMatchScore(
              listing,
              preferences,
              selectedAmenities.map((id) => ({ id, selected: true }))
            );
            return (
              <ApartmentCard
                key={listing.id}
                listing={listing}
                matchScore={score}
                onPress={() => handleCardPress(listing)}
                isSaved={savedIds.includes(listing.id)}
                onSavePress={() => handleToggleSave(listing.id)}
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {/* Logo */}
            <Image
              source={Logo}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            
            {/* Text */}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Longhorn Living</Text>
              <Text style={styles.headerSubtitle}>Find your dream apartment</Text>
            </View>
          </View>
          
          {/* Filter Button */}
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <FilterIcon width={35} height={35} />
          </TouchableOpacity>
        </View>
      </View>

        {/* Sections */}
        {sections.map((section) => (
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
              {sections.map((section) => (
                <TouchableOpacity
                  key={section.key}
                  style={styles.filterItem}
                  onPress={() => toggleSection(section.key)}
                >
                  <View style={styles.checkbox}>
                    {visibleSections[section.key] && <Text style={styles.checkmark}>✓</Text>}
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
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerLogo: {
    width: 90,
    height: 90,
    marginLeft: -10,
    marginRight: -10,
    marginTop: -10,
    marginBottom: -20,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    paddingHorizontal: 20,
  },
  carouselContainer: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingVertical: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginRight: CARD_MARGIN,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardInner: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  cardImage: {
    width: '100%',
    height: '105%',
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
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
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
    fontSize: 21,
    fontWeight: 'bold',
    color: '#BF5700',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
    top: 15,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 5,
    color: '#1F2937',
  },
});