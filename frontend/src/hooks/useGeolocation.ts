"use client";

import { useState } from "react";
import { geohashForLocation } from "geofire-common";

interface LocationData {
  latitude: number;
  longitude: number;
  geohash: string;
  address?: string;
}

interface UseGeolocationReturn {
  getCurrentLocation: () => Promise<LocationData | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Generate geohash with precision 7 (approximately 150m x 150m)
          const geohash = geohashForLocation([lat, lng], 7);
          
          setLoading(false);
          resolve({
            latitude: lat,
            longitude: lng,
            geohash,
          });
        },
        (error) => {
          let errorMessage = "Unable to retrieve your location.";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location access.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out.";
              break;
          }
          
          setError(errorMessage);
          setLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  return {
    getCurrentLocation,
    loading,
    error,
    clearError,
  };
};
