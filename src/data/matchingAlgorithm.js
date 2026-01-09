/**
 * Calculate match score with dynamic weights from learning
 */
export const calculateMatchScore = (apartment, preferences, selectedAmenities, customWeights = null) => {
  let score = 0;
  
  // Use custom weights if provided (from learning), otherwise use defaults
  const weights = customWeights || {
    price: 25,
    bedrooms: 20,
    bathrooms: 15,
    distance: 20,
    amenities: 20
  };

  let totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  // 1. Price Match
  const priceWeight = weights.price;
  
  if (preferences.minPrice === 0 && preferences.maxPrice === 0) {
    score += priceWeight;
  } else if (apartment.price >= preferences.minPrice && apartment.price <= preferences.maxPrice) {
    score += priceWeight;
  } else if (apartment.price < preferences.minPrice) {
    const difference = preferences.minPrice - apartment.price;
    const percentOff = Math.min(difference / preferences.minPrice, 1);
    score += priceWeight * (1 - percentOff * 0.3);
  } else {
    const difference = apartment.price - preferences.maxPrice;
    const maxPrice = preferences.maxPrice || 5000;
    const percentOver = Math.min(difference / maxPrice, 1);
    score += priceWeight * (1 - percentOver * 0.5);
  }

  // 2. Bedroom Match
  const bedroomWeight = weights.bedrooms;
  
  if (apartment.bedrooms === preferences.beds) {
    score += bedroomWeight;
  } else if (apartment.bedrooms > preferences.beds) {
    const difference = apartment.bedrooms - preferences.beds;
    score += bedroomWeight * Math.max(0.6, 1 - (difference * 0.2));
  } else {
    const difference = preferences.beds - apartment.bedrooms;
    score += bedroomWeight * Math.max(0.3, 1 - (difference * 0.3));
  }

  // 3. Bathroom Match
  const bathroomWeight = weights.bathrooms;
  
  if (apartment.bathrooms === preferences.bathrooms) {
    score += bathroomWeight;
  } else if (apartment.bathrooms > preferences.bathrooms) {
    const difference = apartment.bathrooms - preferences.bathrooms;
    score += bathroomWeight * Math.max(0.7, 1 - (difference * 0.15));
  } else {
    const difference = preferences.bathrooms - apartment.bathrooms;
    score += bathroomWeight * Math.max(0.4, 1 - (difference * 0.25));
  }

  // 4. Distance Match
  const distanceWeight = weights.distance;
  
  if (apartment.distance <= preferences.distance) {
    const ratio = apartment.distance / preferences.distance;
    score += distanceWeight * (1 - ratio * 0.3);
  } else {
    const overDistance = apartment.distance - preferences.distance;
    const penalty = Math.min(overDistance / preferences.distance, 1);
    score += distanceWeight * (1 - penalty * 0.7);
  }

  // 5. Amenities Match
  const amenitiesWeight = weights.amenities;
  
  const selectedAmenityIds = selectedAmenities
    .filter(a => a.selected)
    .map(a => a.id);
  
  if (selectedAmenityIds.length === 0) {
    score += amenitiesWeight;
  } else {
    const matchingAmenities = selectedAmenityIds.filter(id => 
      apartment.amenities.includes(id)
    );
    const amenityMatchRatio = matchingAmenities.length / selectedAmenityIds.length;
    score += amenitiesWeight * amenityMatchRatio;
  }

  return Math.round((score / totalWeight) * 100);
};

//export const getMatchDescription = (score) => {
  //if (score >= 90) return 'Excellent Match';
 // if (score >= 80) return 'Great Match';
  //if (score >= 70) return 'Good Match';
 // if (score >= 60) return 'Fair Match';
 // return 'Low Match';
//};

export const getMatchColor = (score) => {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#34d399';
  if (score >= 70) return '#fbbf24';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};