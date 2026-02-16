import { getDistance } from "./geolocation";

/**
 * Adds a random offset to a location (latitude/longitude) to protect user privacy.
 * The offset is between 500m and 1.5km in a random direction.
 * 
 * @param latitude Original latitude
 * @param longitude Original longitude
 * @returns { latitude: number, longitude: number } Fuzzed coordinates
 */
export function fuzzLocation(latitude: number, longitude: number): { latitude: number; longitude: number } {
    const R = 6371; // Earth's radius in km

    // Random distance between 0.5km and 1.5km
    const minDistance = 0.5;
    const maxDistance = 1.5;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);

    // Random bearing (0-360 degrees) in radians
    const bearing = Math.random() * 2 * Math.PI;

    const latRad = latitude * (Math.PI / 180);
    const lonRad = longitude * (Math.PI / 180);

    // Handle distance/radius ratio
    const ratio = distance / R;

    // Calculate new latitude
    const newLatRad = Math.asin(
        Math.sin(latRad) * Math.cos(ratio) +
        Math.cos(latRad) * Math.sin(ratio) * Math.cos(bearing)
    );

    // Calculate new longitude
    const newLonRad = lonRad + Math.atan2(
        Math.sin(bearing) * Math.sin(ratio) * Math.cos(latRad),
        Math.cos(ratio) - Math.sin(latRad) * Math.sin(newLatRad)
    );

    // Convert back to degrees
    return {
        latitude: newLatRad * (180 / Math.PI),
        longitude: newLonRad * (180 / Math.PI)
    };
}

/**
 * Returns a generalized address string (e.g. City, Country) instead of exact address.
 * If no component found, returns a generic privacy string.
 * This is a placeholder - actual address parsing depends on the Geocoding API response format.
 * For now, we return a generic string to be safe.
 */
export function getApproximateAddress(fullAddress?: string): string {
    if (fullAddress) {
        // Remove postal codes (5 digits in Spain, but works for general 4-6 digits)
        const noZip = fullAddress.replace(/\b\d{4,6}\b/g, "").trim();

        // Split by comma
        const parts = noZip.split(',').map(p => p.trim()).filter(p => p.length > 0);

        // Filter out "Spain" or "España" as it's redundant for this app
        const cleanedParts = parts.filter(p => !/^(spain|españa|espania)$/i.test(p));

        if (cleanedParts.length >= 1) {
            // Grab the last 2 parts (usually Town, Province)
            // Use Set to remove duplicates
            const lastParts = cleanedParts.slice(-2);
            return [...new Set(lastParts)].join(', ');
        }

        // If only one part remains after stripping, return it
        if (parts.length === 1) {
            return parts[0];
        }
    }

    return fullAddress || "";
}
