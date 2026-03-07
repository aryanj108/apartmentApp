// Calculates a 0–100 match score between an apartment and the user's preferences.
// Each category (price, bedrooms, bathrooms, distance, amenities) contributes a
// weighted portion of the total score. Weights default to the values below but can
// be overridden by a learned weights object passed in from the recommendation engine,
// allowing the scoring to adapt to what a specific user actually cares about most.
export const calculateMatchScore = (apartment, preferences, selectedAmenities, customWeights = null) => {
  let score = 0;

  // Use custom weights if provided (from learning), otherwise use defaults
  const weights = customWeights || {
    price: 25,
    bedrooms: 20,
    bathrooms: 15,
    distance: 20,
    amenities: 20,
  };

  // totalWeight may not equal 100 if custom weights are passed in, so we always
  // divide by the actual sum at the end to normalize correctly.
  let totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  // 1. Price Match
  // Full score if the apartment falls within the user's price range.
  // Below the minimum gets a mild penalty (only 30% deduction at worst) since
  // cheaper-than-expected is usually fine. Above the max is penalized harder
  // (up to 50%) since going over budget is a stronger dealbreaker.
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
  // More bedrooms than requested is only a minor penalty (floored at 60%) since
  // extra space is generally acceptable. Fewer bedrooms is penalized more steeply
  // (floored at 30%) since running out of space is a harder constraint.
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
  // Same asymmetric logic as bedrooms — extra bathrooms are more tolerable than
  // fewer, so the floors and per-unit penalties differ between the two branches.
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
  // Being closer than the limit still gets a small penalty scaled by how close
  // (ratio * 0.3) to reward apartments that are very close to campus/work.
  // Going over the distance limit drops the score quickly — up to 70% deduction —
  // since distance is a hard practical constraint for most users.
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
  // Only scores against amenities the user has explicitly selected — if none are
  // selected we grant full points since the user has no amenity preference.
  // Score scales linearly with the fraction of requested amenities matched.
  const amenitiesWeight = weights.amenities;

  const selectedAmenityIds = selectedAmenities
    .filter((a) => a.selected)
    .map((a) => a.id);

  if (selectedAmenityIds.length === 0) {
    score += amenitiesWeight;
  } else {
    const matchingAmenities = selectedAmenityIds.filter((id) =>
      apartment.amenities.includes(id)
    );
    const amenityMatchRatio = matchingAmenities.length / selectedAmenityIds.length;
    score += amenitiesWeight * amenityMatchRatio;
  }

  // Normalize the raw score against totalWeight and convert to a 0–100 integer.
  return Math.round((score / totalWeight) * 100);
};

//export const getMatchDescription = (score) => {
//  if (score >= 90) return 'Excellent Match';
//  if (score >= 80) return 'Great Match';
//  if (score >= 70) return 'Good Match';
//  if (score >= 60) return 'Fair Match';
//  return 'Low Match';
//};

// Maps a match score to a color for UI display.
// Green shades for strong matches, yellow/amber for moderate, red for poor.
export const getMatchColor = (score) => {
  if (score >= 90) return '#10b981';
  if (score >= 80) return '#34d399';
  if (score >= 70) return '#fbbf24';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};