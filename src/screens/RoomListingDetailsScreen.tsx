import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Alert, Animated, Linking, Platform} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { buildingsData } from '../data/buildings';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import ImageCarousel from '../navigation/ImageCarousel';

  // Helper function to open maps with directions
  const openMaps = (destinationAddress: string) => {
    // UT Austin coordinates
    const utLatitude = 30.285340698031447;
    const utLongitude = -97.73208396036748;
    
    // Encode the address for URL
    const encodedAddress = encodeURIComponent(destinationAddress);
    
    let url = '';
    
    if (Platform.OS === 'ios') {
      // Apple Maps URL scheme
      url = `maps://app?saddr=${utLatitude},${utLongitude}&daddr=${encodedAddress}`;
      
      // Fallback to Google Maps on iOS if Apple Maps fails
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${utLatitude},${utLongitude}&destination=${encodedAddress}`;
      
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
      // Google Maps for Android
      url = `https://www.google.com/maps/dir/?api=1&origin=${utLatitude},${utLongitude}&destination=${encodedAddress}`;
      
      Linking.openURL(url).catch(err => {
        Alert.alert('Error', 'Unable to open maps. Please make sure you have a maps app installed.');
        console.error('Error opening maps:', err);
      });
    }
  };

export default function RoomListingDetailsScreen({ navigation, route }) {
  const { savedIds, toggleSave } = usePreferences();
  const { listing, matchScore } = route.params;
  const scoreValue = matchScore || 0;
  const animatedWidth = useRef(new Animated.Value(0)).current;

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

  // Merge listing and building data
  const roomData = {
    id: listing.id,
    buildingName: building.name,
    unitNumber: listing.unitNumber,
    address: building.address || 'Address not available',
    price: listing.price || 0,
    bedrooms: listing.bedrooms || 0,
    bathrooms: listing.bathrooms || 0,
    distance: building.distance || 0,
    // Use listing description if it exists, otherwise use building description
    description: (listing.description && listing.description.trim()) 
      ? listing.description 
      : (building.description || 'No description available.'),
    // Use listing features if they exist, otherwise use building features
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
    smartHousing: listing.smartHousing
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
            style={styles.backButtonOverlay}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.saveBadge}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <BackIcon width={20} height={20} />
              </View>
            </View>
          </TouchableOpacity>

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
          >
            {isSaved ? (
              <LinearGradient
                colors={['#FF8C42', '#BF5700', '#994400']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonContent}
              >
                <SaveFilledIconHeart width={20} height={20} fill="#ffffff"/>
                <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>Saved</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.saveButtonContent, { backgroundColor: '#ffffff' }]}>
                <SaveOutlineIconHeart width={20} height={20} />
                <Text style={[styles.saveButtonText, { color: '#000000' }]}>Save Listing</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* SMART Housing Badge 
          {roomData.smartHousing && (
            <View style={styles.smartHousingBadgeContainer}>
              <LinearGradient
                colors={['#FF8C42', '#BF5700', '#994400']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.smartHousingBadge}
              >
                <Text style={styles.smartHousingBadgeText}>SMART Housing</Text>
              </LinearGradient>
            </View>
          )}*/}
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
          {details.map((detail) => (
            <View key={detail.id} style={styles.chip}>
              <View style={styles.chipContent}>
                <detail.icon width={24} height={24} />
                <Text style={styles.chipText}>{detail.label}</Text>
              </View>
            </View>
          ))}
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
            <ContactIcon width={22} height={22} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Contact</Text>
          </View>
          {roomData.contact?.phone && (
            <Text style={styles.featureItem}>• Phone Number: {roomData.contact.phone}</Text>
          )}
          {roomData.contact?.email && (
            <Text style={styles.featureItem}>• Email: {roomData.contact.email}</Text>
          )}
          {roomData.contact?.hours && (
            <Text style={styles.featureItem}>• Hours: {roomData.contact.hours}</Text>
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

        {/* View Original Listing Button - Only show if website exists */}
        {roomData.website && (
          <View style={styles.websiteButtonContainer}>
            <TouchableOpacity onPress={handleOpenWebsite}>
              <LinearGradient
                colors={['#FF8C42', '#BF5700', '#994400']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.contactButton}
              >
                <View style={styles.websiteButtonContent}>
                  <ExternalLinkIcon width={27} height={27} color="#ffffff" style={styles.externalLinkIcon} />
                  <Text style={styles.contactButtonText}>View Original Listing</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    fontSize: 18,
    fontWeight: '600',
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
    marginBottom: 2,
  },
  address: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
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
  rightInfo: {
    marginLeft: 16,
    alignItems: 'flex-end',
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
  apartmentLinkSection: {
    padding: 20,
    backgroundColor: '#f9fafb',
    marginHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  subHeaderText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  apartmentButton: {
    backgroundColor: '#BF5700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  apartmentButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
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
  saveButtonContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden'
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  smartHousingBadgeContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    zIndex: 100,
  },
  smartHousingBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  smartHousingBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  websiteButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  websiteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  externalLinkIcon: {
    tintColor: '#ffffff',
    marginTop: -3 
  },
});