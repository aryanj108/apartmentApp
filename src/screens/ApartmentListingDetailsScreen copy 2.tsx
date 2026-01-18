import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useState, useEffect } from 'react';
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
            <View style={styles.unitMatchBadge}>
              <Stars width={12} height={12} />
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

export default function ApartmentListingDetailsScreen({ navigation, visible, onClose, route }) {

const { savedIds, toggleSave, preferences } = usePreferences();

const [building, setBuilding] = useState(null);
const [availableUnits, setAvailableUnits] = useState([]);

useEffect(() => {
  if (!apartment?.id) return;

  const foundBuilding =
    buildingsData.find(b => b.id === apartment.buildingId || b.id === apartment.id) ||
    apartment;

  setBuilding(foundBuilding);

  const buildingId = apartment.buildingId || apartment.id;
  const units = listingsData.filter(l => l.buildingId === buildingId);

  const allAmenities = ['wifi', 'gym', 'pool', 'parking', 'furnished', 'petFriendly'];
  const selectedAmenities = allAmenities.filter(a => preferences?.[a]);

  const scoredUnits = units.map(unit => {
    const score = calculateMatchScore(
      { ...unit, amenities: foundBuilding.amenities || [] },
      preferences,
      selectedAmenities.map(id => ({ id, selected: true }))
    );
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


  // Create details array based on apartment data
  const details = [
    { 
      id: 'bath', 
      label: `${apartment.bathrooms} Bath${apartment.bathrooms !== 1 ? 's' : ''}`, 
      icon: BathIcon 
    },
    { 
      id: 'bed', 
      label: `${apartment.bedrooms} Bed${apartment.bedrooms !== 1 ? 's' : ''}`, 
      icon: BedIcon 
    },
    { 
      id: 'distance', 
      label: `${apartment.distance} Mile${apartment.distance !== 1 ? 's' : ''}`, 
      icon: DistanceIcon 
    },
  ];

  return (
<View style={styles.container}>
      {/* Scrollable Content */}
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

        <TouchableOpacity
          activeOpacity={0.7} // optional: makes it fade slightly when pressed
          onPress={() => {
            const wasSaved = isSaved;

            Alert.alert(
            wasSaved ? 'Listing Unsaved' : 'Listing Saved',
            wasSaved
              ? 'This listing has been removed from your saved listings.'
              : 'This listing has been added to your saved listings.'
          );
              toggleSave(apartment.id)
          }}
          style={{
            position: 'absolute',
            top: 50,
            right: 20,
            zIndex: 100,
          }}
        >
          <View
            style={{
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
            }}
          >
              {isSaved ? (
                <SaveFilledIconHeart width={16} height={16} />
              ) : (
                <SaveOutlineIconHeart width={16} height={16} />
              )}
            <Text style={{ fontSize: 14, fontWeight: 'bold', marginLeft: 6 }}>
              {isSaved ? 'Saved' : 'Save Listing'}
            </Text>
          </View>
        </TouchableOpacity>

          <ImageCarousel images={apartment.images || []} />
        </View>

        {/* Basic Info */}
        <View style={styles.infoSection}>
           {/* ... rest of your existing content ... */}
        </View>
        <View style={styles.infoSection}>
          <View style={styles.infoContent}>
            {/* Left side: Name and Address */}
            <View style={styles.leftInfo}>
              <Text style={styles.apartmentName}>{apartment.name}</Text>
              <Text style={styles.address}>{apartment.address}</Text>
            </View>

            {/* Right side: Price */}
            <View style={styles.rightInfo}>
              <Text style={styles.price}>${apartment.price}/mo</Text>
            </View>
          </View>
        </View>

        <View style={styles.chipsContainer}>
          {details.map((detail) => (
            <View 
              key={detail.id}
              style={[styles.chip]}
            >
              <View style={styles.chipContent}>
                <detail.icon 
                  width={24} 
                  height={24} 
                  style={styles.chipIconLeft}
                />
                <Text style={[styles.chipText]}>
                  {detail.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      
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

        {/* Reviews - Only show if there are reviews */}
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

        {/* Features - Only show if there are features */}
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

        {/* Lease Details */}
        <View style={[styles.section, { borderBottomWidth: 0 }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainerDistance}>
              <LeaseIcon width={33} height={33} style={styles.icon} />
            </View>
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
          <View style={styles.unitsSection}>
            <View style={styles.unitsSectionHeader}>
              <Text style={styles.unitsSectionTitle}>
                Available Units ({availableUnits.length})
              </Text>
              <Text style={styles.unitsSectionSubtitle}>
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
                      contact: apartment.contact,
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
  position: 'relative',  // Allows absolute positioning of back button
  height: 400,  // Match the carousel height
},
  backButtonOverlay: {
    position: 'absolute',
    top: 40, // Distance from top of the image section
    left: 20, // Distance from left of the image section
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
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 0,
      paddingHorizontal: 20,  // Keep left/right padding
  paddingBottom: 20,      // Keep bottom padding
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
// Units Section
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