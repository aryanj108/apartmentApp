import React, { useState, useEffect, useRef } from 'react';
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
  UIManager,
  Animated,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import MaskedView from '@react-native-masked-view/masked-view';
import { db } from '../config/firebaseConfig';

import { buildingsData } from '../data/buildings';
import { listingsData } from '../data/listings';
import { usePreferences } from '../context/PreferencesContext';
import { calculateMatchScore, getMatchColor } from '../data/matchingAlgorithm';
import { useAuth } from '../context/AuthContext';

import BedIcon from '../../assets/bedIcon.svg';
import BathIcon from '../../assets/bathIcon.svg';
import Stars from '../../assets/stars.svg';
import Heart from '../../assets/heart.svg';
import Logo from '../../assets/longhornLivingIcon1.png';
import ExternalLinkIcon from '../../assets/apartment.svg'; 
import ArrowUpRightIcon from '../../assets/arrowUp.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;
const CARD_MARGIN = 20;

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
              <Heart width={24} height={24} fill="#BF5700" />
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
                <Stars width={13} height={13} fill={'#ffffff'} />
                <Text style={styles.matchText}> {matchScore}%</Text>
              </View>
            </LinearGradient>
          )}
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <View>
            <Text style={styles.cardTitle}>{listing.unitNumber}</Text>
            <Text style={styles.unitNumber} numberOfLines={1}>
              {listing.name}
            </Text>
            <Text
              style={styles.cardAddress}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {listing.address}
            </Text>
          </View>

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
            <MaskedView
              maskElement={
                <Text style={styles.cardPrice}>${formatPrice(listing.price)}</Text>
              }
            >
              <LinearGradient
                colors={['#FF8C42', '#BF5700', '#994400']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.cardPrice, { opacity: 0 }]}>
                  ${formatPrice(listing.price)}
                </Text>
              </LinearGradient>
            </MaskedView>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Filter Modal Component
function FilterModal({ visible, onClose, sections, visibleSections, toggleSection, onApply, onReset }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // Fade in animation when modal becomes visible
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    } else {
      opacity.setValue(0);
    }
  }, [visible]);

  // Create pan responder for drag gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          const newOpacity = Math.max(0, 1 - (gestureState.dy / 400));
          opacity.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: SCREEN_HEIGHT,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            })
          ]).start(() => {
            onClose();
          });
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 65,
              friction: 10,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
              tension: 65,
              friction: 10,
            })
          ]).start();
        }
      },
    })
  ).current;

  const handleBackdropPress = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };

  const handleBackButtonPress = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleBackButtonPress}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleBackdropPress}
          style={StyleSheet.absoluteFill}
        >
          <Animated.View 
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity }
            ]} 
          />
        </TouchableOpacity>
        
        {/* Modal content that slides down */}
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateY }] }
          ]}
        >
          {/* DRAGGABLE AREA - Only the top section */}
          <View {...panResponder.panHandlers} style={styles.dragArea}>
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={styles.dragHandle} />
            </View>

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filter Sections</Text>
            <View style={{ width: 50 }} />
          </View>
          </View>

          {/* NON-DRAGGABLE AREA - ScrollView */}
          <ScrollView 
          style={styles.filterList}>
            {sections.map((section) => (
              <TouchableOpacity
                key={section.key}
                style={styles.filterItem}
                onPress={() => toggleSection(section.key)}
              >
                <View style={[
                  styles.checkbox,
                  visibleSections[section.key] && styles.checkboxChecked
                ]}>
                  {visibleSections[section.key] && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.filterItemText}>{section.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={onApply}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function Home({ navigation }) {
  const scrollViewRef = useRef(null);  
    useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e) => {
      if (navigation.isFocused()) {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    });

    return unsubscribe;
  }, [navigation]);

  const { user } = useAuth();
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
  // Temporary state for filter changes (not saved until Apply is pressed)
  const [tempVisibleSections, setTempVisibleSections] = useState(visibleSections);

  // Get selected amenities from preferences
  const allAmenities = ['wifi', 'gym', 'pool', 'parking', 'furnished', 'petFriendly'];
  const selectedAmenities = allAmenities.filter((amenity) => preferences?.[amenity]);

  // Load filter preferences from Firebase on mount
  useEffect(() => {
    const loadFilterPreferences = async () => {
      if (!user?.uid) return;
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().filterPreferences) {
          const savedFilters = userDoc.data().filterPreferences;
          setVisibleSections(savedFilters);
          setTempVisibleSections(savedFilters);
        }
      } catch (error) {
        console.error('Error loading filter preferences:', error);
      }
    };

    loadFilterPreferences();
  }, [user?.uid]);

  // Save filter preferences to Firebase
  const saveFilterPreferences = async (filters) => {
    if (!user?.uid) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        filterPreferences: filters
      });
    } catch (error) {
      console.error('Error saving filter preferences:', error);
    }
  };

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

  // Toggle section in temporary state (not saved yet)
  const toggleSection = (sectionKey) => {
    setTempVisibleSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
  };

  // Apply filters and save to Firebase
  const handleApplyFilters = async () => {
    // Apply the temporary changes to actual state
    setVisibleSections(tempVisibleSections);
    
    // Save to Firebase
    await saveFilterPreferences(tempVisibleSections);
    
    // Close modal
    setFilterModalVisible(false);
  };

  // Reset temp state when modal opens
  const handleOpenFilterModal = () => {
    setTempVisibleSections(visibleSections);
    setFilterModalVisible(true);
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
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <MaskedView
          maskElement={<Stars width={22} height={22} fill="#000000" />}
        >
          <LinearGradient
            colors={['#FF8C42', '#BF5700', '#994400']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: 22, height: 22 }}
          />
        </MaskedView>
      </View>

      <LinearGradient
        colors={['#ffffff', '#fafafa', '#f0f0f0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
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
      </LinearGradient>
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
      <ScrollView 
      ref={scrollViewRef}
      style={styles.scrollView} 
      showsVerticalScrollIndicator={true}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {/* Logo 
            <Image
              source={Logo}
              style={styles.headerLogo}
              resizeMode="contain"
            />*/}
            
            {/* Text */}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Longhorn Living</Text>
              <Text style={styles.headerSubtitle}>Find your dream apartment</Text>
            </View>
          </View>
          
          {/* Filter Button */}
          <TouchableOpacity style={styles.filterButton} onPress={handleOpenFilterModal}>
            <MaskedView
              maskElement={<Stars width={31} height={31} fill="#000000" />}
            >
              <LinearGradient
                colors={['#FF8C42', '#BF5700', '#994400']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: 30, height: 30 }}
              />
            </MaskedView>
          </TouchableOpacity>
        </View>
      </View>

        {/* Sections */}
        {sections.map((section) => (
          <React.Fragment key={section.key}>
            {renderSection(section.title, section.data, section.key)}
          </React.Fragment>
        ))}

      {/* Browse All Listings Button */}
      <View style={styles.browseAllContainer}>
        <TouchableOpacity 
          style={styles.browseAllButton}
          onPress={() => navigation.navigate('Search')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ExternalLinkIcon width={24} height={24} fill="#BF5700" />
            <Text style={styles.browseAllButtonText}>Search for Apartments</Text>
          </View>
          <ArrowUpRightIcon width={25} height={25} stroke="#8B6F47" />
        </TouchableOpacity>
      </View>
      <View style={{ height: 110 }} />  
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
            onReset={() => {
          const allOn = Object.fromEntries(sections.map(s => [s.key, true]));
          setTempVisibleSections(allOn);
        }}
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        sections={sections}
        visibleSections={tempVisibleSections}
        toggleSection={toggleSection}
        onApply={handleApplyFilters}
      />
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
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'Test',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    //paddingHorizontal: 20,
    letterSpacing: 0.3,
    //paddingVertical: 8,
  },
  carouselContainer: {
    paddingLeft: 20,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fafafa',
    borderRadius: 16,
    marginRight: CARD_MARGIN,
  },
  cardInner: {
    borderRadius: 16,
    overflow: 'hidden',
    flex: 1,
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
    top: 8,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },
  matchText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  cardContent: {
    padding: 16,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
    marginTop: 6,
  },
  unitNumber: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 2,
  },
  cardAddress: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto'
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
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 4,
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#BF5700',
    letterSpacing: 0.5,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: '70%',
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    paddingBottom: 16,
    //borderBottomWidth: 1,
    //borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 0.3,
  },
  resetText: {
    color: '#BF5700',
    fontSize: 16,
    fontWeight: '500',
    width: 50,
  },
  filterList: {
    paddingHorizontal: 20,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0,
    borderBottomColor: '#e5e7eb',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#BF5700',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#BF5700',
    borderColor: '#BF5700',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
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
    backgroundColor: '#f3f4f6',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#BF5700',
    fontSize: 18,
    fontWeight: '500',
  },
  saveBadge: {
    position: 'absolute',
    top: 12,
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
  dragArea: {
    paddingBottom: 10,
  },
  browseAllContainer: {
  paddingHorizontal: 20,
  paddingVertical: 10,
  marginTop: 10,
},
browseAllButton: {
  backgroundColor: '#f3f4f6',
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 12,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
},
browseAllButtonText: {
  color: '#BF5700',
  fontSize: 15,
  fontWeight: '500',
},
});