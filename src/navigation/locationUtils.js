// Calculates the straight-line distance between two GPS coordinates using the
// Haversine formula, which accounts for the curvature of the Earth. Returns
// miles rounded to one decimal place.
//
// Haversine is accurate enough for apartment searching (sub-50 mile range) and
// much cheaper than a routing API. Note: this is crow-flies distance, not walking/driving.
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

// Takes the full apartments array, attaches a distance to each one, filters out
// anything beyond maxDistance, and returns the rest sorted closest-first.
//
// We map first so each distance is only calculated once — not again during
// the filter or sort steps.
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