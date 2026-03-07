import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Alert, Animated, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import BedIcon from '../../assets/bedFilledIcon.svg';
import DistanceIcon from '../../assets/arrowFilledIcon.svg';
import BathIcon from '../../assets/bathFilledIcon.svg';
import DescriptionIcon from '../../assets/descriptionIcon.svg';
import ReviewIcon from '../../assets/reviewIcon.svg';
import FeaturesIcon from '../../assets/featuresIcon.svg';
import ContactIcon from '../../assets/contactIcon.svg';
import LeaseIcon from '../../assets/leaseIcon.svg';
import BackIcon from '../../assets/backIcon.svg';
import { usePreferences } from '../context/PreferencesContext';
import SaveOutlineIcon from '../../assets/saveIcon.svg';
import SaveFilledIcon from '../../assets/filledInSaveIcon.svg';
import SaveOutlineIconHeart from '../../assets/heartOutline.svg';
import SaveFilledIconHeart from '../../assets/heart.svg';
import StarIcon from '../../assets/stars.svg';
import ExternalLinkIcon from '../../assets/compass.svg';
import ArrowUpRightIcon from '../../assets/arrowUp.svg';
import { buildingsData } from '../data/buildings';
import * as Clipboard from 'expo-clipboard';
import { calculateDistance } from '../navigation/locationUtils';
import MaskedView from '@react-native-masked-view/masked-view';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import ImageCarousel from '../navigation/ImageCarousel';

// Formats a number like 1800 into "1,800" for display
function formatPrice(price) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function RoomListingDetailsScreen({ navigation, route }) {
  const { savedIds, toggleSave, preferences } = usePreferences();
  const { listing, matchScore } = route.params;
  const scoreValue = matchScore || 0;

  // animatedWidth drives the match score progress bar — animates from 0 to the
  // score value over 1 second when the screen first renders
  const animatedWidth = useRef(new Animated.Value(0)).current;

  // Copies a string to the clipboard and shows a confirmation alert
  const copyToClipboard = async (text, label) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', `${label} has been copied to your clipboard.`);
  };

  // Opens the native maps app with directions from the apartment address to the
  // user's saved location (defaults to UT Austin if none is set).
  // On iOS we try Apple Maps first and fall back to Google Maps if unavailable.
  const openMaps = (destinationAddress: string) => {
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

  // Animate the progress bar to the match score on mount
  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: scoreValue,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [scoreValue]);

  // Map the animated 0–100 value to a 0%–100% width string for the progress bar
  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Look up the parent building record to pull address, images, and contact info —
  // these fields live on the building, not the individual unit listing
  const building = buildingsData.find(b => b.id === listing.buildingId) || {};

  // Calculate the real distance if the user has GPS coordinates; otherwise fall
  // back to the static distance stored on the building record
  let calculatedDistance = building.distance || 0;
  if (preferences.location && building.latitude && building.longitude) {
    calculatedDistance = calculateDistance(
      preferences.location.lat,
      preferences.location.lon,
      building.latitude,
      building.longitude
    );
    calculatedDistance = Math.round(calculatedDistance * 10) / 10;
  }

  // Merge unit-level and building-level data into a single object so the JSX
  // below only needs to reference one source. Unit fields take priority; building
  // fields fill in anything the unit doesn't have.
  const roomData = {
    id: listing.id,
    buildingName: building.name,
    unitNumber: listing.unitNumber,
    address: building.address || 'Address not available',
    price: listing.price || 0,
    bedrooms: listing.bedrooms || 0,
    bathrooms: listing.bathrooms || 0,
    distance: calculatedDistance,
    description: (listing.description && listing.description.trim())
      ? listing.description
      : (building.description || 'No description available.'),
    features: (listing.features && listing.features.length > 0)
      ? listing.features
      : (building.features || []),
    images: building.images || [],
    contact: building.contact || {
      phone: '',
      email: '',
      hours: ''
    },
    leaseDetails: {
      term: listing.leaseTerm || '',
      deposit: listing.deposit ? `${listing.deposit}` : '',
      availability: listing.availableDate || ''
    },
    website: listing.website || building.website || '',
    sqft: listing.sqft,
    floorPlan: listing.floorPlan,
    smartHousing: listing.smartHousing,
    moveInFee: listing.moveInFee
  };

  const isSaved = savedIds.includes(roomData.id);

  // Navigates up to the building-level detail screen, passing the match score along
  const handleViewApartmentDetails = () => {
    navigation.navigate('ApartmentListingDetails', {
      listing: building,
      matchScore: matchScore,
    });
  };

  const handleOpenWebsite = () => {
    if (roomData.website) {
      Linking.openURL(roomData.website).catch(err => {
        Alert.alert('Error', 'Unable to open website');
      });
    }
  };

  // The three stat chips shown below the listing info (beds, baths, distance).
  // Distance is special-cased to be tappable — pressing it opens maps.
  const details = [
    { id: 'bed', label: `${roomData.bedrooms} Bed${roomData.bedrooms !== 1 ? 's' : ''}`, icon: BedIcon },
    { id: 'bath', label: `${roomData.bathrooms} Bath${roomData.bathrooms !== 1 ? 's' : ''}`, icon: BathIcon },
    { id: 'distance', label: `${roomData.distance} Mile${roomData.distance !== 1 ? 's' : ''}`, icon: DistanceIcon },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>

        {/* Image carousel with save button overlaid in the top-right corner */}
        <View style={styles.imageGalleryContainer}>
          <ImageCarousel images={roomData.images} />

          <TouchableOpacity
            onPress={() => {
              const wasSaved = isSaved;
              Alert.alert(
                wasSaved ? 'Listing Unsaved' : 'Listing Saved',
                wasSaved
                  ? 'This listing has been removed from your saved listings.'
                  : 'This listing has been added to your saved listings.'
              );
              toggleSave(roomData.id);
            }}
            style={styles.saveButtonContainer}
            activeOpacity={0.8}
            delayPressIn={0}
          >
            <BlurView intensity={80} style={styles.circularButton} tint="light">
              {isSaved ? (
                <MaskedView maskElement={<SaveFilledIconHeart width={22} height={22} fill="#000000" />}>
                  <LinearGradient
                    colors={['#FF8C42', '#BF5700', '#994400']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: 22, height: 22 }}
                  />
                </MaskedView>
              ) : (
                <MaskedView maskElement={<SaveOutlineIconHeart width={22} height={22} fill="#000000" />}>
                  <LinearGradient
                    colors={['#FF8C42', '#BF5700', '#994400']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: 22, height: 22 }}
                  />
                </MaskedView>
              )}
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Unit number, building name, address, price, and match score bar */}
        <View style={styles.infoSection}>
          <View style={styles.infoContent}>
            <View style={styles.leftInfo}>
              {roomData.unitNumber && (
                <Text style={styles.unitNumberText}>{roomData.unitNumber}</Text>
              )}
              <Text style={styles.apartmentName}>{roomData.buildingName}</Text>
              <Text style={styles.address}>{roomData.address}</Text>
              {roomData.sqft && (
                <Text style={styles.sqftText}>{roomData.sqft} sq ft</Text>
              )}
              {roomData.smartHousing && (
                <Text style={styles.smartHousingLine}>
                  SMART Housing Available
                </Text>
              )}
            </View>
            <View style={styles.rightInfo}>
              {/* MaskedView lets the gradient show through the price text */}
              <MaskedView
                maskElement={
                  <Text style={styles.price}>${formatPrice(listing.price)}</Text>
                }
              >
                <LinearGradient
                  colors={['#FF8C42', '#BF5700', '#994400']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.price, { opacity: 0 }]}>
                    ${formatPrice(listing.price)}
                  </Text>
                </LinearGradient>
              </MaskedView>
              <Text style={styles.perMonth}>per month</Text>
            </View>
          </View>

          {/* Animated match score bar — fills from left to right over 1 second */}
          <View style={styles.matchScoreSection}>
            <View style={styles.matchRow}>
              <View style={styles.matchLabelGroup}>
                <StarIcon width={18} height={18} fill="#BF5700" />
                <Text style={styles.matchScoreTitle}>AI Match Score: </Text>
              </View>

              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[
                    { width: widthInterpolate, height: '100%' }
                  ]}
                >
                  <LinearGradient
                    colors={['#FF8C00', '#BF5700', '#8B4000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressBarFill}
                  />
                </Animated.View>
              </View>

              <Text style={styles.matchScorePercent}>{scoreValue}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Bed / Bath / Distance chips. Distance chip is tappable to open maps. */}
        <View style={styles.chipsContainer}>
          {details.map((detail) => {
            const iconElement = (
              <MaskedView maskElement={<detail.icon width={26} height={26} fill="#000000" />}>
                <LinearGradient
                  colors={['#FF8C42', '#BF5700', '#994400']}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: 26, height: 26 }}
                />
              </MaskedView>
            );

            if (detail.id === 'distance') {
              return (
                <TouchableOpacity
                  key={detail.id}
                  style={styles.chip}
                  onPress={() => openMaps(roomData.address)}
                  activeOpacity={0.7}
                >
                  <View style={styles.chipContent}>
                    {iconElement}
                    <Text style={styles.chipText}>{detail.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            }

            return (
              <View key={detail.id} style={styles.chip}>
                <View style={styles.chipContent}>
                  {iconElement}
                  <Text style={styles.chipText}>{detail.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.separator} />

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DescriptionIcon width={22} height={22} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>About</Text>
          </View>
          <Text style={styles.description}>
            {roomData.description}
          </Text>
        </View>

        <View style={styles.separator} />

        {/* Features — hidden if the listing has none */}
        {roomData.features && roomData.features.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FeaturesIcon width={22} height={22} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Features</Text>
            </View>
            {roomData.features.map((feature, index) => (
              <Text key={index} style={styles.featureItem}>
                • {feature}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.separator} />

        {/* Contact — phone and email are tappable to call/email, long-press copies */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ContactIcon width={22} height={22} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Contact</Text>
          </View>
          {roomData.contact?.phone && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Phone:</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${roomData.contact.phone}`)}
                onLongPress={() => copyToClipboard(roomData.contact.phone, 'Phone number')}
                delayLongPress={500}
                activeOpacity={0.7}
              >
                <Text style={styles.contactValueClickable}>{roomData.contact.phone}</Text>
              </TouchableOpacity>
            </View>
          )}
          {roomData.contact?.email && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Email:</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(`mailto:${roomData.contact.email}`)}
                onLongPress={() => copyToClipboard(roomData.contact.email, 'Email address')}
                delayLongPress={500}
                activeOpacity={0.7}
              >
                <Text style={styles.contactValueClickable}>{roomData.contact.email}</Text>
              </TouchableOpacity>
            </View>
          )}
          {roomData.contact?.hours && (
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Hours:</Text>
              <Text style={styles.contactValue}>{roomData.contact.hours}</Text>
            </View>
          )}
          {!roomData.contact?.phone && !roomData.contact?.email && !roomData.contact?.hours && (
            <Text style={styles.featureItem}>• Contact information not available</Text>
          )}
        </View>

        <View style={styles.separator} />

        {/* Lease details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LeaseIcon width={22} height={22} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Lease Details</Text>
          </View>
          {roomData.leaseDetails?.term && (
            <Text style={styles.featureItem}>• Lease Term: {roomData.leaseDetails.term}</Text>
          )}
          {roomData.leaseDetails?.deposit && (
            <Text style={styles.featureItem}>• Security Deposit: {roomData.leaseDetails.deposit}</Text>
          )}
          {roomData.leaseDetails?.availability && (
            <Text style={styles.featureItem}>• Availability: {roomData.leaseDetails.availability}</Text>
          )}
          {!roomData.leaseDetails?.term && !roomData.leaseDetails?.deposit && !roomData.leaseDetails?.availability && (
            <Text style={styles.featureItem}>• Lease details not available</Text>
          )}
        </View>

        <View style={styles.separator} />

        {/* Bottom action buttons — only shown when the listing has a website URL */}
        {roomData.website && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleOpenWebsite}
              style={styles.viewOriginalButton}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaskedView maskElement={<ExternalLinkIcon width={24} height={24} fill="#000000" />}>
                  <LinearGradient
                    colors={['#FF8C42', '#BF5700', '#994400']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: 24, height: 24 }}
                  />
                </MaskedView>
                <Text style={styles.viewOriginalButtonText}>View Original Listing</Text>
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

            {/* Save and View Apt. Details sit side by side in a row */}
            <View style={styles.bottomButtonRow}>
              <TouchableOpacity
                onPress={() => {
                  const wasSaved = isSaved;
                  Alert.alert(
                    wasSaved ? 'Listing Unsaved' : 'Listing Saved',
                    wasSaved
                      ? 'This listing has been removed from your saved listings.'
                      : 'This listing has been added to your saved listings.'
                  );
                  toggleSave(roomData.id);
                }}
                style={styles.bottomSaveButton}
                activeOpacity={0.8}
              >
                <View style={styles.saveButtonContent}>
                  {isSaved ? (
                    <>
                      <MaskedView maskElement={<SaveFilledIconHeart width={20} height={20} fill="#000000" />}>
                        <LinearGradient
                          colors={['#FF8C42', '#BF5700', '#994400']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ width: 20, height: 20 }}
                        />
                      </MaskedView>
                      <Text style={styles.saveButtonText}>Saved</Text>
                    </>
                  ) : (
                    <>
                      <MaskedView maskElement={<SaveOutlineIconHeart width={20} height={20} fill="#000000" />}>
                        <LinearGradient
                          colors={['#FF8C42', '#BF5700', '#994400']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ width: 20, height: 20 }}
                        />
                      </MaskedView>
                      <Text style={styles.saveButtonText}>Save</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {/* Navigates up to the parent building's detail screen */}
              <TouchableOpacity
                onPress={handleViewApartmentDetails}
                style={styles.bottomDetailsButton}
              >
                <View style={styles.saveButtonContent}>
                  <Text style={styles.saveButtonText}>View Apt. Details</Text>
                </View>
              </TouchableOpacity>
            </View>
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
    top: 50,
    left: 20,
    zIndex: 10,
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
  saveButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
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
    backgroundColor: '#f3f4f6',
    width: '95%',
    paddingVertical: 10,
    alignItems: 'center',
    alignSelf: 'center',
    padding: 24,
    marginBottom: 30,
    marginTop: 5,
    borderRadius: 16,
    elevation: 2,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#8e8e91',
  },
  rightInfo: {
    marginLeft: 16,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#BF5700',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    marginBottom: 10,
    gap: 13,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  chip: {
    width: '31%',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  chipText: {
    fontSize: 12,
    color: '#8e8e91',
    fontWeight: '400',
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
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
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
  bottomButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  bottomSaveButton: {
    flex: 1,
  },
  bottomDetailsButton: {
    flex: 1,
  },
  saveButtonContent: {
    backgroundColor: '#f5f0ebb2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#BF5700',
    fontSize: 15,
    fontWeight: '500',
  },
  savedButtonContent: {
    backgroundColor: '#D4C4B0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  savedButtonText: {
    color: '#8B6F47',
    fontSize: 16,
    fontWeight: '600',
  },
  viewDetailsButtonContent: {
    backgroundColor: '#BF5700',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  matchScoreSection: {
    marginTop: 10,
    paddingBottom: 0,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  matchLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  matchScoreTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8e8e91',
    marginLeft: 6,
  },
  progressBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#BF5700',
    borderRadius: 5,
  },
  matchScorePercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#BF5700',
    minWidth: 35,
    marginLeft: 4,
    textAlign: 'right',
  },
  websiteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  unitNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  smartHousingLine: {
    fontSize: 14,
    fontWeight: '600',
    color: '#BF5700',
    marginTop: 2,
  },
  sqftText: {
    fontSize: 14,
    color: '#8e8e91',
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
  perMonth: {
    fontSize: 12,
    color: '#8e8e91',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
    marginVertical: 10,
  },
  innerSeparator: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 0,
    marginBottom: 20,
    marginTop: 0,
  },
});