import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';

import BedIcon from '../../assets/bedIcon.svg';
import DistanceIcon from '../../assets/distanceIcon(2).svg';
import BathIcon from '../../assets/bathIcon.svg';
import DescriptionIcon from '../../assets/descriptionIcon.svg';
import ReviewIcon from '../../assets/reviewIcon.svg';
import FeaturesIcon from '../../assets/featuresIcon.svg';
import ContactIcon from '../../assets/contactIcon.svg';
import LeaseIcon from '../../assets/leaseIcon.svg';
import BackIcon from '../../assets/backIcon.svg';
import Stars from '../../assets/stars.svg';
import SaveFilledIconHeart from '../../assets/heart.svg';
import SaveOutlineIconHeart from '../../assets/heartOutline.svg';

import { usePreferences } from '../context/PreferencesContext';
import { buildingsData } from '../data/buildings';
import { listingsData } from '../data/listings';
import { calculateMatchScore } from '../data/matchingAlgorithm';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import ImageCarousel from '../navigation/ImageCarousel';

// Unit Card Component
function UnitCard({ listing, building, matchScore, onPress }) {
  return (
    <TouchableOpacity
      style={styles.unitCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.unitCardContent}>
        <View style={styles.unitCardLeft}>
          <Text style={styles.unitNumber}>Unit {listing.unitNumber}</Text>
          <Text style={styles.floorPlan}>{listing.floorPlan}</Text>
          <View style={styles.unitDetails}>
            <View style={styles.unitDetailItem}>
              <BedIcon width={14} height={14} />
              <Text style={styles.unitDetailText}>{listing.bedrooms} Bed</Text>
            </View>
            <View style={styles.unitDetailItem}>
              <BathIcon width={14} height={14} />
              <Text style={styles.unitDetailText}>{listing.bathrooms} Bath</Text>
            </View>
          </View>
        </View>
        <View style={styles.unitCardRight}>
          {matchScore && (
            <View style={styles.unitMatchBadge}>
              <Stars width={12} height={12} fill={'#ffffff'} />
              <Text style={styles.unitMatchText}> {matchScore}%</Text>
            </View>
          )}
          <Text style={styles.unitPrice}>${listing.price}/mo</Text>
          <Text style={styles.viewDetailsText}>View Details →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ApartmentListingDetailsScreen({ navigation, route }) {
  const { savedIds, toggleSave, preferences } = usePreferences();
  const passedListing = route.params?.listing;
  
  const [building, setBuilding] = useState(null);
  const [availableUnits, setAvailableUnits] = useState([]);

  useEffect(() => {
    if (passedListing) {
      // Find the building
      const foundBuilding = buildingsData.find(b => b.id === passedListing.buildingId || b.id === passedListing.id);
      setBuilding(foundBuilding || passedListing);

      // Get all listings for this building
      const buildingId = passedListing.buildingId || passedListing.id;
      const units = listingsData.filter(listing => listing.buildingId === buildingId);
      
      // Calculate match scores for each unit
      const allAmenities = ['wifi', 'gym', 'pool', 'parking', 'furnished', 'petFriendly'];
      const selectedAmenities = allAmenities.filter(amenity => preferences?.[amenity]);
      
      const unitsWithScores = units.map(unit => {
        const enrichedUnit = {
          ...unit,
          amenities: foundBuilding?.amenities || [],
          images: foundBuilding?.images || [],
        };
        const score = calculateMatchScore(
          enrichedUnit,
          preferences,
          selectedAmenities.map(id => ({ id, selected: true }))
        );
        return { ...unit, matchScore: score };
      });

      // Sort by match score
      const sorted = unitsWithScores.sort((a, b) => b.matchScore - a.matchScore);
      setAvailableUnits(sorted);
    }
  }, [passedListing, preferences]);

  const apartment = building || {
    name: 'Modern Downtown Loft',
    address: '123 Main St, Downtown',
    distance: 0.5,
    description: "Beautiful modern loft in the heart of downtown.",
    reviews: [],
    features: [],
    contact: { phone: '', email: '', hours: '' },
    website: ''
  };

  const isSaved = savedIds.includes(apartment.id);

  const details = [
    { 
      id: 'distance', 
      label: `${apartment.distance} Mile${apartment.distance !== 1 ? 's' : ''}`, 
      icon: DistanceIcon 
    },
  ];

  const handleUnitPress = (unit) => {
    const enrichedUnit = {
      ...unit,
      name: building?.name || apartment.name,
      address: building?.address || apartment.address,
      distance: building?.distance || apartment.distance,
      amenities: building?.amenities || apartment.amenities || [],
      images: building?.images || apartment.images || [],
      description: building?.description || apartment.description || '',
      features: building?.features || apartment.features || [],
      reviews: building?.reviews || apartment.reviews || [],
      contact: building?.contact || apartment.contact || {},
      website: building?.website || apartment.website || '',
    };

    navigation.navigate('RoomListingDetailsScreen', {
      listing: enrichedUnit,
      matchScore: unit.matchScore,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        
        {/* Image Gallery Section */}
        <View style={styles.imageGalleryContainer}>
          
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButtonOverlay}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.saveBadge}>
              <BackIcon width={20} height={20} />
            </View>
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.7}
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
            style={styles.saveButtonOverlay}
          >
            <View style={styles.saveButtonInner}>
              {isSaved ? (
                <SaveFilledIconHeart width={16} height={16} />
              ) : (
                <SaveOutlineIconHeart width={16} height={16} />
              )}
              <Text style={styles.saveText}>
                {isSaved ? 'Saved' : 'Save Listing'}
              </Text>
            </View>
          </TouchableOpacity>

          <ImageCarousel images={apartment.images || []} />
        </View>

        {/* Basic Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoContent}>
            <View style={styles.leftInfo}>
              <Text style={styles.apartmentName}>{apartment.name}</Text>
              <Text style={styles.address}>{apartment.address}</Text>
            </View>
          </View>
        </View>

        {/* Distance Chip */}
        <View style={styles.chipsContainer}>
          {details.map((detail) => (
            <View key={detail.id} style={styles.chip}>
              <View style={styles.chipContent}>
                <detail.icon width={24} height={24} style={styles.chipIconLeft} />
                <Text style={styles.chipText}>{detail.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Available Units Section */}
        {availableUnits.length > 0 && (
          <View style={styles.unitsSection}>
            <View style={styles.unitsSectionHeader}>
              <Text style={styles.unitsSectionTitle}>
                Available Units ({availableUnits.length})
              </Text>
              <Text style={styles.unitsSectionSubtitle}>
                Tap to view details
              </Text>
            </View>
            {availableUnits.map((unit) => (
              <UnitCard
                key={unit.id}
                listing={unit}
                building={building}
                matchScore={unit.matchScore}
                onPress={() => handleUnitPress(unit)}
              />
            ))}
          </View>
        )}
      
        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainerDistance}>
              <DescriptionIcon width={30} height={30} style={styles.icon} />
            </View>
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          <Text style={styles.description}>
            {apartment.description || 'No description available.'}
          </Text>
        </View>

        {/* Reviews */}
        {apartment.reviews && apartment.reviews.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainerDistance}>
                <ReviewIcon width={30} height={30} style={styles.icon} />
              </View>
              <Text style={styles.sectionTitle}>What Longhorns are Saying</Text>
            </View>
            {apartment.reviews.map((review, index) => (
              <Text key={index} style={styles.featureItem}>• {review}</Text>
            ))}
          </View>
        )}

        {/* Features */}
        {apartment.features && apartment.features.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainerDistance}>
                <FeaturesIcon width={30} height={30} style={styles.icon} />
              </View>
              <Text style={styles.sectionTitle}>Features</Text>
            </View>
            {apartment.features.map((feature, index) => (
              <Text key={index} style={styles.featureItem}>• {feature}</Text>
            ))}
          </View>
        )}

        {/* Contact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainerDistance}>
              <ContactIcon width={30} height={30} style={styles.icon} />
            </View>
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

        {/* Website Button */}
        {apartment.website && (
          <TouchableOpacity style={styles.contactButton}>
            <Text style={styles.contactButtonText}>Visit Website</Text>
          </TouchableOpacity>
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
  saveButtonOverlay: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
  },
  saveButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  saveText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
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
    paddingTop: 0,
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    marginBottom: 10,
    paddingHorizontal: 20,
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
  // Units Section Styles
  unitsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  unitsSectionHeader: {
    marginBottom: 16,
  },
  unitsSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  unitsSectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  unitCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unitCardContent: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitCardLeft: {
    flex: 1,
  },
  unitNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  floorPlan: {
    fontSize: 14,
    color: '#BF5700',
    fontWeight: '600',
    marginBottom: 8,
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
  unitDetailText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
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
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  unitPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#BF5700',
    marginBottom: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
});