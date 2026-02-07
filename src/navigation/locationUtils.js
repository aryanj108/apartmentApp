/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in miles
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Radius of Earth in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
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