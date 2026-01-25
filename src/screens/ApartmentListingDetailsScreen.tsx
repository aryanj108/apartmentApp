import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking
} from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';

import Stars from '../../assets/stars.svg';
import { buildingsData } from '../data/buildings';
import { listingsData } from '../data/listings';
import { calculateMatchScore } from '../data/matchingAlgorithm';
import BedIcon from '../../assets/bedIcon.svg';
import DistanceIcon from '../../assets/distanceIcon(2).svg';
import BathIcon from '../../assets/bathIcon.svg';
import DescriptionIcon from '../../assets/descriptionIcon.svg';
import ReviewIcon from '../../assets/reviewIcon.svg';
import FeaturesIcon from '../../assets/featuresIcon.svg';
import ContactIcon from '../../assets/contactIcon.svg';
import LeaseIcon from '../../assets/leaseIcon.svg';
import BackIcon from '../../assets/backIcon.svg';
import KeysIcon from '../../assets/keys.svg';
import { usePreferences } from '../context/PreferencesContext';
import SaveOutlineIcon from '../../assets/saveIcon.svg';
import SaveFilledIcon from '../../assets/filledInSaveIcon.svg';
import SaveOutlineIconHeart from '../../assets/heartOutline.svg';
import SaveFilledIconHeart from '../../assets/heart.svg';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

import ImageCarousel from '../navigation/ImageCarousel';

function UnitCard({ listing, matchScore, onPress }) {
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
          {matchScore !== undefined && (
            <LinearGradient
              colors={['#FF8C42', '#BF5700', '#994400']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 1 }}
              style={styles.unitMatchBadge}
            >
              <Stars width={12} height={12} fill={'#ffffff'}/>
              <Text style={styles.unitMatchText}> {matchScore}%</Text>
            </LinearGradient>
          )}
          <Text style={styles.unitPrice}>${listing.price}/mo</Text>
          <Text style={styles.viewDetailsText}>View Details →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ApartmentListingDetailsScreen({ navigation, visible, onClose, route }) {

const { savedIds, toggleSave, preferences } = usePreferences();

const [building, setBuilding] = useState(null);
const [availableUnits, setAvailableUnits] = useState([]);

useEffect(() => {
  console.log('passedListing:', apartment);
  console.log('preferences:', preferences);
  
  if (!apartment?.id) return;

  const foundBuilding =
    buildingsData.find(b => b.id === apartment.buildingId || b.id === apartment.id) ||
    apartment;

  console.log('foundBuilding:', foundBuilding);
  setBuilding(foundBuilding);

  const buildingId = apartment.buildingId || apartment.id;
  const units = listingsData.filter(l => l.buildingId === buildingId);
  
  console.log('units found:', units.length);

  const allAmenities = ['wifi', 'gym', 'pool', 'parking', 'furnished', 'petFriendly'];
  
  const selectedAmenities = allAmenities.map(amenity => ({
    id: amenity,
    selected: preferences?.[amenity] || false,
  }));

  console.log('selectedAmenities:', selectedAmenities);

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
  const isSaved = savedIds.includes(apartment.id);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        
        {/* Image Gallery Section */}
        <View style={styles.imageGalleryContainer}>
          
          {/* Back Button positioned ON the image section */}
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

          <ImageCarousel images={apartment.images || []} />
        </View>

        {/* Basic Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoContent}>
            {/* Left side: Name and Address */}
            <View style={styles.leftInfo}>
              <Text style={styles.apartmentName}>{apartment.name}</Text>
              <Text style={styles.address}>{apartment.address}</Text>
            </View>
          </View>
        </View>

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

        {/* Reviews - Only show if there are reviews */}
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

        {/* Features - Only show if there are features */}
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

        {/* Contact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ContactIcon width={24} height={24} style={styles.sectionIcon} />
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

        {/* Available Units */}
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
                  navigation.navigate('RoomListingDetailsScreen', {
                    listing: {
                      ...unit,
                      name: apartment.name,
                      address: apartment.address,
                      distance: apartment.distance,
                      images: apartment.images,
                      description: apartment.description,
                      reviews: apartment.reviews,          
                      features: apartment.features,         
                      contact: apartment.contact,
                      leaseDetails: apartment.leaseDetails, 
                      website: apartment.website,
                    },
                    matchScore: unit.matchScore,
                  })
                }
              />
            ))}
          </View>
        )}

      {/* Website Button - Only show if website exists */}
      {apartment.website && (
        <View style={styles.websiteButtonContainer}>
          <TouchableOpacity onPress={async () => {
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
            <LinearGradient
              colors={['#FF8C42', '#BF5700', '#994400']} 
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.contactButton}
            >
              <Text style={styles.contactButtonText}>Visit Website</Text>
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
  unitsSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
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
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  unitCardLeft: {
    flex: 1,
  },
  unitNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  floorPlan: {
    fontSize: 14,
    color: '#BF5700',
    fontWeight: '600',
    marginBottom: 8,
  },
  unitDetails: {
    flexDirection: 'row',
  },
  unitDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
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
  unitPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#BF5700',
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
});