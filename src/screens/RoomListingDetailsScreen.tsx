import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Alert, Animated, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import BedIcon from '../../assets/bedIcon.svg';
import DistanceIcon from '../../assets/distanceIcon(2).svg';
import BathIcon from '../../assets/bathIcon.svg';
import DescriptionIcon from '../../assets/descriptionIcon.svg';
import FeaturesIcon from '../../assets/featuresIcon.svg';
import ContactIcon from '../../assets/contactIcon.svg';
import LeaseIcon from '../../assets/leaseIcon.svg';
import BackIcon from '../../assets/backIcon.svg';
import { usePreferences } from '../context/PreferencesContext';
import SaveOutlineIconHeart from '../../assets/heartOutline.svg';
import SaveFilledIconHeart from '../../assets/heart.svg';
import StarIcon from '../../assets/stars.svg';
import ExternalLinkIcon from '../../assets/shareIcon2.svg';
import { buildingsData } from '../data/buildings';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import ImageCarousel from '../navigation/ImageCarousel';

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

  // Get building data based on buildingId from listing
  const buildingData = buildingsData.find(b => b.id === listing.buildingId) || {};

  // Merge listing data with building data
  const apartment = {
    // Room-specific data from listing
    id: listing.id,
    unitNumber: listing.unitNumber,
    price: listing.price,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    sqft: listing.sqft,
    floorPlan: listing.floorPlan,
    available: listing.available,
    availableDate: listing.availableDate,
    deposit: listing.deposit,
    leaseTerm: listing.leaseTerm,
    
    // Room-specific fields (if they exist on listing)
    description: listing.description || buildingData.description || "No description available.",
    features: listing.features || buildingData.features || [],
    website: listing.website || buildingData.website || "",
    smartHousing: listing.smartHousing || false,
    moveInFee: listing.moveInFee,
    
    // Building data
    name: buildingData.name || 'Apartment',
    address: buildingData.address || 'Address not available',
    distance: buildingData.distance || 0,
    images: buildingData.images || [],
    contact: buildingData.contact || {
      phone: '',
      email: '',
      hours: ''
    },
    
    // Override lease details if room has specific ones
    leaseDetails: {
      term: listing.leaseTerm || buildingData.leaseDetails?.term || '',
      deposit: listing.deposit ? `$${listing.deposit}` : buildingData.leaseDetails?.deposit || '',
      availability: listing.availableDate || buildingData.leaseDetails?.availability || '',
      moveInFee: listing.moveInFee ? `$${listing.moveInFee}` : undefined
    }
  };

  const isSaved = savedIds.includes(apartment.id);

  const handleViewApartmentDetails = () => {
    navigation.navigate('ApartmentListingDetails', {
      listing: buildingData,
      matchScore: matchScore,
    });
  };

  const handleOpenWebsite = () => {
    if (apartment.website) {
      Linking.openURL(apartment.website).catch(err => {
        Alert.alert('Error', 'Unable to open website');
      });
    }
  };

  const details = [
    { id: 'bath', label: `${apartment.bathrooms} Bath${apartment.bathrooms !== 1 ? 's' : ''}`, icon: BathIcon },
    { id: 'bed', label: `${apartment.bedrooms} Bed${apartment.bedrooms !== 1 ? 's' : ''}`, icon: BedIcon },
    { id: 'distance', label: `${apartment.distance} Mile${apartment.distance !== 1 ? 's' : ''}`, icon: DistanceIcon },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Image Gallery Section */}
        <View style={styles.imageGalleryContainer}>
          <ImageCarousel images={apartment.images} />
          
          <TouchableOpacity
            style={styles.backButtonOverlay}
            onPress={() => navigation.goBack()}
          >
            <BackIcon width={24} height={24} />
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
              toggleSave(apartment.id);
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
        </View>

        {/* Basic Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoContent}>
            <View style={styles.leftInfo}>
              <Text style={styles.apartmentName}>{apartment.name}</Text>
              <Text style={styles.unitNumber}>Unit {apartment.unitNumber}</Text>
              <Text style={styles.address}>{apartment.address}</Text>
              {apartment.smartHousing && (
                <View style={styles.smartBadge}>
                  <Text style={styles.smartBadgeText}>SMART Housing</Text>
                </View>
              )}
            </View>
            <View style={styles.rightInfo}>
              <Text style={styles.price}>${apartment.price}/mo</Text>
              {apartment.sqft && (
                <Text style={styles.sqftText}>{apartment.sqft} sqft</Text>
              )}
            </View>
          </View>

          {/* AI Match Score Bar */}
          <View style={styles.matchScoreSection}>
            <View style={styles.matchRow}>
              <View style={styles.matchLabelGroup}>
                <StarIcon width={18} height={18} />
                <Text style={styles.matchScoreTitle}>AI Match Score:</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    { width: widthInterpolate }
                  ]}
                />
              </View>
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
            {apartment.description}
          </Text>
        </View>

        {/* Features */}
        {apartment.features && apartment.features.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FeaturesIcon width={22} height={22} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Features</Text>
            </View>
            {apartment.features.map((feature, index) => (
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
          {apartment.contact?.phone && (
            <Text style={styles.featureItem}>• Phone Number: {apartment.contact.phone}</Text>
          )}
          {apartment.contact?.email && (
            <Text style={styles.featureItem}>• Email: {apartment.contact.email}</Text>
          )}
          {apartment.contact?.hours && (
            <Text style={styles.featureItem}>• Hours: {apartment.contact.hours}</Text>
          )}
          {!apartment.contact?.phone && !apartment.contact?.email && !apartment.contact?.hours && (
            <Text style={styles.featureItem}>• Contact information not available</Text>
          )}
        </View>

        {/* Lease Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <LeaseIcon width={22} height={22} style={styles.sectionIcon} />
            <Text style={styles.sectionTitle}>Lease Details</Text>
          </View>
          {apartment.leaseDetails?.term && (
            <Text style={styles.featureItem}>• Lease Term: {apartment.leaseDetails.term}</Text>
          )}
          {apartment.leaseDetails?.deposit && (
            <Text style={styles.featureItem}>• Security Deposit: {apartment.leaseDetails.deposit}</Text>
          )}
          {apartment.leaseDetails?.moveInFee && (
            <Text style={styles.featureItem}>• Move-In Fee: {apartment.leaseDetails.moveInFee}</Text>
          )}
          {apartment.leaseDetails?.availability && (
            <Text style={styles.featureItem}>• Availability: {apartment.leaseDetails.availability}</Text>
          )}
          {!apartment.leaseDetails?.term && !apartment.leaseDetails?.deposit && !apartment.leaseDetails?.availability && (
            <Text style={styles.featureItem}>• Lease details not available</Text>
          )}
        </View>

        {/* View Original Listing Button - Only show if website exists */}
        {apartment.website && (
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
  unitNumber: {
    fontSize: 16,
    color: '#BF5700',
    fontWeight: '600',
    marginBottom: 4,
  },
  address: {
    fontSize: 16,
    color: '#6b7280',
  },
  smartBadge: {
    backgroundColor: '#BF5700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  smartBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rightInfo: {
    marginLeft: 16,
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  sqftText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
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
  section: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  websiteButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  buildingButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#BF5700',
  },
  buildingButtonText: {
    color: '#BF5700',
    fontSize: 18,
    fontWeight: '600',
  },
});