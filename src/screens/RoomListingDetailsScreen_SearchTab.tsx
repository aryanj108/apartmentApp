import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Alert, Animated, Linking, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import BedIcon from '../../assets/bedIcon.svg';
import DistanceIcon from '../../assets/distanceIcon(2).svg';
import BathIcon from '../../assets/bathIcon.svg';
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
import ExternalLinkIcon from '../../assets/shareIcon2.svg'; 
import ArrowUpRightIcon from '../../assets/arrowUp.svg';
import { buildingsData } from '../data/buildings';
import * as Clipboard from 'expo-clipboard';
import { calculateDistance } from '../navigation/locationUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import ImageCarousel from '../navigation/ImageCarousel';

export default function RoomListingDetailsScreen({ navigation, route }) {
  const { savedIds, toggleSave, preferences } = usePreferences();
  const { listing, matchScore } = route.params;
  const scoreValue = matchScore || 0;
  const animatedWidth = useRef(new Animated.Value(0)).current;

    const copyToClipboard = async (text, label) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied!', `${label} has been copied to your clipboard.`);
  };
  // Helper function to open maps with directions
  const openMaps = (destinationAddress: string) => {
      // Use custom location if set in preferences, otherwise default to UT Austin
      const destinationLatitude = preferences.location?.lat || 30.285340698031447;
      const destinationLongitude = preferences.location?.lon || -97.73208396036748;
      
      // Encode the apartment address for URL (this is now the ORIGIN)
      const encodedAddress = encodeURIComponent(destinationAddress);
      
      let url = '';
      
      if (Platform.OS === 'ios') {
        // Apple Maps URL scheme - swapped saddr and daddr
        url = `maps://app?saddr=${encodedAddress}&daddr=${destinationLatitude},${destinationLongitude}`;
        
        // Fallback to Google Maps on iOS if Apple Maps fails
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
        // Google Maps for Android - swapped origin and destination
        url = `https://www.google.com/maps/dir/?api=1&origin=${encodedAddress}&destination=${destinationLatitude},${destinationLongitude}`;
        
        Linking.openURL(url).catch(err => {
          Alert.alert('Error', 'Unable to open maps. Please make sure you have a maps app installed.');
          console.error('Error opening maps:', err);
        });
      }
    };

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: scoreValue,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [scoreValue]);

  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Get the building data for this listing
  const building = buildingsData.find(b => b.id === listing.buildingId) || {};

  let calculatedDistance = building.distance || 0;
  if (preferences.location && building.latitude && building.longitude) {
    calculatedDistance = calculateDistance(
      preferences.location.lat,
      preferences.location.lon,
      building.latitude,
      building.longitude
    );
    // Round to 1 decimal place
    calculatedDistance = Math.round(calculatedDistance * 10) / 10;
  }

  // Merge listing and building data
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

  const details = [
    { id: 'bath', label: `${roomData.bathrooms} Bath${roomData.bathrooms !== 1 ? 's' : ''}`, icon: BathIcon },
    { id: 'bed', label: `${roomData.bedrooms} Bed${roomData.bedrooms !== 1 ? 's' : ''}`, icon: BedIcon },
    { id: 'distance', label: `${roomData.distance} Mile${roomData.distance !== 1 ? 's' : ''}`, icon: DistanceIcon },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Image Gallery Section */}
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
              <SaveFilledIconHeart width={22} height={22} fill="#BF5700"/>
            ) : (
              <SaveOutlineIconHeart width={22} height={22} stroke="#000000" />
            )}
          </BlurView>
        </TouchableOpacity>
        </View>

        {/* Basic Info */}
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
              <Text style={styles.price}>${roomData.price}/mo</Text>
            </View>
          </View>

          {/* AI Match Score Bar */}
          <View style={styles.matchScoreSection}>
            <View style={styles.matchRow}>
              
              {/* Left Side: Icon + Label */}
              <View style={styles.matchLabelGroup}>
                <StarIcon width={18} height={18} fill="#BF5700" />
                <Text style={styles.matchScoreTitle}>AI Match Score: </Text>
              </View>

              {/* Center: The Bar (Stretched via flex: 1) */}
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

              {/* Right Side: Percentage */}
              <Text style={styles.matchScorePercent}>{scoreValue}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.chipsContainer}>
          {details.map((detail) => {
            // Make distance chip pressable
            if (detail.id === 'distance') {
              return (
                <TouchableOpacity 
                  key={detail.id} 
                  style={styles.chip}
                  onPress={() => openMaps(roomData.address)}
                  activeOpacity={0.7}
                >
                  <View style={styles.chipContent}>
                    <detail.icon width={24} height={24} />
                    <Text style={styles.chipText}>{detail.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            }
            
            // Other chips remain non-pressable
            return (
              <View key={detail.id} style={styles.chip}>
                <View style={styles.chipContent}>
                  <detail.icon width={24} height={24} />
                  <Text style={styles.chipText}>{detail.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DescriptionIcon width={22} height={22} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Room Description</Text>
          </View>
          <Text style={styles.description}>
            {roomData.description}
          </Text>
        </View>

        {/* Features */}
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

        {/* Contact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ContactIcon width={24} height={24} style={styles.sectionIcon} />
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

        {/* Lease Details */}
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

        {/* Bottom Buttons */}
        {roomData.website && (
          <View style={styles.buttonContainer}>
            {/* View Original Listing Button (Full Width) */}
            <TouchableOpacity 
              onPress={handleOpenWebsite}
              style={styles.viewOriginalButton}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ExternalLinkIcon width={20} height={20} color="#BF5700" />
              <Text style={styles.viewOriginalButtonText}>View Original Listing</Text>
              </View>
              <ArrowUpRightIcon width={25} height={25} stroke="#8B6F47" />
            </TouchableOpacity>

            {/* Row with Save Button and View Apartment Details */}
            <View style={styles.bottomButtonRow}>
              {/* Save Button */}
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
                <View style={isSaved ? styles.saveButtonContent : styles.saveButtonContent}>
                  {isSaved ? (
                    <>
                      <SaveFilledIconHeart width={20} height={20} fill="#BF5700"/>
                      <Text style={styles.saveButtonText}>Saved</Text>
                    </>
                  ) : (
                    <>
                      <SaveOutlineIconHeart width={20} height={20} stroke="#BF5700" />
                      <Text style={styles.saveButtonText}>Save</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {/* View Apartment Details Button */}
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
      <TouchableOpacity 
            style={styles.backButtonOverlay}
            onPress={() => navigation.goBack()}
          >
            <BlurView intensity={80} style={styles.circularButton} tint="light">
              <BackIcon width={22} height={22} fill="#ffffff"/>
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
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  sectionIcon: {
    marginRight: 8,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  featureItem: {
    fontSize: 16,
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
  contactButtonText: {
    color: '#000000ff',
    fontSize: 23,
    fontWeight: '500',
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
    color: '#6b7280',
  },
  rightInfo: {
    marginLeft: 16,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    marginBottom: 10,
    gap: 13,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
    borderTopWidth: 1,          
    borderTopColor: '#e5e7eb', 
  },
  // View Original Listing Button
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
    fontSize: 16,
    fontWeight: '500',
  },
  // Bottom Button Row
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
  // Save Button (Unsaved State)
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
    fontSize: 16,
    fontWeight: '500',
  },
  // Save Button (Saved State)
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
  // View Details Button
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
    marginTop: 15,
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
    fontWeight: 'bold',
    color: '#000000',
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
    color: '#6b7280',
  },
  contactItem: {
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  contactValueClickable: {
    fontSize: 16,
    color: '#BF5700',  
    lineHeight: 24,
    textDecorationLine: 'underline', 
  },
});