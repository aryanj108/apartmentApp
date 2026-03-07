import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform
} from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import MaskedView from '@react-native-masked-view/masked-view';

import Stars from '../../assets/stars.svg';
import { buildingsData } from '../data/buildings';
import { listingsData } from '../data/listings';
import { calculateMatchScore } from '../data/matchingAlgorithm';
import BedIcon from '../../assets/bedFilledIcon.svg';
import DistanceIcon from '../../assets/arrowFilledIcon.svg';
import BathIcon from '../../assets/bathFilledIcon.svg';
import DescriptionIcon from '../../assets/descriptionIcon.svg';
import ReviewIcon from '../../assets/reviewIcon.svg';
import FeaturesIcon from '../../assets/featuresIcon.svg';
import ContactIcon from '../../assets/contactIcon.svg';
import LeaseIcon from '../../assets/leaseIcon.svg';
import BackIcon from '../../assets/backIcon.svg';
import KeysIcon from '../../assets/keys.svg';
import ExternalLinkIcon from '../../assets/apartment.svg';
import ArrowUpRightIcon from '../../assets/arrowUp.svg';
import { usePreferences } from '../context/PreferencesContext';
import SaveOutlineIcon from '../../assets/saveIcon.svg';
import SaveFilledIcon from '../../assets/filledInSaveIcon.svg';
import SaveOutlineIconHeart from '../../assets/heartOutline.svg';
import SaveFilledIconHeart from '../../assets/heart.svg';
import { calculateDistance } from '../navigation/locationUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import ImageCarousel from '../navigation/ImageCarousel';

// Formats a number like 1800 into "1,800" for display in the UI
function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Renders a single available unit card inside the building's "Available Units" section.
// Each card shows the unit number, bed/bath count, price, and a match score badge.
// Tapping it navigates to the full room listing detail screen.
function UnitCard({ listing, matchScore, onPress }) {
  return (
    <TouchableOpacity
      style={styles.unitCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.unitCardContent}>
        {/* Top row: unit number on the left, match score badge on the right */}
        <View style={styles.unitCardTop}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.unitNumber}>
              {listing.unitNumber}
            </Text>
          </View>

          {/* Only render the badge if a match score was actually calculated */}
          {matchScore !== undefined && (
            <View style={{ alignSelf: 'flex-start' }}>
              <LinearGradient
                colors={['#FF8C42', '#BF5700', '#994400']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 1 }}
                style={styles.unitMatchBadge}
              >
                <Stars width={12} height={12} fill={'#ffffff'}/>
                <Text style={styles.unitMatchText}> {matchScore}%</Text>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Bottom row: bed/bath icons on the left, price on the right */}
        <View style={styles.unitDetailsRow}>
          <View style={styles.unitDetails}>
            <View style={styles.unitDetailItem}>
              <MaskedView maskElement={<BedIcon width={16} height={16} fill="#000000" />}>
                <LinearGradient
                  colors={['#FF8C42', '#BF5700', '#994400']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: 16, height: 16 }}
                />
              </MaskedView>
              <Text style={styles.unitDetailText}>{listing.bedrooms} Bed</Text>
            </View>

            <View style={styles.unitDetailItem}>
              <MaskedView maskElement={<BathIcon width={16} height={16} fill="#000000" />}>
                <LinearGradient
                  colors={['#FF8C42', '#BF5700', '#994400']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: 16, height: 16 }}
                />
              </MaskedView>
              <Text style={styles.unitDetailText}>{listing.bathrooms} Bath</Text>
            </View>
          </View>

          {/* MaskedView lets the LinearGradient show through the text shape */}
          <MaskedView
            maskElement={
              <Text style={styles.unitPrice}>${formatPrice(listing.price)}/mo</Text>
            }
          >
            <LinearGradient
              colors={['#FF8C42', '#BF5700', '#994400']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.unitPrice, { opacity: 0 }]}>
                ${formatPrice(listing.price)}/mo
              </Text>
            </LinearGradient>
          </MaskedView>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Copies a string to the clipboard and shows a confirmation alert
const copyToClipboard = async (text, label) => {
  await Clipboard.setStringAsync(text);
  Alert.alert('Copied!', `${label} has been copied to your clipboard.`);
};

export default function ApartmentListingDetailsScreen({ navigation, visible, onClose, route }) {

  const { savedIds, toggleSave, preferences } = usePreferences();

  const [building, setBuilding] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);

  // When the screen loads (or the apartment/preferences change), find the matching
  // building record, fetch its units, score each one against the user's preferences,
  // and sort them best-match-first.
  useEffect(() => {
    console.log('passedListing:', apartment);
    console.log('preferences:', preferences);

    if (!apartment?.id) return;

    // Try to find the building in our local data — fall back to the apartment object
    // itself if it already contains the building-level fields we need.
    const foundBuilding =
      buildingsData.find(b => b.id === apartment.buildingId || b.id === apartment.id) ||
      apartment;

    console.log('foundBuilding:', foundBuilding);
    setBuilding(foundBuilding);

    const buildingId = apartment.buildingId || apartment.id;
    const units = listingsData.filter(l => l.buildingId === buildingId);

    console.log('units found:', units.length);

    // Build the amenity selection list that the scoring algorithm expects
    const allAmenities = ['wifi', 'gym', 'pool', 'parking', 'furnished', 'petFriendly'];
    const selectedAmenities = allAmenities.map(amenity => ({
      id: amenity,
      selected: preferences?.[amenity] || false,
    }));

    console.log('selectedAmenities:', selectedAmenities);

    // Enrich each unit with building-level data (amenities, distance) before scoring,
    // since the algorithm needs fields that live on the building, not the unit.
    const scoredUnits = units.map(unit => {
      const enrichedUnit = {
        ...unit,
        amenities: foundBuilding.amenities || [],
        distance: foundBuilding.distance || 0,
      };

      const score = calculateMatchScore(
        enrichedUnit,
        preferences,
        selectedAmenities
      );

      console.log('Unit:', unit.unitNumber, 'Score:', score);
      return { ...unit, matchScore: score };
    });

    scoredUnits.sort((a, b) => b.matchScore - a.matchScore);
    setAvailableUnits(scoredUnits);
  }, [apartment, preferences]);

  // Pull the listing passed in from the previous screen, with a full set of
  // fallback values so the screen never crashes on missing data.
  const apartment = route.params?.listing || {
    name: 'Modern Downtown Loft',
    address: '123 Main St, Downtown',
    price: 1800,
    bedrooms: 1,
    bathrooms: 1,
    distance: 0.5,
    description: "Beautiful modern loft in the heart of downtown.",
    reviews: [],
    features: [],
    contact: {
      phone: '',
      email: '',
      hours: ''
    },
    leaseDetails: {
      term: '',
      deposit: '',
      availability: ''
    },
    website: ''
  };

  // If the user has set a custom location in preferences and the listing has
  // GPS coordinates, calculate the real distance; otherwise use the stored value.
  let calculatedDistance = apartment.distance || 0;
  if (preferences.location && apartment.latitude && apartment.longitude) {
    calculatedDistance = calculateDistance(
      preferences.location.lat,
      preferences.location.lon,
      apartment.latitude,
      apartment.longitude
    );
    calculatedDistance = Math.round(calculatedDistance * 10) / 10;
  }

  // Opens the native maps app with directions from the apartment address to the
  // user's saved location (defaults to UT Austin if none is set).
  // On iOS we try Apple Maps first and fall back to Google Maps if it's unavailable.
  const openMaps = (destinationAddress) => {
    const destinationLatitude = preferences.location?.lat || 30.285340698031447;
    const destinationLongitude = preferences.location?.lon || -97.73208396036748;

    const encodedAddress = encodeURIComponent(destinationAddress);

    let url = '';

    if (Platform.OS === 'ios') {
      url = `maps://app?saddr=${encodedAddress}&daddr=${destinationLatitude},${destinationLongitude}`;

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
      url = `https://www.google.com/maps/dir/?api=1&origin=${encodedAddress}&destination=${destinationLatitude},${destinationLongitude}`;

      Linking.openURL(url).catch(err => {
        Alert.alert('Error', 'Unable to open maps. Please make sure you have a maps app installed.');
        console.error('Error opening maps:', err);
      });
    }
  };

  const isSaved = savedIds.includes(apartment.id);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>

        {/* Image carousel with a blurred distance button overlaid in the top-right corner */}
        <View style={styles.imageGalleryContainer}>
          <ImageCarousel images={apartment.images || []} />

          <View style={styles.distanceButtonContainer}>
            <TouchableOpacity
              onPress={() => openMaps(apartment.address)}
              activeOpacity={0.8}
              delayPressIn={0}
            >
              <BlurView intensity={80} style={styles.distanceButtonBlur} tint="light">
                <MaskedView maskElement={<DistanceIcon width={20} height={20} fill="#000000" />}>
                  <LinearGradient
                    colors={['#FF8C42', '#BF5700', '#994400']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: 20, height: 20 }}
                  />
                </MaskedView>
                <MaskedView maskElement={<Text style={styles.distanceText}>{calculatedDistance} mi</Text>}>
                  <LinearGradient
                    colors={['#FF8C42', '#BF5700', '#994400']}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={[styles.distanceText, { opacity: 0 }]}>{calculatedDistance} mi</Text>
                  </LinearGradient>
                </MaskedView>
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        {/* Apartment name and address */}
        <View style={styles.infoSection}>
          <View style={styles.infoContent}>
            <View style={styles.leftInfo}>
              <Text style={styles.apartmentName}>{apartment.name}</Text>
              <Text style={styles.address}>{apartment.address}</Text>
            </View>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DescriptionIcon width={24} height={24} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          <Text style={styles.description}>
            {apartment.description || 'No description available.'}
          </Text>
        </View>

        <View style={styles.separator} />

        {/* Reviews — hidden if the listing has none */}
        {apartment.reviews && apartment.reviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ReviewIcon width={24} height={24} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>What Longhorns are Saying</Text>
            </View>
            {apartment.reviews.map((review, index) => (
              <Text key={index} style={styles.featureItem}>• {review}</Text>
            ))}
          </View>
        )}

        <View style={styles.separator} />

        {/* Features — hidden if the listing has none */}
        {apartment.features && apartment.features.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FeaturesIcon width={24} height={24} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Features</Text>
            </View>
            {apartment.features.map((feature, index) => (
              <Text key={index} style={styles.featureItem}>• {feature}</Text>
            ))}
          </View>
        )}

        <View style={styles.separator} />

        {/* Contact — phone and email are tappable to call/email directly,
            and long-pressing copies the value to clipboard */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ContactIcon width={24} height={24} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Contact</Text>
          </View>
          {apartment.contact?.phone && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Phone:</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${apartment.contact.phone}`)}
                onLongPress={() => copyToClipboard(apartment.contact.phone, 'Phone number')}
                delayLongPress={500}
                activeOpacity={0.7}
              >
                <Text style={styles.contactValueClickable}>{apartment.contact.phone}</Text>
              </TouchableOpacity>
            </View>
          )}
          {apartment.contact?.email && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Email:</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(`mailto:${apartment.contact.email}`)}
                onLongPress={() => copyToClipboard(apartment.contact.email, 'Email address')}
                delayLongPress={500}
                activeOpacity={0.7}
              >
                <Text style={styles.contactValueClickable}>{apartment.contact.email}</Text>
              </TouchableOpacity>
            </View>
          )}
          {apartment.contact?.hours && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Hours:</Text>
              <Text style={styles.contactValue}>{apartment.contact.hours}</Text>
            </View>
          )}
          {!apartment.contact?.phone && !apartment.contact?.email && !apartment.contact?.hours && (
            <Text style={styles.featureItem}>• Contact information not available</Text>
          )}
        </View>

        <View style={styles.separator} />

        {/* Lease details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LeaseIcon width={24} height={24} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Lease Details</Text>
          </View>
          {apartment.leaseDetails?.term && (
            <Text style={styles.featureItem}>• Lease Term: {apartment.leaseDetails.term}</Text>
          )}
          {apartment.leaseDetails?.deposit && (
            <Text style={styles.featureItem}>• Security Deposit: {apartment.leaseDetails.deposit}</Text>
          )}
          {apartment.leaseDetails?.availability && (
            <Text style={styles.featureItem}>• Availability: {apartment.leaseDetails.availability}</Text>
          )}
          {!apartment.leaseDetails?.term && !apartment.leaseDetails?.deposit && !apartment.leaseDetails?.availability && (
            <Text style={styles.featureItem}>• Lease details not available</Text>
          )}
        </View>

        <View style={styles.separator} />

        {/* Available units — each card is scored and sorted by match percentage.
            Tapping one navigates to the room-level detail screen, passing along
            building-level fields (name, images, contact, etc.) that the unit
            record doesn't store on its own. */}
        {availableUnits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.unitsSectionHeader}>
              <View style={styles.sectionHeader}>
                <KeysIcon width={24} height={24} style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>Available Units</Text>
              </View>
              <Text style={styles.description}>
                Tap a unit to view details
              </Text>
            </View>

            {availableUnits.map(unit => (
              <UnitCard
                key={unit.id}
                listing={unit}
                matchScore={unit.matchScore}
                onPress={() =>
                  navigation.navigate('RoomListingDetailsScreen_SearchVersion', {
                    listing: {
                      ...unit,
                      name: apartment.name,
                      address: apartment.address,
                      distance: apartment.distance,
                      images: apartment.images,
                      description: unit.description || apartment.description,
                      reviews: apartment.reviews,
                      features: unit.features || apartment.features,
                      contact: apartment.contact,
                      leaseDetails: apartment.leaseDetails,
                      website: unit.website || building?.website || '',
                    },
                    matchScore: unit.matchScore,
                  })
                }
              />
            ))}
          </View>
        )}

        <View style={styles.separator} />

        {/* Website button — only shown if the listing has a URL */}
        {apartment.website && (
          <View style={styles.websiteButtonContainer}>
            <TouchableOpacity
              style={styles.viewOriginalButton}
              onPress={async () => {
                try {
                  const supported = await Linking.canOpenURL(apartment.website);
                  if (supported) {
                    await Linking.openURL(apartment.website);
                  } else {
                    Alert.alert('Error', 'Cannot open this URL');
                  }
                } catch (error) {
                  Alert.alert('Error', 'Failed to open website');
                }
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaskedView maskElement={<ExternalLinkIcon width={24} height={24} fill="#000000" />}>
                  <LinearGradient
                    colors={['#FF8C42', '#BF5700', '#994400']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: 24, height: 24 }}
                  />
                </MaskedView>
                <Text style={styles.viewOriginalButtonText}>Visit Apartment Website</Text>
              </View>
              <MaskedView maskElement={<ArrowUpRightIcon width={25} height={25} fill="#000000" />}>
                <LinearGradient
                  colors={['#FF8C42', '#BF5700', '#994400']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: 25, height: 25 }}
                />
              </MaskedView>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Blurred circular back button overlaid on top of the image carousel */}
      <TouchableOpacity
        style={styles.backButtonOverlay}
        onPress={() => navigation.goBack()}
      >
        <BlurView intensity={80} style={styles.circularButton} tint="light">
          <MaskedView maskElement={<BackIcon width={22} height={22} fill="#000000" />}>
            <LinearGradient
              colors={['#FF8C42', '#BF5700', '#994400']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: 22, height: 22 }}
            />
          </MaskedView>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  imageGalleryContainer: {
    position: 'relative',
    height: 400,
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  distanceButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 100,
  },
  distanceButtonBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  saveBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  saveText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  placeholderText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },
  section: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  sectionIcon: {
    marginRight: 8,
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 24,
  },
  featureItem: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 24,
  },
  contactButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contactButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  websiteButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  infoSection: {
    backgroundColor: '#ffffff',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    marginBottom: 10,
    gap: 10,
  },
  chip: {
    width: '31%',
    paddingVertical: 5,
    paddingHorizontal: 0,
    borderRadius: 0,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 16,
    color: '#000000ff',
    fontWeight: '800',
  },
  chipContent: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  chipIconLeft: {
    width: 20,
    height: 20,
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
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
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#d1d5db',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 10,
  },
  unitsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  unitsSectionHeader: {
    marginBottom: 16,
  },
  unitsSectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  unitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 3,
  },
  unitCardContent: {
    padding: 16,
    flexDirection: 'column',
    gap: 8,
  },
  unitCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  unitDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  unitPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#BF5700',
  },
  unitNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: -0.2,
  },
  floorPlan: {
    fontSize: 14,
    color: '#BF5700',
    fontWeight: '600',
    marginBottom: 8,
  },
  unitDetailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  unitCardRight: {
    alignItems: 'flex-end',
  },
  unitMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#BF5700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  unitMatchText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  contactItem: {
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
  contactValueClickable: {
    fontSize: 15,
    color: '#BF5700',
    lineHeight: 24,
    textDecorationLine: 'underline',
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  circularButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewOriginalButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    gap: 8,
  },
  viewOriginalButtonText: {
    color: '#BF5700',
    fontSize: 15,
    fontWeight: '500',
  },
});