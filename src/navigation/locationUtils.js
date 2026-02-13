/**
 * Calculate haversine distance between two coordinates
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal
}

/**
 * Filter apartments by distance from a location
 * @param {Array} apartments - Array of apartment objects with lat/lon
 * @param {Object} location - Location object with lat/lon
 * @param {number} maxDistance - Maximum distance in miles
 * @returns {Array} Filtered apartments with distance property added
 */
export function filterApartmentsByDistance(apartments, location, maxDistance) {
  return apartments
    .map(apartment => ({
      ...apartment,
      distance: calculateDistance(
        location.lat,
        location.lon,
        apartment.latitude,
        apartment.longitude
      )
    }))
    .filter(apartment => apartment.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance); // Sort by closest first
}